# ============================================================================
# Literexia Backend — Production Dockerfile for Google Cloud Run
# ============================================================================
# Multi-stage build for smaller final image
# Stage 1: Install dependencies (including native modules like bcrypt)
# Stage 2: Copy only what's needed for production
# ============================================================================

# --------------- STAGE 1: Builder ---------------
FROM node:20-slim AS builder

# Install build tools for native modules (bcrypt requires python3, make, g++)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (Docker layer caching — only re-installs if deps change)
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for build step)
# Using --ignore-scripts=false to ensure native modules like bcrypt compile
RUN npm ci --only=production --ignore-scripts=false

# Rebuild bcrypt specifically for this platform (critical for linux/amd64)
RUN npm rebuild bcrypt --build-from-source

# --------------- STAGE 2: Production ---------------
FROM node:20-slim AS production

# Security: run as non-root user
RUN groupadd -r literexia && useradd -r -g literexia -m literexia

WORKDIR /app

# Copy node_modules from builder (includes compiled native modules)
COPY --from=builder /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Remove files not needed in production
RUN rm -rf \
    .git \
    .gitignore \
    *.log \
    backend-restart.log \
    backend-startup.log \
    backend.log \
    docs/ \
    scripts/ \
    checkPassword.js \
    hashPassword.js \
    manual_prescriptive_cleanup.js \
    setup-s3-cors.js \
    cluster.js \
    scratch/ \
    .DS_Store

# Create storage directory (in case any service tries to access it)
RUN mkdir -p storage/pdf-reports && chown -R literexia:literexia /app

# Switch to non-root user
USER literexia

# Cloud Run injects PORT env var automatically (default 8080)
ENV PORT=8080 \
    NODE_ENV=production \
    # Optimize Node.js for containers
    NODE_OPTIONS="--max-old-space-size=384" \
    # Disable npm update check
    NPM_CONFIG_UPDATE_NOTIFIER=false

EXPOSE 8080

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "const http=require('http');const options={hostname:'localhost',port:process.env.PORT||8080,path:'/health',timeout:5000};const req=http.get(options,res=>{process.exit(res.statusCode===200?0:1)});req.on('error',()=>process.exit(1));req.on('timeout',()=>{req.destroy();process.exit(1)});"

# Start the server (NOT cluster.js — Cloud Run handles scaling via instances)
CMD ["node", "server.js"]
