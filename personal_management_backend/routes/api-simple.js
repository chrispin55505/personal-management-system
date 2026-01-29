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
        
        console.log('📊 Loading dashboard stats...');
        
        // Get basic counts with error handling for each query
        let moduleCount = 0, appointmentCount = 0, moneyOwed = 0, journeyCount = 0;
        
        try {
            const [modules] = await pool.execute('SELECT COUNT(*) as count FROM modules');
            moduleCount = modules[0].count || 0;
            console.log(`📚 Modules count: ${moduleCount}`);
        } catch (err) {
            console.error('⚠️ Error getting modules count:', err.message);
        }
        
        try {
            const [appointments] = await pool.execute('SELECT COUNT(*) as count FROM appointments WHERE status = "upcoming"');
            appointmentCount = appointments[0].count || 0;
            console.log(`📅 Appointments count: ${appointmentCount}`);
        } catch (err) {
            console.error('⚠️ Error getting appointments count:', err.message);
        }
        
        try {
            const [money] = await pool.execute('SELECT SUM(amount) as total FROM money_records WHERE status = "pending"');
            moneyOwed = money[0].total || 0;
            console.log(`💰 Money owed: ${moneyOwed}`);
        } catch (err) {
            console.error('⚠️ Error getting money total:', err.message);
        }
        
        try {
            const [journeys] = await pool.execute('SELECT COUNT(*) as count FROM journeys WHERE status = "pending"');
            journeyCount = journeys[0].count || 0;
            console.log(`🚗 Journeys count: ${journeyCount}`);
        } catch (err) {
            console.error('⚠️ Error getting journeys count:', err.message);
        }
        
        const stats = {
            moduleCount,
            appointmentCount,
            moneyOwed,
            journeyCount
        };
        
        console.log('✅ Dashboard stats loaded successfully:', stats);
        res.json(stats);
    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        res.status(500).json({ 
            error: 'Failed to load dashboard stats',
            details: error.message 
        });
    }
});

// Basic CRUD routes for all modules
router.get('/timetable', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        console.log('📅 Loading timetable...');
        const [rows] = await pool.execute('SELECT * FROM timetable ORDER BY exam_date');
        console.log(`✅ Loaded ${rows.length} timetable entries`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Timetable load error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/timetable', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { moduleCode, moduleName, date, time, venue } = req.body;
        
        console.log('📅 Adding timetable entry:', { moduleCode, moduleName, date, time, venue });
        
        // Validate required fields
        if (!moduleCode || !moduleName || !date || !time) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['moduleCode', 'moduleName', 'date', 'time']
            });
        }
        
        const [result] = await pool.execute(
            'INSERT INTO timetable (module_code, module_name, exam_date, exam_time, venue, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [moduleCode, moduleName, date, time, venue || '', 1]
        );
        
        console.log(`✅ Timetable entry added with ID: ${result.insertId}`);
        res.json({ id: result.insertId, success: true, message: 'Timetable entry added successfully' });
    } catch (error) {
        console.error('❌ Timetable insert error:', error);
        res.status(500).json({ 
            error: 'Failed to add timetable entry',
            details: error.message 
        });
    }
});

router.delete('/timetable/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        
        console.log(`🗑️ Deleting timetable entry ID: ${id}`);
        
        const [result] = await pool.execute('DELETE FROM timetable WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Timetable entry not found' });
        }
        
        console.log(`✅ Timetable entry ${id} deleted`);
        res.json({ success: true, message: 'Timetable entry deleted successfully' });
    } catch (error) {
        console.error('❌ Timetable delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Similar simplified routes for other modules...
router.get('/modules', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        console.log('📚 Loading modules...');
        const [rows] = await pool.execute('SELECT * FROM modules ORDER BY code');
        console.log(`✅ Loaded ${rows.length} modules`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Modules load error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/modules', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { code, name, lecturer, semester, year } = req.body;
        
        console.log('📚 Adding module:', { code, name, lecturer, semester, year });
        
        // Validate required fields
        if (!code || !name) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['code', 'name']
            });
        }
        
        const [result] = await pool.execute(
            'INSERT INTO modules (code, name, lecturer, semester, year, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [code, name, lecturer || '', semester || 1, year || 1, 1]
        );
        
        console.log(`✅ Module added with ID: ${result.insertId}`);
        res.json({ id: result.insertId, success: true, message: 'Module added successfully' });
    } catch (error) {
        console.error('❌ Module insert error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'Module code already exists' });
        } else {
            res.status(500).json({ 
                error: 'Failed to add module',
                details: error.message 
            });
        }
    }
});

router.delete('/modules/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        
        console.log(`🗑️ Deleting module ID: ${id}`);
        
        const [result] = await pool.execute('DELETE FROM modules WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }
        
        console.log(`✅ Module ${id} deleted`);
        res.json({ success: true, message: 'Module deleted successfully' });
    } catch (error) {
        console.error('❌ Module delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Money records endpoints
router.get('/money', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        console.log('💰 Loading money records...');
        const [rows] = await pool.execute('SELECT * FROM money_records ORDER BY borrow_date DESC');
        console.log(`✅ Loaded ${rows.length} money records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Money records load error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/money', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { person, amount, borrowDate, returnDate } = req.body;
        
        console.log('💰 Adding money record:', { person, amount, borrowDate, returnDate });
        
        // Validate required fields
        if (!person || !amount || !borrowDate) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['person', 'amount', 'borrowDate']
            });
        }
        
        const [result] = await pool.execute(
            'INSERT INTO money_records (person_name, amount, borrow_date, expected_return_date, user_id) VALUES (?, ?, ?, ?, ?)',
            [person, parseFloat(amount), borrowDate, returnDate || null, 1]
        );
        
        console.log(`✅ Money record added with ID: ${result.insertId}`);
        res.json({ id: result.insertId, success: true, message: 'Money record added successfully' });
    } catch (error) {
        console.error('❌ Money insert error:', error);
        res.status(500).json({ 
            error: 'Failed to add money record',
            details: error.message 
        });
    }
});

// Appointments endpoints
router.get('/appointments', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        console.log('📅 Loading appointments...');
        const [rows] = await pool.execute('SELECT * FROM appointments ORDER BY appointment_date');
        console.log(`✅ Loaded ${rows.length} appointments`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Appointments load error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/appointments', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { name, place, date, time, aim, notification } = req.body;
        
        console.log('📅 Adding appointment:', { name, place, date, time, aim, notification });
        
        // Validate required fields
        if (!name || !date || !time) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['name', 'date', 'time']
            });
        }
        
        const [result] = await pool.execute(
            'INSERT INTO appointments (name, place, appointment_date, appointment_time, aim, notification, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, place || '', date, time, aim || '', notification || 'none', 1]
        );
        
        console.log(`✅ Appointment added with ID: ${result.insertId}`);
        res.json({ id: result.insertId, success: true, message: 'Appointment added successfully' });
    } catch (error) {
        console.error('❌ Appointment insert error:', error);
        res.status(500).json({ 
            error: 'Failed to add appointment',
            details: error.message 
        });
    }
});

// Journeys endpoints
router.get('/journeys', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        console.log('🚗 Loading journeys...');
        const [rows] = await pool.execute('SELECT * FROM journeys ORDER BY journey_date');
        console.log(`✅ Loaded ${rows.length} journeys`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Journeys load error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/journeys', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { from, to, date, time, transportCost, foodCost, status } = req.body;
        
        console.log('🚗 Adding journey:', { from, to, date, time, transportCost, foodCost, status });
        
        // Validate required fields
        if (!from || !to || !date) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['from', 'to', 'date']
            });
        }
        
        const transport = parseFloat(transportCost) || 0;
        const food = parseFloat(foodCost) || 0;
        
        const [result] = await pool.execute(
            'INSERT INTO journeys (journey_from, journey_to, journey_date, journey_time, transport_cost, food_cost, user_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [from, to, date, time || '00:00', transport, food, 1, status || 'pending']
        );
        
        console.log(`✅ Journey added with ID: ${result.insertId}`);
        res.json({ id: result.insertId, success: true, message: 'Journey added successfully' });
    } catch (error) {
        console.error('❌ Journey insert error:', error);
        res.status(500).json({ 
            error: 'Failed to add journey',
            details: error.message 
        });
    }
});

// Activities endpoint
router.get('/activities', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        console.log('📋 Loading activities...');
        const [rows] = await pool.execute('SELECT * FROM activities ORDER BY created_at DESC LIMIT 10');
        console.log(`✅ Loaded ${rows.length} activities`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Activities load error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
