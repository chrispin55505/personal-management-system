require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { testConnection } = require('./config/database');

const app = express();
const port = process.env.PORT || 6000;

// Test database connection
testConnection();

// Middleware
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

// CORS middleware
app.use((req, res, next) => {
    const origin = process.env.NODE_ENV === 'production' ? 
        ['https://your-railway-app.railway.app'] : 
        ['http://localhost:6000', 'http://localhost:3000'];
    
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// View Engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Static folder - serve frontend files
app.use(express.static(path.join(__dirname, '../personal_management_frontend')));

// API Routes
app.use('/api', require('./routes/api'));

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
