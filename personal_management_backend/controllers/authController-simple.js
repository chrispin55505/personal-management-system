const { pool } = require('../config/database-simple');

// Simple authentication without password hashing for Railway deployment
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Simple query for authentication
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );
        
        if (users.length > 0) {
            const user = {
                id: users[0].id,
                username: users[0].username,
                email: users[0].email
            };
            
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
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Logout failed' 
                });
            }
            res.clearCookie('connect.sid');
            res.json({ 
                success: true, 
                message: 'Logout successful' 
            });
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

const checkAuth = async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(500).json({ 
            authenticated: false,
            message: 'Server error' 
        });
    }
};

module.exports = {
    login,
    logout,
    checkAuth
};
