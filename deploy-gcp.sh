#!/bin/bash
# ============================================================================
# Literexia Backend — Google Cloud Run Deployment Script
# ============================================================================
# Usage: ./deploy-gcp.sh [first-time|update|secrets]
#
# Commands:
#   first-time  — Full first-time setup (APIs, secrets, deploy, domain)
#   update      — Quick re-deploy after code changes
#   secrets     — Update secrets only
#   status      — Check deployment status
# ============================================================================

set -euo pipefail

# Configuration
PROJECT_ID="literexia-capstone-project"
SERVICE_NAME="literexia-backend"
REGION="asia-southeast1"
MEMORY="2Gi"
CPU="2"
MIN_INSTANCES="1"    # Keep 1 instance warm for background services (auto-processing, monitoring)
MAX_INSTANCES="3"
TIMEOUT="300"
PORT="8080"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "${BLUE}[STEP]${NC} $1"; }

# ──────────────────────────────────────────────────────
# Enable required GCP APIs
# ──────────────────────────────────────────────────────
enable_apis() {
    log_step "Enabling required GCP APIs..."
    gcloud services enable \
        run.googleapis.com \
        cloudbuild.googleapis.com \
        secretmanager.googleapis.com \
        artifactregistry.googleapis.com \
        --project="$PROJECT_ID"
    log_info "All APIs enabled ✅"
}

# ──────────────────────────────────────────────────────
# Setup secrets in GCP Secret Manager
# ──────────────────────────────────────────────────────
setup_secrets() {
    log_step "Setting up secrets in GCP Secret Manager..."
    echo ""
    echo "You'll need these values from your EC2 backend .env file."
    echo "SSH into your EC2 and run: cat ~/backend/.env (or wherever your .env is)"
    echo ""

    declare -a SECRETS=("MONGO_URI" "JWT_SECRET" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "OPENAI_API_KEY" "EMAIL_USER" "EMAIL_PASSWORD")

    for SECRET_NAME in "${SECRETS[@]}"; do
        # Check if secret already exists
        if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
            log_warn "Secret '$SECRET_NAME' already exists. Update it? (y/N)"
            read -r answer
            if [[ "$answer" =~ ^[Yy]$ ]]; then
                echo -n "Enter value for $SECRET_NAME: "
                read -rs SECRET_VALUE
                echo ""
                echo -n "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"
                log_info "Updated $SECRET_NAME ✅"
            else
                log_info "Skipping $SECRET_NAME"
            fi
        else
            echo -n "Enter value for $SECRET_NAME: "
            read -rs SECRET_VALUE
            echo ""
            echo -n "$SECRET_VALUE" | gcloud secrets create "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"
            log_info "Created $SECRET_NAME ✅"
        fi
    done

    # Grant Cloud Run service account access to secrets
    log_step "Granting Cloud Run access to secrets..."
    PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
    SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

    for SECRET_NAME in "${SECRETS[@]}"; do
        gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
            --member="serviceAccount:$SA" \
            --role="roles/secretmanager.secretAccessor" \
            --project="$PROJECT_ID" \
            --quiet 2>/dev/null || true
    done

    log_info "All secrets configured ✅"
}

# ──────────────────────────────────────────────────────
# Deploy to Cloud Run
# ──────────────────────────────────────────────────────
deploy() {
    log_step "Deploying $SERVICE_NAME to Cloud Run ($REGION)..."
    echo ""

    cd "$(dirname "$0")/backend" || { log_error "Cannot find backend directory"; exit 1; }

    gcloud run deploy "$SERVICE_NAME" \
        --source . \
        --region "$REGION" \
        --platform managed \
        --project "$PROJECT_ID" \
        --allow-unauthenticated \
        --memory "$MEMORY" \
        --cpu "$CPU" \
        --cpu-boost \
        --execution-environment gen2 \
        --min-instances "$MIN_INSTANCES" \
        --max-instances "$MAX_INSTANCES" \
        --timeout "$TIMEOUT" \
        --port "$PORT" \
        --set-env-vars "\
NODE_ENV=production,\
FRONTEND_URL=https://literexia.com,\
AWS_REGION=ap-southeast-2,\
AWS_BUCKET_NAME=literexia-bucket" \
        --set-secrets "\
MONGO_URI=MONGO_URI:latest,\
JWT_SECRET=JWT_SECRET:latest,\
AWS_ACCESS_KEY_ID=AWS_ACCESS_KEY_ID:latest,\
AWS_SECRET_ACCESS_KEY=AWS_SECRET_ACCESS_KEY:latest,\
OPENAI_API_KEY=OPENAI_API_KEY:latest,\
EMAIL_USER=EMAIL_USER:latest,\
EMAIL_PASSWORD=EMAIL_PASSWORD:latest" \
        --session-affinity

    cd ..

    log_info "Deployment complete ✅"

    # Get and display the service URL
    BACKEND_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region "$REGION" \
        --project "$PROJECT_ID" \
        --format='value(status.url)')

    echo ""
    log_info "🚀 Backend URL: $BACKEND_URL"
    log_info "Test it: curl $BACKEND_URL/health"
}

# ──────────────────────────────────────────────────────
# Check deployment status
# ──────────────────────────────────────────────────────
check_status() {
    log_step "Checking deployment status..."

    BACKEND_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region "$REGION" \
        --project "$PROJECT_ID" \
        --format='value(status.url)' 2>/dev/null || echo "")

    if [ -z "$BACKEND_URL" ]; then
        log_error "Service not found. Deploy first with: ./deploy-gcp.sh first-time"
        exit 1
    fi

    log_info "Service URL: $BACKEND_URL"

    echo ""
    log_step "Testing /health endpoint..."
    curl -s "$BACKEND_URL/health" | python3 -m json.tool 2>/dev/null || echo "(no response)"

    echo ""
    log_step "Testing /api/test endpoint..."
    curl -s "$BACKEND_URL/api/test" | python3 -m json.tool 2>/dev/null || echo "(no response)"

    echo ""
    log_step "Cloud Run service details:"
    gcloud run services describe "$SERVICE_NAME" \
        --region "$REGION" \
        --project "$PROJECT_ID" \
        --format="table(status.url, status.conditions[0].type, status.conditions[0].status, spec.template.spec.containers[0].resources.limits.memory, spec.template.metadata.annotations.'autoscaling.knative.dev/minScale', spec.template.metadata.annotations.'autoscaling.knative.dev/maxScale')"
}

# ──────────────────────────────────────────────────────
# Map custom domain
# ──────────────────────────────────────────────────────
map_domain() {
    log_step "Mapping custom domain: api.literexia.com"
    echo ""
    log_warn "This requires DNS changes. After running this:"
    echo "  1. Go to your DNS provider"
    echo "  2. Delete the old A record for 'api' (your EC2 IP)"
    echo "  3. Add CNAME record: api → ghs.googlehosted.com"
    echo ""
    echo "Continue? (y/N)"
    read -r answer

    if [[ "$answer" =~ ^[Yy]$ ]]; then
        gcloud run domain-mappings create \
            --service "$SERVICE_NAME" \
            --domain api.literexia.com \
            --region "$REGION" \
            --project "$PROJECT_ID" || true
        log_info "Domain mapping created ✅"
        log_warn "Don't forget to update your DNS records!"
    fi
}

# ──────────────────────────────────────────────────────
# View logs
# ──────────────────────────────────────────────────────
view_logs() {
    log_step "Streaming logs from Cloud Run (Ctrl+C to stop)..."
    gcloud run services logs tail "$SERVICE_NAME" \
        --region "$REGION" \
        --project "$PROJECT_ID"
}

# ──────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────
case "${1:-help}" in
    first-time)
        echo "═══════════════════════════════════════════════"
        echo "  Literexia Backend — First-Time GCP Setup"
        echo "═══════════════════════════════════════════════"
        gcloud config set project "$PROJECT_ID"
        enable_apis
        setup_secrets
        deploy
        echo ""
        log_info "🎉 First-time setup complete!"
        log_info "Next steps:"
        echo "  1. Test your backend: ./deploy-gcp.sh status"
        echo "  2. Map custom domain: ./deploy-gcp.sh domain"
        echo "  3. View logs: ./deploy-gcp.sh logs"
        ;;
    update)
        echo "═══════════════════════════════════════════════"
        echo "  Literexia Backend — Quick Deploy"
        echo "═══════════════════════════════════════════════"
        deploy
        ;;
    secrets)
        setup_secrets
        ;;
    status)
        check_status
        ;;
    domain)
        map_domain
        ;;
    logs)
        view_logs
        ;;
    help|*)
        echo ""
        echo "Usage: ./deploy-gcp.sh [command]"
        echo ""
        echo "Commands:"
        echo "  first-time  Full first-time setup (APIs + secrets + deploy)"
        echo "  update      Quick re-deploy after code changes"
        echo "  secrets     Create/update secrets only"
        echo "  status      Check deployment status & test endpoints"
        echo "  domain      Map api.literexia.com custom domain"
        echo "  logs        Stream live logs"
        echo "  help        Show this help"
        echo ""
        ;;
esac
