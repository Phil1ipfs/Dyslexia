#!/bin/bash
# ============================================================================
# Literexia Frontend — Google Cloud Run Deployment Script
# ============================================================================
# Usage: ./deploy-frontend-gcp.sh
# ============================================================================

set -euo pipefail

# Configuration
PROJECT_ID="literexia-capstone-project"
SERVICE_NAME="literexia-frontend"
REGION="asia-southeast1"
MEMORY="512Mi"
CPU="1"
MIN_INSTANCES="0"    # Frontends can scale to zero
MAX_INSTANCES="5"
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
# Ensure gcloud runs on a supported Python (>= 3.10)
# ──────────────────────────────────────────────────────
ensure_gcloud_python() {
    if [ -n "${CLOUDSDK_PYTHON:-}" ]; then
        return
    fi
    for py in python3.13 python3.12 python3.11 python3.10; do
        for path in "/opt/homebrew/bin/$py" "/usr/local/bin/$py" "$(command -v "$py" 2>/dev/null)"; do
            if [ -n "$path" ] && [ -x "$path" ]; then
                export CLOUDSDK_PYTHON="$path"
                log_info "Using Python for gcloud: $path ($("$path" --version 2>&1))"
                return
            fi
        done
    done
    log_warn "No Python >= 3.10 found for gcloud; deploy may fail on the bundled 3.9."
}

ensure_gcloud_python

# ──────────────────────────────────────────────────────
# Deploy to Cloud Run
# ──────────────────────────────────────────────────────
deploy() {
    log_step "Deploying frontend $SERVICE_NAME to Cloud Run ($REGION)..."
    echo ""

    cd "$(dirname "$0")/frontend" || { log_error "Cannot find frontend directory"; exit 1; }

    # Fetch the backend URL automatically to pass to the frontend build
    log_info "Fetching backend API URL..."
    BACKEND_URL=$(gcloud run services describe literexia-backend \
        --region "$REGION" \
        --project "$PROJECT_ID" \
        --format='value(status.url)' 2>/dev/null || echo "")

    if [ -z "$BACKEND_URL" ]; then
        log_warn "Backend URL could not be fetched automatically."
        BACKEND_URL="https://api.literexia.com"
        log_info "Defaulting to: $BACKEND_URL"
    else
        log_info "Backend URL found: $BACKEND_URL"
    fi

    # Pass environment variables to the Cloud Build process for Vite to use
    gcloud run deploy "$SERVICE_NAME" \
        --source . \
        --region "$REGION" \
        --platform managed \
        --project "$PROJECT_ID" \
        --allow-unauthenticated \
        --memory "$MEMORY" \
        --cpu "$CPU" \
        --min-instances "$MIN_INSTANCES" \
        --max-instances "$MAX_INSTANCES" \
        --timeout "$TIMEOUT" \
        --port "$PORT" \
        --set-build-env-vars="VITE_API_BASE_URL=$BACKEND_URL/api,VITE_API_URL=$BACKEND_URL,VITE_BACKEND_URL=$BACKEND_URL"

    cd ..

    log_info "Deployment complete ✅"

    # Get and display the service URL
    FRONTEND_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region "$REGION" \
        --project "$PROJECT_ID" \
        --format='value(status.url)')

    echo ""
    log_info "🚀 Frontend URL: $FRONTEND_URL"
    log_info "You can map your custom domain (e.g. literexia.com) to this service."
}

# ──────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────
gcloud config set project "$PROJECT_ID"
deploy
