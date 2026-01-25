const { pool } = require('../config/database');

// Get all journeys
const getJourneys = async (req, res) => {
    const userId = req.session.user?.id || 1;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM journeys WHERE user_id = ? ORDER BY journey_date',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Get journeys error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new journey
const addJourney = async (req, res) => {
    const { from, to, date, time, transportCost, foodCost, status } = req.body;
    const userId = req.session.user?.id || 1;

    try {
        const [result] = await pool.execute(
            'INSERT INTO journeys (journey_from, journey_to, journey_date, journey_time, transport_cost, food_cost, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [from, to, date, time, transportCost, foodCost, status, userId]
        );

        // Add activity log
        await pool.execute(
            'INSERT INTO activities (description, type, status, user_id) VALUES (?, ?, ?, ?)',
            [`Added journey from ${from} to ${to}`, 'journeys', 'completed', userId]
        );

        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Add journey error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Complete journey
const completeJourney = async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user?.id || 1;

    try {
        await pool.execute(
            'UPDATE journeys SET status = "completed" WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Complete journey error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete journey
const deleteJourney = async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user?.id || 1;

    try {
        await pool.execute(
            'DELETE FROM journeys WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Delete journey error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getJourneys,
    addJourney,
    completeJourney,
    deleteJourney
};
