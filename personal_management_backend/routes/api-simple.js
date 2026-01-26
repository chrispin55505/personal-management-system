const express = require('express');
const router = express.Router();

// Import simplified controllers
const authController = require('../controllers/authController-simple');

// Authentication routes
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/status', authController.checkAuth);

// Simple dashboard stats
router.get('/dashboard/stats', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        
        // Get basic counts
        const [modules] = await pool.execute('SELECT COUNT(*) as count FROM modules');
        const [appointments] = await pool.execute('SELECT COUNT(*) as count FROM appointments WHERE status = "scheduled"');
        const [money] = await pool.execute('SELECT SUM(amount) as total FROM money WHERE status = "pending"');
        const [journeys] = await pool.execute('SELECT COUNT(*) as count FROM journeys WHERE status = "pending"');
        
        res.json({
            moduleCount: modules[0].count || 0,
            appointmentCount: appointments[0].count || 0,
            moneyOwed: money[0].total || 0,
            journeyCount: journeys[0].count || 0
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.json({
            moduleCount: 0,
            appointmentCount: 0,
            moneyOwed: 0,
            journeyCount: 0
        });
    }
});

// Basic CRUD routes for all modules
router.get('/timetable', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const [rows] = await pool.execute('SELECT * FROM timetable ORDER BY exam_date');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/timetable', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { moduleCode, moduleName, date, time, venue } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO timetable (module_code, module_name, exam_date, exam_time, venue) VALUES (?, ?, ?, ?, ?)',
            [moduleCode, moduleName, date, time, venue]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/timetable/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        await pool.execute('DELETE FROM timetable WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Similar simplified routes for other modules...
router.get('/modules', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const [rows] = await pool.execute('SELECT * FROM modules ORDER BY module_code');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/modules', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { code, name, lecturer, semester, year } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO modules (module_code, module_name, lecturer, semester, year) VALUES (?, ?, ?, ?, ?)',
            [code, name, lecturer, semester, year]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/modules/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        await pool.execute('DELETE FROM modules WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Activities endpoint
router.get('/activities', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const [rows] = await pool.execute('SELECT * FROM activities ORDER BY created_at DESC LIMIT 10');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
