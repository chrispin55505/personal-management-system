const { pool } = require('../config/database');

// Get all timetable entries
const getTimetable = async (req, res) => {
    const userId = req.session.user?.id || 1;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM timetable WHERE user_id = ? ORDER BY exam_date, exam_time',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Get timetable error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new timetable entry
const addTimetable = async (req, res) => {
    const { moduleCode, moduleName, date, time, venue } = req.body;
    const userId = req.session.user?.id || 1;

    try {
        const [result] = await pool.execute(
            'INSERT INTO timetable (module_code, module_name, exam_date, exam_time, venue, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [moduleCode, moduleName, date, time, venue, userId]
        );

        // Add activity log
        await pool.execute(
            'INSERT INTO activities (description, type, status, user_id) VALUES (?, ?, ?, ?)',
            [`Added exam timetable for ${moduleCode}`, 'timetable', 'completed', userId]
        );

        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Add timetable error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete timetable entry
const deleteTimetable = async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user?.id || 1;

    try {
        await pool.execute(
            'DELETE FROM timetable WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Delete timetable error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getTimetable,
    addTimetable,
    deleteTimetable
};
