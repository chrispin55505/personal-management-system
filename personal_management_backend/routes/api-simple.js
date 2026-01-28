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
        const [appointments] = await pool.execute('SELECT COUNT(*) as count FROM appointments WHERE status = "upcoming"');
        const [money] = await pool.execute('SELECT SUM(amount) as total FROM money_records WHERE status = "pending"');
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
            'INSERT INTO timetable (module_code, module_name, exam_date, exam_time, venue, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [moduleCode, moduleName, date, time, venue, 1]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        console.error('Timetable insert error:', error);
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
        const [rows] = await pool.execute('SELECT * FROM modules ORDER BY code');
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
            'INSERT INTO modules (code, name, lecturer, semester, year, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [code, name, lecturer, semester, year, 1]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        console.error('Module insert error:', error);
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

// Money records endpoints
router.get('/money', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const [rows] = await pool.execute('SELECT * FROM money_records ORDER BY borrow_date DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/money', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { person, amount, borrowDate, returnDate } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO money_records (person_name, amount, borrow_date, expected_return_date, user_id) VALUES (?, ?, ?, ?, ?)',
            [person, amount, borrowDate, returnDate, 1]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        console.error('Money insert error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Appointments endpoints
router.get('/appointments', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const [rows] = await pool.execute('SELECT * FROM appointments ORDER BY appointment_date');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/appointments', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { name, place, date, time, aim } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO appointments (name, place, appointment_date, appointment_time, aim, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, place, date, time, aim, 1]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        console.error('Appointment insert error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Journeys endpoints
router.get('/journeys', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const [rows] = await pool.execute('SELECT * FROM journeys ORDER BY journey_date');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/journeys', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { from, to, date, time, transportCost, foodCost } = req.body;
        const transport = parseFloat(transportCost) || 0;
        const food = parseFloat(foodCost) || 0;
        const [result] = await pool.execute(
            'INSERT INTO journeys (journey_from, journey_to, journey_date, journey_time, transport_cost, food_cost, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [from, to, date, time, transport, food, 1]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        console.error('Journey insert error:', error);
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
