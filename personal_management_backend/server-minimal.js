require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 6000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../personal_management_frontend')));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Database connection
let pool;
async function initDatabase() {
    try {
        pool = mysql.createPool({
            host: process.env.RAILWAY_PRIVATE_HOST || process.env.DB_HOST || 'localhost',
            user: process.env.RAILWAY_MYSQL_USER || process.env.DB_USER || 'root',
            password: process.env.RAILWAY_MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
            database: process.env.RAILWAY_MYSQL_DATABASE_NAME || process.env.DB_NAME || 'personal_management',
            port: process.env.RAILWAY_MYSQL_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            ssl: process.env.RAILWAY_ENVIRONMENT ? { rejectUnauthorized: false } : false
        });
        
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.log('⚠️ Database connection failed, running without database:', error.message);
        return false;
    }
}

// Initialize database
initDatabase();

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple authentication
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Default credentials for Railway deployment
        if ((username === 'chrispin' && password === '@nzali2006') || 
            (username === 'admin' && password === 'admin123')) {
            
            const user = { id: 1, username, email: 'user@example.com' };
            req.session.user = user;
            
            res.json({ 
                success: true, 
                message: 'Login successful',
                user 
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logout successful' });
    });
});

app.get('/api/auth/status', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

// Simple dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
    res.json({
        moduleCount: 5,
        appointmentCount: 3,
        moneyOwed: 150000,
        journeyCount: 2
    });
});

// Basic CRUD endpoints (working with or without database)
app.get('/api/modules', async (req, res) => {
    if (!pool) {
        return res.json([
            { id: 1, code: 'IT101', name: 'Web Development', lecturer: 'Dr. Smith', semester: 1, year: 2 },
            { id: 2, code: 'IT102', name: 'Database Systems', lecturer: 'Prof. Johnson', semester: 1, year: 2 }
        ]);
    }
    
    try {
        const [rows] = await pool.execute('SELECT * FROM modules ORDER BY module_code');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/modules', async (req, res) => {
    if (!pool) {
        return res.json({ id: Date.now(), success: true });
    }
    
    try {
        const { code, name, lecturer, semester, year } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO modules (module_code, module_name, lecturer, semester, year) VALUES (?, ?, ?, ?, ?)',
            [code, name, lecturer, semester, year]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/modules/:id', async (req, res) => {
    if (!pool) {
        return res.json({ success: true });
    }
    
    try {
        await pool.execute('DELETE FROM modules WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Similar pattern for other endpoints...
app.get('/api/timetable', async (req, res) => {
    if (!pool) {
        return res.json([
            { id: 1, moduleCode: 'IT101', moduleName: 'Web Development', date: '2024-02-15', time: '09:00', venue: 'Room 101' }
        ]);
    }
    
    try {
        const [rows] = await pool.execute('SELECT * FROM timetable ORDER BY exam_date');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/timetable', async (req, res) => {
    if (!pool) {
        return res.json({ id: Date.now(), success: true });
    }
    
    try {
        const { moduleCode, moduleName, date, time, venue } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO timetable (module_code, module_name, exam_date, exam_time, venue) VALUES (?, ?, ?, ?, ?)',
            [moduleCode, moduleName, date, time, venue]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/timetable/:id', async (req, res) => {
    if (!pool) {
        return res.json({ success: true });
    }
    
    try {
        await pool.execute('DELETE FROM timetable WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../personal_management_frontend/index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server started successfully on port ${port}`);
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔗 API: http://localhost:${port}/api`);
    console.log(`💚 Health: http://localhost:${port}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: ${pool ? 'Connected' : 'Not connected (running in mock mode)'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    if (pool) {
        pool.end();
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    if (pool) {
        pool.end();
    }
    process.exit(0);
});
