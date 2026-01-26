# Railway.app Deployment Troubleshooting Guide

## 🚨 Common Deployment Issues & Solutions

### Issue 1: Application Crashes on Startup
**Symptoms**: Railway shows "Crashed" status immediately after deployment

**Causes & Solutions**:

#### Missing Dependencies
```bash
# Check if all dependencies are in package.json
npm install cors helmet morgan
```

#### Database Connection Failure
- Ensure MySQL service is added in Railway
- Check environment variables are properly set
- Run the init-schema.sql script

#### Port Configuration
- Railway automatically sets PORT environment variable
- Your app should use `process.env.PORT || 6000`

### Issue 2: Database Connection Errors
**Error Messages**:
- `ECONNREFUSED`
- `Access denied for user`
- `Table doesn't exist`

**Solutions**:

1. **Add MySQL Service in Railway**:
   - Go to Railway dashboard
   - Click "New Service" → "Add MySQL"
   - Wait for it to be ready

2. **Check Environment Variables**:
   ```
   RAILWAY_PRIVATE_HOST=auto-generated
   RAILWAY_MYSQL_USER=auto-generated  
   RAILWAY_MYSQL_PASSWORD=auto-generated
   RAILWAY_MYSQL_DATABASE_NAME=auto-generated
   RAILWAY_MYSQL_PORT=auto-generated
   ```

3. **Initialize Database Schema**:
   - Go to MySQL service in Railway
   - Click "Query" tab
   - Copy content from `database/init-schema.sql`
   - Execute the query

### Issue 3: CORS Errors in Browser
**Symptoms**: Frontend can't connect to backend API

**Solutions**:
- CORS is now properly configured with `cors` package
- Railway automatically sets `RAILWAY_PUBLIC_DOMAIN`
- Frontend should use relative URLs (e.g., `/api/auth/login`)

### Issue 4: Session/Cookie Issues
**Symptoms**: Login doesn't persist, user gets logged out

**Solutions**:
- Set `SESSION_SECRET` environment variable in Railway
- Secure cookies are automatically enabled in production
- Ensure frontend and backend use same domain

## 🔧 Railway Deployment Checklist

### Before Deployment:
- [ ] All dependencies listed in package.json
- [ ] Railway.json and Procfile exist
- [ ] Database configuration supports Railway environment
- [ ] CORS properly configured
- [ ] Health check endpoint exists (`/health`)
- [ ] Error handling and logging added

### After Deployment:
- [ ] Add MySQL service
- [ ] Set SESSION_SECRET environment variable
- [ ] Run init-schema.sql in MySQL Query tab
- [ ] Check deployment logs for errors
- [ ] Test health endpoint: `https://your-app.railway.app/health`
- [ ] Test login functionality

## 📊 Monitoring & Debugging

### Check Railway Logs:
1. Go to Railway dashboard
2. Click on your service
3. View "Logs" tab
4. Look for error messages

### Common Log Messages:
- `✅ Database connected successfully` - DB is working
- `❌ Database connection failed` - Check DB configuration
- `Server started on port XXXX` - App is running
- `GET /health 200` - Health check passing

### Test Endpoints:
```bash
# Health check
curl https://your-app.railway.app/health

# Test API
curl https://your-app.railway.app/api/auth/status
```

## 🚀 Quick Fix Commands

If deployment fails, try these fixes:

1. **Update Dependencies**:
   ```bash
   cd personal_management_backend
   npm install cors helmet morgan
   git add package.json package-lock.json
   git commit -m "Add missing dependencies for Railway"
   git push
   ```

2. **Reset Database**:
   - Delete MySQL service in Railway
   - Create new MySQL service
   - Run init-schema.sql script

3. **Redeploy**:
   - Go to Railway dashboard
   - Click "Redeploy" button
   - Wait for deployment to complete

## 📞 Railway Support Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.gg/railway)
- [Node.js Deployment Guide](https://docs.railway.app/deploy/recipes/nodejs)

## 🎯 Success Indicators

Your deployment is successful when:
- ✅ Service status shows "Running"
- ✅ Health check returns 200 OK
- ✅ Database connection logs show success
- ✅ Login page loads and authentication works
- ✅ All features are functional

If you're still experiencing issues, check the Railway logs and compare with the troubleshooting steps above.
