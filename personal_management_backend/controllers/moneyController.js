const { pool } = require('../config/database');

// Get all money records
const getMoney = async (req, res) => {
    const userId = req.session.user?.id || 1;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM money_records WHERE user_id = ? ORDER BY borrow_date DESC',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Get money records error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new money record
const addMoney = async (req, res) => {
    const { person, amount, borrowDate, returnDate } = req.body;
    const userId = req.session.user?.id || 1;

    try {
        const [result] = await pool.execute(
            'INSERT INTO money_records (person_name, amount, borrow_date, expected_return_date, user_id) VALUES (?, ?, ?, ?, ?)',
            [person, amount, borrowDate, returnDate, userId]
        );

        // Add activity log
        await pool.execute(
            'INSERT INTO activities (description, type, status, user_id) VALUES (?, ?, ?, ?)',
            [`Added money record for ${person}`, 'money', 'completed', userId]
        );

        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Add money record error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Mark money as returned
const markMoneyReturned = async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user?.id || 1;

    try {
        await pool.execute(
            'UPDATE money_records SET status = "returned" WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Mark money returned error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete money record
const deleteMoney = async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user?.id || 1;

    try {
        await pool.execute(
            'DELETE FROM money_records WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Delete money record error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all savings
const getSavings = async (req, res) => {
    const userId = req.session.user?.id || 1;

    try {
        const [rows] = await pool.execute(
            'SELECT * FROM savings WHERE user_id = ? ORDER BY savings_date DESC',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Get savings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add new savings
const addSavings = async (req, res) => {
    const { amount, date } = req.body;
    const userId = req.session.user?.id || 1;

    try {
        const [result] = await pool.execute(
            'INSERT INTO savings (amount, savings_date, user_id) VALUES (?, ?, ?)',
            [amount, date, userId]
        );

        // Add activity log
        await pool.execute(
            'INSERT INTO activities (description, type, status, user_id) VALUES (?, ?, ?, ?)',
            [`Added weekly savings of ${amount} TZS`, 'savings', 'completed', userId]
        );

        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Add savings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete savings
const deleteSavings = async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user?.id || 1;

    try {
        await pool.execute(
            'DELETE FROM savings WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Delete savings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getMoney,
    addMoney,
    markMoneyReturned,
    deleteMoney,
    getSavings,
    addSavings,
    deleteSavings
};
