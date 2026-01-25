const { pool } = require('../config/database');

// Get all modules
const getModules = async (req, res) => {
    const userId = req.session.user?.id || 1;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM modules WHERE user_id = ? ORDER BY code',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Get modules error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new module
const addModule = async (req, res) => {
    const { code, name, lecturer, semester, year } = req.body;
    const userId = req.session.user?.id || 1;

    try {
        const [result] = await pool.execute(
            'INSERT INTO modules (code, name, lecturer, semester, year, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [code, name, lecturer, semester, year, userId]
        );

        // Add activity log
        await pool.execute(
            'INSERT INTO activities (description, type, status, user_id) VALUES (?, ?, ?, ?)',
            [`Added module ${code}: ${name}`, 'modules', 'completed', userId]
        );

        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Add module error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete module
const deleteModule = async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user?.id || 1;

    try {
        await pool.execute(
            'DELETE FROM modules WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Delete module error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getModules,
    addModule,
    deleteModule
};
