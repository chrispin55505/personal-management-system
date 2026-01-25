const { pool } = require('../config/database');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    const userId = req.session.user?.id || 1;

    try {
        // Get appointment count
        const [appointments] = await pool.execute(
            'SELECT COUNT(*) as count FROM appointments WHERE user_id = ? AND status = "upcoming" AND appointment_date >= CURDATE()',
            [userId]
        );

        // Get money owed
        const [money] = await pool.execute(
            'SELECT COALESCE(SUM(amount), 0) as total FROM money_records WHERE user_id = ? AND status = "pending"',
            [userId]
        );

        // Get module count
        const [modules] = await pool.execute(
            'SELECT COUNT(*) as count FROM modules WHERE user_id = ?',
            [userId]
        );

        // Get journey count
        const [journeys] = await pool.execute(
            'SELECT COUNT(*) as count FROM journeys WHERE user_id = ? AND status = "pending" AND journey_date >= CURDATE()',
            [userId]
        );

        res.json({
            appointmentCount: appointments[0].count,
            moneyOwed: money[0].total,
            moduleCount: modules[0].count,
            journeyCount: journeys[0].count
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getDashboardStats
};
