# Railway.app Deployment Guide

## Updated Configuration

Your project has been configured for Railway.app deployment with the following changes:

### ✅ User Credentials Updated
- **Username**: `chrispin`
- **Email**: `chrispingolden@gmail.com`
- **Password**: `@nzali2006`
- **Port**: `6000`

### ✅ Railway.app Integration

#### 1. Database Configuration
- Automatic Railway MySQL database integration
- Environment variable support for production
- SSL configuration for secure connections

#### 2. Deployment Files Created
- `railway.json` - Railway deployment configuration
- `Procfile` - Process definition for Railway
- Updated `.env` with port 6000

#### 3. Production Ready Features
- Health check endpoint (`/health`)
- Dynamic API base URL detection
- CORS configuration for production
- Session security for HTTPS

## Local Development Setup

### Fix PowerShell npm install issue:
```powershell
# Navigate to the correct directory (note the quotes for spaces)
cd "personal_management_backend"

# Install dependencies
npm install

# Start the server
npm start
```

### Alternative if npm install still fails:
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json if they exist
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Install again
npm install
```

## Railway.app Deployment Steps

### 1. Prepare Your Repository
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Railway.app ready"

# Push to GitHub
git remote add origin https://github.com/yourusername/personal-management.git
git push -u origin main
```

### 2. Deploy to Railway.app
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will automatically detect the Node.js project
5. Add MySQL database:
   - Click "New Service" → "Add MySQL"
   - Railway will provide database URL automatically

### 3. Environment Variables (Railway will set these automatically)
```
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
RAILWAY_MYSQL_USER=auto_generated
RAILWAY_MYSQL_PASSWORD=auto_generated
RAILWAY_MYSQL_DATABASE_NAME=auto_generated
RAILWAY_PRIVATE_HOST=auto_generated
RAILWAY_MYSQL_PORT=auto_generated
SESSION_SECRET=your_secret_key_here
```

### 4. Database Setup on Railway
After deployment, run the schema:

1. Go to your MySQL service in Railway
2. Click "Query" tab
3. Copy and paste the content from `database/schema.sql`
4. Execute the query to create tables

## Access Your Application

### Local Development
- URL: `http://localhost:6000`
- Login: `chrispin` / `@nzali2006`

### Railway Production
- URL: `https://your-app-name.railway.app`
- Same login credentials

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Ensure MySQL service is added in Railway
   - Check environment variables are set
   - Verify schema is imported

2. **npm install Issues**
   - Use PowerShell with quoted paths
   - Clear npm cache
   - Delete node_modules and reinstall

3. **CORS Issues**
   - Check frontend API base URL
   - Verify Railway environment variables

4. **Session Issues**
   - Ensure SESSION_SECRET is set in Railway
   - Check secure cookie settings

## Features Ready for Production

✅ User authentication with your credentials  
✅ Railway MySQL database integration  
✅ Health monitoring endpoint  
✅ Environment-based configuration  
✅ SSL/HTTPS support  
✅ CORS protection  
✅ Session management  
✅ All personal management features  

Your application is now fully configured and ready for Railway.app deployment!
