const { pool } = require('../config/database');

// Get all activities
const getActivities = async (req, res) => {
    const userId = req.session.user?.id || 1;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM activities WHERE user_id = ? ORDER BY activity_date DESC',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getActivities
};
