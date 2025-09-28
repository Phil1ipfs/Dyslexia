# 🚀 AWS Amplify Deployment Checklist

## Pre-Deployment Setup ✅

### Files Created
- [x] `amplify.yml` - Build configuration
- [x] `frontend/public/_headers` - Security headers
- [x] `frontend/public/_redirects` - SPA routing
- [x] `frontend/.env.production` - Environment template
- [x] Optimized `frontend/vite.config.js`

### Configuration Verified
- [x] React/Vite build process
- [x] Security headers configuration
- [x] Production optimizations
- [x] Bundle splitting strategy

## AWS Amplify Console Setup 🔧

### Step 1: Repository Connection
- [ ] Connect to GitHub repository `Phil1ipfs/Dyslexia`
- [ ] Select `main` branch
- [ ] Set build folder to `frontend/`

### Step 2: Build Settings
- [ ] App name: `literexia-frontend`
- [ ] Build command: `npm run build`
- [ ] Build output directory: `dist`
- [ ] Node.js version: `18`

### Step 3: Environment Variables
Configure in Amplify Console:
- [ ] `VITE_BACKEND_URL` = `https://your-ec2-backend-url.com`
- [ ] `VITE_API_URL` = `https://your-ec2-backend-url.com`
- [ ] `VITE_USE_MOCK_CHATBOT` = `false`
- [ ] `NODE_ENV` = `production`

### Step 4: Security Configuration
- [ ] SPA redirects configured (automatic via `_redirects`)
- [ ] Security headers applied (automatic via `amplify.yml`)
- [ ] Custom domain setup (optional)

## Backend Integration 🔗

### CORS Configuration
Update your EC2 backend `server.js`:
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://main.your-app-id.amplifyapp.com', // Add your Amplify URL
  'https://your-custom-domain.com',
  process.env.FRONTEND_URL
].filter(Boolean);
```

### Environment Variables
Update backend `.env`:
- [ ] `FRONTEND_URL=https://main.your-app-id.amplifyapp.com`

## Testing & Validation 🧪

### Pre-Deployment Testing
- [ ] Local build test: `npm run build`
- [ ] Local preview: `npm run preview`
- [ ] Environment variables validated
- [ ] Security headers tested

### Post-Deployment Testing
- [ ] Frontend loads at Amplify URL
- [ ] All React routes work correctly
- [ ] API calls connect to backend
- [ ] Authentication system functional
- [ ] File uploads work (if applicable)
- [ ] Security headers present in browser

### Security Verification
Test with browser dev tools:
- [ ] Content-Security-Policy header present
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security present

## Performance Monitoring 📊

### AWS Amplify Metrics
- [ ] Build success rate monitoring
- [ ] Performance metrics review
- [ ] Error tracking setup
- [ ] Cost monitoring enabled

### Optimization Verification
- [ ] Bundle sizes optimized
- [ ] Asset compression working
- [ ] CDN distribution active
- [ ] Cache headers configured

## Maintenance Setup 🔧

### Continuous Deployment
- [ ] Automatic builds on git push
- [ ] Build notifications configured
- [ ] Branch-based deployments (optional)

### Documentation
- [ ] Deployment guide accessible
- [ ] Environment variables documented
- [ ] Troubleshooting procedures defined

## Expected URLs 🌐

After deployment, you should have:
- **Frontend**: `https://main.[app-id].amplifyapp.com`
- **Custom Domain**: `https://your-domain.com` (if configured)
- **Backend API**: `https://your-ec2-backend-url.com`

## Quick Commands 💻

```bash
# Test local build
cd frontend && npm run build && npm run preview

# Verify files exist
ls amplify.yml frontend/public/_headers frontend/public/_redirects

# Check build output
ls -la frontend/dist/

# Test API connectivity (after deployment)
curl -I https://your-amplify-url.com
curl https://your-backend-url.com/api/test
```

## Troubleshooting 🔍

### Common Issues
- **Build fails**: Check Node.js version and dependencies
- **Routes don't work**: Verify `_redirects` file
- **API errors**: Check CORS and environment variables
- **Security headers missing**: Verify `amplify.yml` configuration

### Support Resources
- AWS Amplify Console build logs
- Browser developer tools
- AWS CloudWatch logs
- GitHub repository issues

---

## 🎯 Success Criteria

✅ **Deployment Complete When:**
- Frontend accessible at Amplify URL
- All application features functional
- Security headers properly configured
- Backend integration working
- Performance metrics acceptable

**Ready to deploy? Follow the detailed guide in `docs/AWS_AMPLIFY_DEPLOYMENT.md`**