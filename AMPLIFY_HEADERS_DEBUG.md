# AWS Amplify Headers Configuration Debug Guide

## Issue: Security Headers Not Being Applied

### Current Status
- ✅ `_headers` file exists in `frontend/public/` and `frontend/dist/`
- ✅ `amplify.yml` has `customHeaders` configuration
- ❌ Headers NOT appearing in production responses
- ❌ ZAP scan still shows missing CSP, HSTS, X-Frame-Options

### Root Cause Analysis

**AWS Amplify has TWO different systems for custom headers:**

1. **Modern Amplify Hosting (Gen 2)** - Uses `customHeaders` in `amplify.yml`
2. **Legacy Amplify Hosting (Gen 1)** - Requires Amplify Console configuration

**Your app appears to be using Legacy Amplify**, which explains why `customHeaders` in `amplify.yml` is ignored.

## Solution: Configure Headers in Amplify Console

### Step 1: Access Amplify Console
1. Go to AWS Console → Amplify
2. Select your app: **Literexia**
3. Click on **Hosting → Rewrites and redirects**

### Step 2: Add Custom Headers via Console

**Option A: Via Amplify Console UI**
1. Go to **App settings → Custom headers**
2. Add the following configuration:

```yaml
customHeaders:
  - pattern: '**'
    headers:
      - key: 'Content-Security-Policy'
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://literexia.com https://*.amazonaws.com blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self' https://literexia.com https://*.amazonaws.com https://*.sentry.io https://*.ingest.us.sentry.io wss: ws:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
      - key: 'X-Frame-Options'
        value: 'DENY'
      - key: 'X-Content-Type-Options'
        value: 'nosniff'
      - key: 'Strict-Transport-Security'
        value: 'max-age=31536000; includeSubDomains; preload'
      - key: 'X-XSS-Protection'
        value: '1; mode=block'
      - key: 'Referrer-Policy'
        value: 'strict-origin-when-cross-origin'
      - key: 'Permissions-Policy'
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
```

**Option B: Via AWS CLI**
```bash
aws amplify update-app \
  --app-id <your-app-id> \
  --custom-headers "$(cat <<'EOF'
customHeaders:
  - pattern: '**'
    headers:
      - key: 'Content-Security-Policy'
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://literexia.com https://*.amazonaws.com blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self' https://literexia.com https://*.amazonaws.com https://*.sentry.io https://*.ingest.us.sentry.io wss: ws:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
      - key: 'X-Frame-Options'
        value: 'DENY'
      - key: 'X-Content-Type-Options'
        value: 'nosniff'
      - key: 'Strict-Transport-Security'
        value: 'max-age=31536000; includeSubDomains; preload'
      - key: 'X-XSS-Protection'
        value: '1; mode=block'
      - key: 'Referrer-Policy'
        value: 'strict-origin-when-cross-origin'
      - key: 'Permissions-Policy'
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
EOF
)"
```

### Step 3: Alternative - Lambda@Edge Function

If Amplify Console custom headers don't work, you'll need to add headers via CloudFront Lambda@Edge:

1. Create Lambda function in **us-east-1** region
2. Add the following code:

```javascript
exports.handler = async (event) => {
    const response = event.Records[0].cf.response;
    const headers = response.headers;

    headers['content-security-policy'] = [{
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://literexia.com https://*.amazonaws.com blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self' https://literexia.com https://*.amazonaws.com https://*.sentry.io https://*.ingest.us.sentry.io wss: ws:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    }];
    headers['x-frame-options'] = [{ key: 'X-Frame-Options', value: 'DENY' }];
    headers['x-content-type-options'] = [{ key: 'X-Content-Type-Options', value: 'nosniff' }];
    headers['strict-transport-security'] = [{
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload'
    }];
    headers['x-xss-protection'] = [{ key: 'X-XSS-Protection', value: '1; mode=block' }];
    headers['referrer-policy'] = [{
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
    }];
    headers['permissions-policy'] = [{
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    }];

    return response;
};
```

3. Publish the Lambda function
4. Add trigger: CloudFront → Origin Response
5. Wait 15 minutes for distribution update

## Verification Steps

After configuring headers:

1. **Wait 15 minutes** for CloudFront cache invalidation
2. Test headers:
   ```bash
   curl -I https://literexia.com/
   curl -I https://literexia.com/robots.txt
   curl -I https://literexia.com/sitemap.xml
   ```
3. Run OWASP ZAP scan again
4. Verify all Medium/Low alerts are resolved

## Why amplify.yml customHeaders Doesn't Work

- `customHeaders` in `amplify.yml` is a **Gen 2 Amplify feature**
- Legacy Amplify apps (pre-2023) require **Console configuration**
- Your app appears to be a Gen 1 app based on behavior
- The `_headers` file is also a Gen 2 feature

## Recommended Approach

**Use Amplify Console Custom Headers** (easiest):
1. AWS Console → Amplify → Your App → App settings → Custom headers
2. Add the YAML configuration above
3. Redeploy app
4. Wait 15 minutes for CloudFront cache update
5. Verify headers

This should fix all OWASP ZAP security header issues.
