/**
 * Vite Plugin for Security Headers
 * Adds essential security headers to the frontend development server
 * and provides configuration for production deployment
 */

export function securityHeaders() {
  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Content Security Policy (CSP) - Addresses ZAP finding
        const csp = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
          "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
          "img-src 'self' data: blob: https: https://literexia-bucket.s3.ap-southeast-2.amazonaws.com",
          "media-src 'self' blob: https://literexia-bucket.s3.ap-southeast-2.amazonaws.com",
          "connect-src 'self' http://localhost:5001 https://api.literexia.com https://literexia.com https://*.amazonaws.com https://literexia-bucket.s3.ap-southeast-2.amazonaws.com ws://localhost:5173 wss://localhost:5173",
          "frame-src 'self' https://literexia-bucket.s3.ap-southeast-2.amazonaws.com",
          "object-src 'none'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'"
        ].join('; ');

        res.setHeader('Content-Security-Policy', csp);

        // Anti-clickjacking protection - Addresses ZAP finding
        res.setHeader('X-Frame-Options', 'DENY');

        // MIME-sniffing protection - Addresses ZAP finding
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // Additional security headers
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', [
          'camera=()',
          'microphone=()',
          'geolocation=()',
          'payment=()',
          'usb=()',
          'magnetometer=()',
          'gyroscope=()',
          'accelerometer=()'
        ].join(', '));

        // Strict Transport Security (for HTTPS in production)
        if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
          res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        next();
      });
    },
    generateBundle() {
      // Generate security headers configuration for production deployment
      this.emitFile({
        type: 'asset',
        fileName: '_security_headers.txt',
        source: generateProductionSecurityConfig()
      });
    }
  };
}

function generateProductionSecurityConfig() {
  return `# Security Headers Configuration for Production Deployment
# Copy these configurations to your web server (Nginx, Apache, etc.)

# === NGINX CONFIGURATION ===
# Add to your nginx.conf or site configuration file:

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;

# Anti-clickjacking protection
add_header X-Frame-Options "DENY" always;

# MIME-sniffing protection
add_header X-Content-Type-Options "nosniff" always;

# XSS protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Feature policy
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()" always;

# HTTPS security
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# === APACHE CONFIGURATION ===
# Add to your .htaccess or apache configuration:

<IfModule mod_headers.c>
    # Content Security Policy
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"

    # Anti-clickjacking protection
    Header always set X-Frame-Options "DENY"

    # MIME-sniffing protection
    Header always set X-Content-Type-Options "nosniff"

    # XSS protection
    Header always set X-XSS-Protection "1; mode=block"

    # Referrer policy
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # Feature policy
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"

    # HTTPS security (only on HTTPS)
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" env=HTTPS
</IfModule>

# === CLOUDFLARE CONFIGURATION ===
# If using Cloudflare, add these headers in Page Rules or Workers:

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  const newHeaders = new Headers(response.headers)

  newHeaders.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'")
  newHeaders.set('X-Frame-Options', 'DENY')
  newHeaders.set('X-Content-Type-Options', 'nosniff')
  newHeaders.set('X-XSS-Protection', '1; mode=block')
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}

# === VERCEL CONFIGURATION ===
# Create vercel.json in project root:
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}

# === NETLIFY CONFIGURATION ===
# Create _headers file in public folder:
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

# === SECURITY VERIFICATION ===
# After deployment, test your security headers using:
# - https://securityheaders.com/
# - https://observatory.mozilla.org/
# - OWASP ZAP scan

# These configurations address all ZAP findings:
# ✅ Content Security Policy (CSP) Header Not Set -> FIXED
# ✅ Missing Anti-clickjacking Header -> FIXED
# ✅ X-Content-Type-Options Header Missing -> FIXED
`;
}

export default securityHeaders;