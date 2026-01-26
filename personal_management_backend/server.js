require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { testConnection } = require('./config/database-simple');

const app = express();
const port = process.env.PORT || 6000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Set to true in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Test database connection
testConnection();

// CORS middleware - simplified for Railway
app.use(cors({
  origin: true,
  credentials: true
}));

// View Engine removed - not needed for API

// Static folder - serve frontend files
app.use(express.static(path.join(__dirname, '../personal_management_frontend')));

// API Routes - simplified for Railway
app.use('/api', require('./routes/api-simple'));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../personal_management_frontend/index.html'));
});

// Fallback for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../personal_management_frontend/index.html'));
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
    console.log(`Frontend available at: http://localhost:${port}`);
    console.log(`API available at: http://localhost:${port}/api`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
