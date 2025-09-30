# 🚀 AWS Amplify Frontend Deployment Guide

## Overview
This guide provides step-by-step instructions to deploy the LITEREXIA React frontend to AWS Amplify with production-grade configuration, security headers, and automatic CI/CD.

## Prerequisites
- AWS Account with appropriate permissions
- GitHub repository access
- Backend deployed (EC2 or other hosting)
- Domain name (optional but recommended)

## 📁 Project Structure
```
frontend/
├── public/
│   ├── _headers          # Security headers configuration
│   └── _redirects        # SPA routing configuration
├── src/                  # React application source
├── .env                  # Development environment variables
├── .env.production       # Production environment variables template
├── package.json          # Dependencies and scripts
├── vite.config.js        # Optimized build configuration
└── amplify.yml           # AWS Amplify build configuration
```

## 🔧 Configuration Files Created

### 1. `amplify.yml` - Build Configuration
- **Purpose**: Defines build process for AWS Amplify
- **Features**:
  - Node.js dependency installation
  - Optimized build process
  - Security headers configuration
  - Caching strategy

### 2. `frontend/public/_headers` - Security Headers
- **Purpose**: Configures security headers for production
- **Headers Included**:
  - Content Security Policy (CSP)
  - X-Frame-Options (clickjacking protection)
  - X-Content-Type-Options (MIME sniffing protection)
  - Strict Transport Security (HTTPS enforcement)
  - Permissions Policy (feature restrictions)

### 3. `frontend/public/_redirects` - SPA Routing
- **Purpose**: Ensures React Router works correctly
- **Configuration**: All routes redirect to index.html for client-side routing

### 4. `frontend/.env.production` - Environment Variables Template
- **Purpose**: Template for production environment variables
- **Variables**: Backend URLs, API endpoints, feature flags

## 🚀 Deployment Steps

### Step 1: Access AWS Amplify Console
1. Log into AWS Console
2. Navigate to AWS Amplify service
3. Click "Get Started" under "Amplify Hosting"
4. Choose "Host your web app"

### Step 2: Connect GitHub Repository
1. Select "GitHub" as repository provider
2. Authorize AWS Amplify to access your GitHub account
3. Select repository: `Phil1ipfs/Dyslexia`
4. Choose branch: `main`
5. **Important**: Select build folder as `frontend/`

### Step 3: Configure Build Settings
```yaml
Build Settings:
- App name: literexia-frontend
- Environment: production
- Branch: main
- Build command: npm run build
- Build output directory: dist
- Node.js version: 18
```

### Step 4: Environment Variables Configuration
In AWS Amplify Console > Environment Variables, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_BACKEND_URL` | `https://your-ec2-backend-url.com` | Backend API base URL |
| `VITE_API_URL` | `https://your-ec2-backend-url.com` | API endpoint URL |
| `VITE_USE_MOCK_CHATBOT` | `false` | Disable mock chatbot in production |
| `NODE_ENV` | `production` | Environment mode |

### Step 5: Custom Domain Setup (Optional)
1. In Amplify Console → Domain management
2. Add domain: `your-domain.com`
3. Configure DNS settings as instructed
4. AWS will automatically provide SSL certificate

### Step 6: Advanced Configuration

#### Redirects and Rewrites
```
Source: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>
Target: /index.html
Type: 200 (Rewrite)
```

#### Custom Headers (Already configured in amplify.yml)
- Security headers are automatically applied via `amplify.yml`
- Additional headers can be configured in `_headers` file

## 🔒 Security Features

### Content Security Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https:;
connect-src 'self' https:;
```

### Additional Security Headers
- **X-Frame-Options**: `DENY` - Prevents clickjacking
- **X-Content-Type-Options**: `nosniff` - Prevents MIME sniffing
- **X-XSS-Protection**: `1; mode=block` - XSS protection
- **Strict-Transport-Security**: `max-age=31536000` - HTTPS enforcement
- **Permissions-Policy**: Restricts browser features

## 🔗 Backend Integration

### CORS Configuration Update
Update your EC2 backend CORS settings to include Amplify URL:

```javascript
// In your backend server.js
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://main.your-app-id.amplifyapp.com',
      'https://your-custom-domain.com',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Environment Variables Update
Update your backend `.env` file:
```env
FRONTEND_URL=https://main.your-app-id.amplifyapp.com
```

## 📊 Performance Optimizations

### Bundle Splitting
```javascript
// Configured in vite.config.js
manualChunks: {
  vendor: ['react', 'react-dom'],
  router: ['react-router-dom'],
  ui: ['react-bootstrap', '@fortawesome/react-fontawesome'],
  charts: ['recharts', 'chart.js', 'react-chartjs-2'],
  utils: ['axios', 'uuid', 'dompurify']
}
```

### Production Optimizations
- Console logs removed in production
- Terser minification enabled
- Asset optimization
- Efficient chunk naming for caching

## 🔍 Testing Deployment

### Pre-deployment Checklist
- [ ] All environment variables configured
- [ ] Backend CORS updated
- [ ] Security headers validated
- [ ] Build process tested locally

### Post-deployment Validation
- [ ] Frontend loads correctly
- [ ] All routes accessible
- [ ] API calls work
- [ ] Authentication flows function
- [ ] File uploads operational
- [ ] Security headers present

### Testing Commands
```bash
# Test local build
cd frontend
npm run build
npm run preview

# Test API connectivity
curl -X GET https://your-amplify-url.com
curl -X GET https://your-backend-url.com/api/test
```

## 📈 Monitoring and Maintenance

### AWS Amplify Monitoring
- Build logs and status
- Performance metrics
- Error tracking
- User analytics

### Automatic Deployments
- Git push to `main` triggers build
- Build notifications via email/SNS
- Failed builds automatically notify

### Common Issues and Solutions

#### Build Failures
```bash
# Check build logs in Amplify console
# Common fixes:
- Verify Node.js version (18)
- Check package.json dependencies
- Validate environment variables
```

#### Routing Issues
```bash
# Verify _redirects file exists
# Check SPA rewrite rules
# Ensure all routes redirect to index.html
```

#### API Connection Issues
```bash
# Verify environment variables
# Check backend CORS settings
# Validate SSL certificates
```

## 💰 Cost Estimation

### AWS Amplify Pricing
- **Build minutes**: $0.01 per build minute
- **Data storage**: $0.023 per GB per month
- **Data transfer**: $0.15 per GB served
- **Custom domain**: Free SSL certificate

### Estimated Monthly Cost
- Small application: $5-15/month
- Medium traffic: $15-50/month
- High traffic: $50+/month

## 🔄 Continuous Integration

### Branch-based Deployments
```
Production: main → https://main.your-app-id.amplifyapp.com
Staging: develop → https://develop.your-app-id.amplifyapp.com
Feature: feature/* → https://feature-name.your-app-id.amplifyapp.com
```

### Deployment Pipeline
1. Developer pushes code to GitHub
2. Amplify detects changes
3. Build process starts automatically
4. Tests run (if configured)
5. Deployment to CDN
6. Notifications sent

## 🎯 Expected Results

After successful deployment:
- **Frontend URL**: `https://main.[app-id].amplifyapp.com`
- **Build Time**: 2-5 minutes
- **Global CDN**: Automatic worldwide distribution
- **SSL Certificate**: Automatically provisioned
- **Security Headers**: Fully configured

## 📞 Support and Troubleshooting

### AWS Resources
- AWS Amplify Documentation
- AWS Support Center
- CloudWatch Logs

### Project Resources
- GitHub Issues
- Development Team
- System Administrator

---

## 🚀 Quick Start Commands

```bash
# 1. Verify files are in place
ls amplify.yml
ls frontend/public/_headers
ls frontend/public/_redirects

# 2. Test local build
cd frontend
npm run build

# 3. Deploy to Amplify
# (Follow AWS Console steps above)

# 4. Update backend CORS
# (Update server.js with new Amplify URL)
```

Your LITEREXIA frontend is now ready for production deployment on AWS Amplify with enterprise-grade security, performance, and reliability!