// Enhanced error detection middleware
function detectDatabaseError(error) {
    const errorPatterns = {
        'connection': [
            'ECONNREFUSED',
            'ENOTFOUND',
            'ETIMEDOUT',
            'connect',
            'connection',
            'timeout'
        ],
        'authentication': [
            'access denied',
            'authentication',
            'login',
            'password',
            'credentials'
        ],
        'table_missing': [
            "doesn't exist",
            'Unknown table',
            'Table',
            "doesn't exist"
        ],
        'column_missing': [
            "Unknown column",
            'column',
            "field"
        ],
        'constraint': [
            'constraint',
            'duplicate',
            'unique',
            'foreign key',
            'ER_DUP_ENTRY'
        ],
        'syntax': [
            'syntax error',
            'SQL syntax',
            'near'
        ],
        'data_type': [
            'incorrect',
            'invalid',
            'conversion',
            'type'
        ]
    };

    const errorMessage = error.message.toLowerCase();
    const errorCode = error.code || '';
    
    for (const [type, patterns] of Object.entries(errorPatterns)) {
        for (const pattern of patterns) {
            if (errorMessage.includes(pattern.toLowerCase()) || errorCode.includes(pattern)) {
                return {
                    type,
                    severity: type === 'connection' ? 'critical' : type === 'authentication' ? 'high' : 'medium',
                    message: getErrorMessage(type, error),
                    suggestion: getSuggestion(type, error)
                };
            }
        }
    }
    
    return {
        type: 'unknown',
        severity: 'medium',
        message: 'Unknown database error occurred',
        suggestion: 'Check Railway logs for detailed error information'
    };
}

function getErrorMessage(type, error) {
    const messages = {
        'connection': `Database connection failed: ${error.message}`,
        'authentication': `Database authentication failed: ${error.message}`,
        'table_missing': `Required table doesn't exist: ${error.message}`,
        'column_missing': `Required column doesn't exist: ${error.message}`,
        'constraint': `Database constraint violation: ${error.message}`,
        'syntax': `SQL syntax error: ${error.message}`,
        'data_type': `Data type mismatch: ${error.message}`
    };
    return messages[type] || error.message;
}

function getSuggestion(type, error) {
    const suggestions = {
        'connection': 'Check Railway MySQL service status and connection settings',
        'authentication': 'Verify database credentials in Railway environment variables',
        'table_missing': 'Run the database schema setup script in Railway MySQL Query tab',
        'column_missing': 'Update database schema to match application requirements',
        'constraint': 'Check for duplicate data or foreign key constraints',
        'syntax': 'Review SQL query syntax and table structure',
        'data_type': 'Ensure data types match between application and database schema'
    };
    return suggestions[type] || 'Contact support with error details';
}

// Enhanced API response helper
function sendApiResponse(res, success, data, error = null) {
    if (success) {
        return res.json({
            success: true,
            data,
            timestamp: new Date().toISOString(),
            message: data.message || 'Operation completed successfully'
        });
    } else {
        const detectedError = error ? detectDatabaseError(error) : {
            type: 'unknown',
            severity: 'medium',
            message: 'Operation failed',
            suggestion: 'Try again or contact support'
        };

        return res.status(error && error.status || 500).json({
            success: false,
            error: {
                type: detectedError.type,
                severity: detectedError.severity,
                message: detectedError.message,
                suggestion: detectedError.suggestion,
                original: error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            }
        });
    }
}

const express = require('express');
const router = express.Router();

// Import simplified controllers
const authController = require('../controllers/authController-simple');

// Simple dashboard stats
router.get('/dashboard/stats', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        
        console.log('📊 Loading dashboard stats...');
        
        // Get basic counts with error handling for each query
        let moduleCount = 0, appointmentCount = 0, moneyOwed = 0, journeyCount = 0;
        
        try {
            const [modules] = await pool.query('SELECT COUNT(*) as count FROM modules');
            moduleCount = modules[0].count || 0;
            console.log(`📚 Modules count: ${moduleCount}`);
        } catch (err) {
            console.error('⚠️ Error getting modules count:', err.message);
        }
        
        try {
            const [appointments] = await pool.query('SELECT COUNT(*) as count FROM appointments WHERE status = "upcoming"');
            appointmentCount = appointments[0].count || 0;
            console.log(`📅 Appointments count: ${appointmentCount}`);
        } catch (err) {
            console.error('⚠️ Error getting appointments count:', err.message);
        }
        
        try {
            const [money] = await pool.query('SELECT SUM(amount) as total FROM money_records WHERE status = "pending"');
            moneyOwed = money[0].total || 0;
            console.log(`💰 Money owed: ${moneyOwed}`);
        } catch (err) {
            console.error('⚠️ Error getting money total:', err.message);
        }
        
        try {
            const [journeys] = await pool.query('SELECT COUNT(*) as count FROM journeys WHERE status = "pending"');
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
        return sendApiResponse(res, true, stats);
    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        return sendApiResponse(res, false, null, error);
    }
});

// Basic CRUD routes for all modules
router.get('/timetable', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        console.log('📅 Loading timetable...');
        const [rows] = await pool.query('SELECT * FROM timetable ORDER BY exam_date');
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
        
        const [result] = await pool.query(
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
        
        const [result] = await pool.query('DELETE FROM timetable WHERE id = ?', [id]);
        
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
        const [rows] = await pool.query('SELECT * FROM modules ORDER BY code');
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
            const validationError = new Error('Missing required fields');
            validationError.status = 400;
            validationError.required = ['code', 'name'];
            throw validationError;
        }
        
        const [result] = await pool.query(
            'INSERT INTO modules (code, name, lecturer, semester, year, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [code, name, lecturer || '', semester || 1, year || 1, 1]
        );
        
        console.log(`✅ Module added with ID: ${result.insertId}`);
        return sendApiResponse(res, true, { 
            id: result.insertId, 
            message: 'Module added successfully' 
        });
    } catch (error) {
        console.error('❌ Module insert error:', error);
        return sendApiResponse(res, false, null, error);
    }
});

router.post('/money', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { person, amount, borrowDate, returnDate } = req.body;
        
        console.log('💰 Adding money record:', { person, amount, borrowDate, returnDate });
        
        // Validate required fields
        if (!person || !amount || !borrowDate) {
            const validationError = new Error('Missing required fields');
            validationError.status = 400;
            validationError.required = ['person', 'amount', 'borrowDate'];
            throw validationError;
        }
        
        const [result] = await pool.query(
            'INSERT INTO money_records (person_name, amount, borrow_date, expected_return_date, user_id) VALUES (?, ?, ?, ?, ?)',
            [person, parseFloat(amount), borrowDate, returnDate || null, 1]
        );
        
        console.log(`✅ Money record added with ID: ${result.insertId}`);
        return sendApiResponse(res, true, { 
            id: result.insertId, 
            message: 'Money record added successfully' 
        });
    } catch (error) {
        console.error('❌ Money insert error:', error);
        return sendApiResponse(res, false, null, error);
    }
});

router.post('/appointments', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { name, place, date, time, aim, notification } = req.body;
        
        console.log('📅 Adding appointment:', { name, place, date, time, aim, notification });
        
        // Validate required fields
        if (!name || !date || !time) {
            const validationError = new Error('Missing required fields');
            validationError.status = 400;
            validationError.required = ['name', 'date', 'time'];
            throw validationError;
        }
        
        const [result] = await pool.query(
            'INSERT INTO appointments (name, place, appointment_date, appointment_time, aim, notification, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, place || '', date, time, aim || '', notification || 'none', 1]
        );
        
        console.log(`✅ Appointment added with ID: ${result.insertId}`);
        return sendApiResponse(res, true, { 
            id: result.insertId, 
            message: 'Appointment added successfully' 
        });
    } catch (error) {
        console.error('❌ Appointment insert error:', error);
        return sendApiResponse(res, false, null, error);
    }
});

// Journeys endpoints
router.get('/journeys', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        console.log('🚗 Loading journeys...');
        const [rows] = await pool.query('SELECT * FROM journeys ORDER BY journey_date');
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
        
        const [result] = await pool.query(
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

// Savings endpoints
router.get('/savings', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        console.log('💰 Loading savings...');
        const [rows] = await pool.query('SELECT * FROM savings ORDER BY date DESC');
        console.log(`✅ Loaded ${rows.length} savings records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Savings load error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/savings', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { amount, date } = req.body;
        
        console.log('💰 Adding savings record:', { amount, date });
        
        // Validate required fields
        if (!amount || !date) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['amount', 'date']
            });
        }
        
        const [result] = await pool.query(
            'INSERT INTO savings (amount, date, user_id) VALUES (?, ?, ?)',
            [parseFloat(amount), date, 1]
        );
        
        console.log(`✅ Savings record added with ID: ${result.insertId}`);
        res.json({ id: result.insertId, success: true, message: 'Savings record added successfully' });
    } catch (error) {
        console.error('❌ Savings insert error:', error);
        res.status(500).json({ 
            error: 'Failed to add savings record',
            details: error.message 
        });
    }
});

router.delete('/savings/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        
        console.log(`🗑️ Deleting savings record ID: ${id}`);
        
        const [result] = await pool.query('DELETE FROM savings WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Savings record not found' });
        }
        
        console.log(`✅ Savings record ${id} deleted`);
        res.json({ success: true, message: 'Savings record deleted successfully' });
    } catch (error) {
        console.error('❌ Savings delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Activities endpoint
router.get('/activities', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        console.log('📋 Loading activities...');
        const [rows] = await pool.query('SELECT * FROM activities ORDER BY created_at DESC LIMIT 10');
        console.log(`✅ Loaded ${rows.length} activities`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Activities load error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
