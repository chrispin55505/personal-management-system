const { pool } = require('../config/database');

// Login user
const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (rows.length > 0) {
            const user = {
                id: rows[0].id,
                username: rows[0].username,
                email: rows[0].email
            };
            
            req.session.user = user;
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Logout user
const logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            res.status(500).json({ success: false, message: 'Logout failed' });
        } else {
            res.json({ success: true, message: 'Logged out successfully' });
        }
    });
};

// Check auth status
const checkAuth = async (req, res) => {
    if (req.session.user) {
        res.json({ 
            authenticated: true, 
            user: req.session.user 
        });
    } else {
        res.json({ 
            authenticated: false 
        });
    }
};

module.exports = {
    login,
    logout,
    checkAuth
};
