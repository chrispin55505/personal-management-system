const { pool } = require('../config/database');

// Get all marks
const getMarks = async (req, res) => {
    const userId = req.session.user?.id || 1;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM marks WHERE user_id = ? ORDER BY marks_date DESC',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Get marks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new marks
const addMarks = async (req, res) => {
    const { moduleId, category, marks } = req.body;
    const userId = req.session.user?.id || 1;

    try {
        // Get module details
        const [moduleRows] = await pool.execute(
            'SELECT * FROM modules WHERE id = ? AND user_id = ?',
            [moduleId, userId]
        );

        if (moduleRows.length === 0) {
            return res.status(404).json({ message: 'Module not found' });
        }

        const module = moduleRows[0];

        const [result] = await pool.execute(
            'INSERT INTO marks (module_id, module_name, lecturer, category, marks, marks_date, user_id) VALUES (?, ?, ?, ?, ?, CURDATE(), ?)',
            [moduleId, module.name, module.lecturer, category, marks, userId]
        );

        // Add activity log
        await pool.execute(
            'INSERT INTO activities (description, type, status, user_id) VALUES (?, ?, ?, ?)',
            [`Added ${category} marks for ${module.name}`, 'marks', 'completed', userId]
        );

        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Add marks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete marks
const deleteMarks = async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user?.id || 1;

    try {
        await pool.execute(
            'DELETE FROM marks WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Delete marks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getMarks,
    addMarks,
    deleteMarks
};
