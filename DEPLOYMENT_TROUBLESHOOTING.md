# DEPLOYMENT TROUBLESHOOTING GUIDE

## Current Status Analysis

✅ **Frontend**: Working correctly - React app loads at https://PNLToolkit.professordtreku.com
❌ **Backend API**: Not working - All `/api/*` routes return 404

## Root Cause

The build failed due to markdown content in `server/routes-minimal.ts`. The current deployment doesn't have working API endpoints.

## Required Actions

### 1. IMMEDIATE: Update GitHub with Clean TypeScript File

Replace your `server/routes-minimal.ts` with the clean content (no markdown):

```typescript
// Copy the complete content from CLEAN_ROUTES_MINIMAL.ts in this Replit
```

### 2. Verify netlify.toml Configuration

Your `netlify.toml` should have:

```toml
[build]
  command = "npm ci --include=dev && npx vite build --config vite.config.prod.ts && npx esbuild server/routes-minimal.ts --platform=node --packages=external --bundle --format=cjs --outfile=dist/routes.js"
  functions = "netlify/functions"
  publish = "dist/public"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/server"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. Verify netlify/functions/server.js

Ensure you have this file:

```javascript
const serverless = require('serverless-http');
const express = require('express');
const { registerRoutes } = require('../../dist/routes.js');

const app = express();
app.use(express.json());

registerRoutes(app);

module.exports.handler = serverless(app);
```

## Testing After Deployment

### PowerShell Commands (with output verification):

```powershell
# Test health endpoint
$response = curl.exe -Uri "https://PNLToolkit.professordtreku.com/api/health" -Method GET -UseBasicParsing
Write-Host "Health Check Response: $response"

# Initialize database
$response = curl.exe -Uri "https://PNLToolkit.professordtreku.com/api/init-db" -Method POST -UseBasicParsing
Write-Host "Database Init Response: $response"

# Seed admin accounts
$response = curl.exe -Uri "https://PNLToolkit.professordtreku.com/api/seed" -Method POST -UseBasicParsing
Write-Host "Seed Response: $response"

# Test login
$response = curl.exe -Uri "https://PNLToolkit.professordtreku.com/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"dtreku@wpi.edu","password":"admin123"}' -UseBasicParsing
Write-Host "Login Response: $response"
```

## Expected Responses

- **Health**: `{"status":"ok","timestamp":"...","service":"PBL Toolkit API"}`
- **Init-DB**: `{"success":true,"message":"Database initialized successfully"}`
- **Seed**: `{"success":true,"message":"Database seeded successfully","users":[...]}`
- **Login**: `{"success":true,"message":"Login successful","faculty":{...}}`

## Environment Variables Required

Verify these are set in Netlify dashboard:

- `DATABASE_URL` - Your PostgreSQL connection string
- `SESSION_SECRET` - Your session secret
- `NODE_ENV=production`

## Next Steps

1. **Update GitHub** with clean TypeScript file
2. **Wait for Netlify rebuild** (check build logs)
3. **Test endpoints** with PowerShell commands above
4. **Verify responses** match expected output

## If Build Still Fails

Check Netlify build logs for:
- TypeScript compilation errors
- Missing dependencies
- Environment variable issues