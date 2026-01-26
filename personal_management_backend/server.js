require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { testConnection } = require('./config/database');

const app = express();
const port = process.env.PORT || 6000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

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

// CORS middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 
    [process.env.RAILWAY_PUBLIC_DOMAIN || 'https://your-railway-app.railway.app'] : 
    ['http://localhost:6000', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

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
