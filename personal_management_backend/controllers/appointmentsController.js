const { pool } = require('../config/database');

// Get all appointments
const getAppointments = async (req, res) => {
    const userId = req.session.user?.id || 1;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM appointments WHERE user_id = ? ORDER BY appointment_date, appointment_time',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new appointment
const addAppointment = async (req, res) => {
    const { name, place, date, time, aim, notification } = req.body;
    const userId = req.session.user?.id || 1;

    try {
        const [result] = await pool.execute(
            'INSERT INTO appointments (name, place, appointment_date, appointment_time, aim, notification, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, place, date, time, aim, notification, userId]
        );

        // Add activity log
        await pool.execute(
            'INSERT INTO activities (description, type, status, user_id) VALUES (?, ?, ?, ?)',
            [`Added appointment: ${name}`, 'appointments', 'completed', userId]
        );

        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Add appointment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Complete appointment
const completeAppointment = async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user?.id || 1;

    try {
        await pool.execute(
            'UPDATE appointments SET status = "completed" WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Complete appointment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete appointment
const deleteAppointment = async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user?.id || 1;

    try {
        await pool.execute(
            'DELETE FROM appointments WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Delete appointment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAppointments,
    addAppointment,
    completeAppointment,
    deleteAppointment
};
