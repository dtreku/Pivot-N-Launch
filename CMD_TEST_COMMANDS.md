# CMD Testing Commands for Deployment

## Basic CMD Commands (Windows Command Prompt)

```cmd
REM Test health check endpoint
curl -X GET "https://PNLToolkit.professordtreku.com/api/health"

REM Initialize database tables
curl -X POST "https://PNLToolkit.professordtreku.com/api/init-db"

REM Seed admin accounts
curl -X POST "https://PNLToolkit.professordtreku.com/api/seed"

REM Test login
curl -X POST "https://PNLToolkit.professordtreku.com/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"dtreku@wpi.edu\",\"password\":\"admin123\"}"
```

## Alternative with Response Headers (for debugging)

```cmd
REM Health check with verbose output
curl -v "https://PNLToolkit.professordtreku.com/api/health"

REM Database init with verbose output
curl -v -X POST "https://PNLToolkit.professordtreku.com/api/init-db"
```

## Expected Successful Responses

**Health Check:**
```json
{"status":"ok","timestamp":"2025-08-29T20:45:00.000Z","service":"PBL Toolkit API"}
```

**Database Init:**
```json
{"success":true,"message":"Database initialized successfully"}
```

**Seed:**
```json
{"success":true,"message":"Database seeded successfully","users":[{"name":"Prof. Daniel Treku","email":"dtreku@wpi.edu","role":"super_admin"},...]}
```

**Login:**
```json
{"success":true,"message":"Login successful","faculty":{"id":1,"name":"Prof. Daniel Treku","email":"dtreku@wpi.edu","role":"super_admin","status":"approved"}}
```

## Current Issue

If you get 404 errors, it means the GitHub repository still needs to be updated with the clean `server/routes-minimal.ts` file.

The file should contain ONLY TypeScript code (no markdown) - copy the content from `CLEAN_ROUTES_MINIMAL.ts` in this Replit.