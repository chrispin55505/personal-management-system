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

// Helper function to log activities
async function logActivity(pool, description, type, status = 'completed') {
    try {
        console.log(`📝 Logging activity: ${description} (${type})`);
        const [result] = await pool.query(
            'INSERT INTO activities (description, type, status, user_id) VALUES (?, ?, ?, ?)',
            [description, type, status, 1]
        );
        console.log(`✅ Activity logged with ID: ${result.insertId}`);
        
        // Clean up old activities (older than 30 days)
        await cleanupOldActivities(pool);
    } catch (error) {
        console.error('❌ Failed to log activity:', error);
    }
}

// Helper function to clean up activities older than 30 days
async function cleanupOldActivities(pool) {
    try {
        const [result] = await pool.query(
            'DELETE FROM activities WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
        );
        if (result.affectedRows > 0) {
            console.log(`🧹 Cleaned up ${result.affectedRows} old activities (older than 30 days)`);
        }
    } catch (error) {
        console.error('❌ Failed to cleanup old activities:', error);
    }
}

// Simple dashboard stats
router.get('/dashboard/stats', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        
        console.log('📊 Loading dashboard stats...');
        
        // Get comprehensive stats with error handling
        let stats = {
            moduleCount: 0,
            appointmentCount: 0,
            appointmentCompleted: 0,
            moneyOwed: 0,
            moneyReturned: 0,
            journeyCount: 0,
            journeyCompleted: 0,
            savingsTotal: 0,
            examCount: 0,
            recentActivityCount: 0
        };
        
        try {
            const [modules] = await pool.query('SELECT COUNT(*) as count FROM modules');
            stats.moduleCount = modules[0].count || 0;
            console.log(`📚 Modules count: ${stats.moduleCount}`);
        } catch (err) {
            console.error('⚠️ Error getting modules count:', err.message);
        }
        
        try {
            const [appointments] = await pool.query('SELECT COUNT(*) as count FROM appointments WHERE status = "upcoming"');
            stats.appointmentCount = appointments[0].count || 0;
            console.log(`📅 Upcoming appointments: ${stats.appointmentCount}`);
        } catch (err) {
            console.error('⚠️ Error getting appointments count:', err.message);
        }
        
        try {
            const [appointmentsCompleted] = await pool.query('SELECT COUNT(*) as count FROM appointments WHERE status = "completed"');
            stats.appointmentCompleted = appointmentsCompleted[0].count || 0;
            console.log(`✅ Completed appointments: ${stats.appointmentCompleted}`);
        } catch (err) {
            console.error('⚠️ Error getting completed appointments count:', err.message);
        }
        
        try {
            const [money] = await pool.query('SELECT SUM(amount) as total FROM money_records WHERE status = "pending"');
            stats.moneyOwed = money[0].total || 0;
            console.log(`💰 Money owed: ${stats.moneyOwed}`);
        } catch (err) {
            console.error('⚠️ Error getting money owed:', err.message);
        }
        
        try {
            const [moneyReturned] = await pool.query('SELECT SUM(amount) as total FROM money_records WHERE status = "returned"');
            stats.moneyReturned = moneyReturned[0].total || 0;
            console.log(`💰 Money returned: ${stats.moneyReturned}`);
        } catch (err) {
            console.error('⚠️ Error getting money returned:', err.message);
        }
        
        try {
            const [journeys] = await pool.query('SELECT COUNT(*) as count FROM journeys');
            stats.journeyCount = journeys[0].count || 0;
            console.log(`🚗 Total journeys: ${stats.journeyCount}`);
        } catch (err) {
            console.error('⚠️ Error getting journeys count:', err.message);
        }
        
        try {
            const [journeysCompleted] = await pool.query('SELECT COUNT(*) as count FROM journeys WHERE status = "completed"');
            stats.journeyCompleted = journeysCompleted[0].count || 0;
            console.log(`✅ Completed journeys: ${stats.journeyCompleted}`);
        } catch (err) {
            console.error('⚠️ Error getting completed journeys count:', err.message);
        }
        
        try {
            const [savings] = await pool.query('SELECT SUM(amount) as total FROM savings');
            stats.savingsTotal = savings[0].total || 0;
            console.log(`💎 Total savings: ${stats.savingsTotal}`);
        } catch (err) {
            console.error('⚠️ Error getting savings total:', err.message);
        }
        
        try {
            const [exams] = await pool.query('SELECT COUNT(*) as count FROM timetable');
            stats.examCount = exams[0].count || 0;
            console.log(`📝 Total exams: ${stats.examCount}`);
        } catch (err) {
            console.error('⚠️ Error getting exams count:', err.message);
        }
        
        try {
            const [activities] = await pool.query('SELECT COUNT(*) as count FROM activities WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
            stats.recentActivityCount = activities[0].count || 0;
            console.log(`📋 Recent activities (7 days): ${stats.recentActivityCount}`);
        } catch (err) {
            console.error('⚠️ Error getting recent activities count:', err.message);
        }
        
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
        
        // Log activity
        await logActivity(pool, `Added exam: ${moduleName} (${moduleCode}) on ${date}`, 'timetable', 'added');
        
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
        
        // Log activity
        await logActivity(pool, `Deleted exam entry`, 'timetable', 'deleted');
        
        res.json({ success: true, message: 'Timetable entry deleted successfully' });
    } catch (error) {
        console.error('❌ Timetable delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/timetable/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        const { moduleCode, moduleName, date, time, venue } = req.body;
        
        console.log('📅 Updating timetable entry:', { id, moduleCode, moduleName, date, time, venue });
        
        // Validate required fields
        if (!moduleCode || !moduleName || !date || !time) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['moduleCode', 'moduleName', 'date', 'time']
            });
        }
        
        const [result] = await pool.query(
            'UPDATE timetable SET module_code = ?, module_name = ?, exam_date = ?, exam_time = ?, venue = ? WHERE id = ?',
            [moduleCode, moduleName, date, time, venue || '', id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Timetable entry not found' });
        }
        
        console.log(`✅ Timetable entry ${id} updated`);
        
        // Log activity
        await logActivity(pool, `Updated exam: ${moduleName} (${moduleCode})`, 'timetable', 'updated');
        
        res.json({ success: true, message: 'Timetable entry updated successfully' });
    } catch (error) {
        console.error('❌ Timetable update error:', error);
        res.status(500).json({ 
            error: 'Failed to update timetable entry',
            details: error.message 
        });
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
        console.log('📝 Request body:', req.body);
        
        // Validate required fields
        if (!code || !name) {
            const validationError = new Error('Module code and name are required fields');
            validationError.status = 400;
            validationError.required = ['code', 'name'];
            console.log('❌ Validation failed:', validationError.message);
            throw validationError;
        }
        
        // Check if modules table exists and has correct structure
        try {
            console.log('🔍 Checking modules table structure...');
            const [tableInfo] = await pool.query('DESCRIBE modules');
            console.log('✅ Modules table structure:', tableInfo.map(col => `${col.Field}: ${col.Type}`));
            
            // Check if id column has AUTO_INCREMENT
            const idColumn = tableInfo.find(col => col.Field === 'id');
            if (!idColumn || !idColumn.Extra.includes('auto_increment')) {
                console.log('⚠️ Modules table id column missing AUTO_INCREMENT, repairing...');
                
                // Drop and recreate the modules table with correct structure
                await pool.query('DROP TABLE IF EXISTS modules');
                await pool.query(`
                    CREATE TABLE modules (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        code VARCHAR(20) NOT NULL,
                        name VARCHAR(100) NOT NULL,
                        lecturer VARCHAR(100),
                        semester INT NOT NULL DEFAULT 1,
                        year INT NOT NULL DEFAULT 1,
                        user_id INT DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                `);
                console.log('✅ Modules table recreated with AUTO_INCREMENT id');
            }
        } catch (describeError) {
            console.log('⚠️ Modules table check failed, attempting to create it...');
            
            // Try to create the modules table manually
            await pool.query(`
                CREATE TABLE IF NOT EXISTS modules (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    code VARCHAR(20) NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    lecturer VARCHAR(100),
                    semester INT NOT NULL DEFAULT 1,
                    year INT NOT NULL DEFAULT 1,
                    user_id INT DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Modules table created/fixed');
        }
        
        console.log('🔍 Executing INSERT query...');
        const [result] = await pool.query(
            'INSERT INTO modules (code, name, lecturer, semester, year, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [code, name, lecturer || '', semester || 1, year || 1, 1]
        );
        
        console.log(`✅ Module added with ID: ${result.insertId}`);
        
        // Log activity
        await logActivity(pool, `Added module: ${name} (${code})`, 'module', 'added');
        
        return sendApiResponse(res, true, { 
            id: result.insertId, 
            message: 'Module added successfully' 
        });
    } catch (error) {
        console.error('❌ Module insert error:', error);
        console.error('❌ Error details:', {
            message: error.message,
            status: error.status,
            stack: error.stack
        });
        return sendApiResponse(res, false, null, error);
    }
});

router.put('/modules/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        const { code, name, lecturer, semester, year } = req.body;
        
        console.log('📚 Updating module:', { id, code, name, lecturer, semester, year });
        
        // Validate required fields
        if (!code || !name) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['code', 'name']
            });
        }
        
        const [result] = await pool.query(
            'UPDATE modules SET code = ?, name = ?, lecturer = ?, semester = ?, year = ? WHERE id = ?',
            [code, name, lecturer || '', semester || 1, year || 1, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }
        
        console.log(`✅ Module ${id} updated`);
        
        // Log activity
        await logActivity(pool, `Updated module: ${name} (${code})`, 'module', 'updated');
        
        res.json({ success: true, message: 'Module updated successfully' });
    } catch (error) {
        console.error('❌ Module update error:', error);
        res.status(500).json({ 
            error: 'Failed to update module',
            details: error.message 
        });
    }
});

// Marks routes
router.get('/marks', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        console.log('📊 Loading marks...');
        const [rows] = await pool.query(`
            SELECT m.*, mo.code as module_code 
            FROM marks m 
            LEFT JOIN modules mo ON m.module_id = mo.id 
            ORDER BY m.marks_date DESC
        `);
        console.log(`✅ Loaded ${rows.length} marks`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Marks load error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/marks', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const { moduleId, category, marks } = req.body;
        
        console.log('📊 Adding marks:', { moduleId, category, marks });
        console.log('📝 Request body:', req.body);
        
        // Validate required fields
        if (!moduleId || !marks) {
            const validationError = new Error('Module and marks are required fields');
            validationError.status = 400;
            validationError.required = ['moduleId', 'marks'];
            console.log('❌ Validation failed:', validationError.message);
            throw validationError;
        }
        
        // Check if marks table exists and has correct structure
        try {
            console.log('🔍 Checking marks table structure...');
            const [tableInfo] = await pool.query('DESCRIBE marks');
            console.log('✅ Marks table structure:', tableInfo.map(col => `${col.Field}: ${col.Type}`));
            
            // Check if id column has AUTO_INCREMENT
            const idColumn = tableInfo.find(col => col.Field === 'id');
            if (!idColumn || !idColumn.Extra.includes('auto_increment')) {
                console.log('⚠️ Marks table id column missing AUTO_INCREMENT, repairing...');
                
                // Drop and recreate the marks table with correct structure
                await pool.query('DROP TABLE IF EXISTS marks');
                await pool.query(`
                    CREATE TABLE marks (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        module_id INT NOT NULL,
                        module_name VARCHAR(100) NOT NULL,
                        lecturer VARCHAR(100),
                        category ENUM('group-assignment', 'individual-assignment', 'test01', 'test02', 'presentation') NOT NULL,
                        marks DECIMAL(5,2) NOT NULL,
                        marks_date DATE NOT NULL,
                        user_id INT DEFAULT 1,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                `);
                console.log('✅ Marks table recreated with AUTO_INCREMENT id');
            }
        } catch (describeError) {
            console.log('⚠️ Marks table check failed, attempting to create it...');
            
            // Try to create the marks table manually
            await pool.query(`
                CREATE TABLE IF NOT EXISTS marks (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    module_id INT NOT NULL,
                    module_name VARCHAR(100) NOT NULL,
                    lecturer VARCHAR(100),
                    category ENUM('group-assignment', 'individual-assignment', 'test01', 'test02', 'presentation') NOT NULL,
                    marks DECIMAL(5,2) NOT NULL,
                    marks_date DATE NOT NULL,
                    user_id INT DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Marks table created/fixed');
        }
        
        // Get module details
        const [moduleRows] = await pool.query('SELECT * FROM modules WHERE id = ?', [moduleId]);
        if (moduleRows.length === 0) {
            const validationError = new Error('Module not found');
            validationError.status = 404;
            throw validationError;
        }
        
        const module = moduleRows[0];
        
        const [result] = await pool.query(
            'INSERT INTO marks (module_id, module_name, lecturer, category, marks, marks_date, user_id) VALUES (?, ?, ?, ?, ?, CURDATE(), ?)',
            [moduleId, module.name, module.lecturer || '', category || 'test01', parseFloat(marks), 1]
        );
        
        console.log(`✅ Marks added with ID: ${result.insertId}`);
        
        // Log activity
        await logActivity(pool, `Added marks: ${marks} for ${module.name} (${module.code})`, 'marks', 'added');
        
        return sendApiResponse(res, true, { 
            id: result.insertId, 
            message: 'Marks added successfully' 
        });
    } catch (error) {
        console.error('❌ Marks insert error:', error);
        console.error('❌ Error details:', {
            message: error.message,
            status: error.status,
            stack: error.stack
        });
        return sendApiResponse(res, false, null, error);
    }
});

router.delete('/marks/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        
        console.log(`🗑️ Deleting marks ID: ${id}`);
        
        const [result] = await pool.query('DELETE FROM marks WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Marks not found' });
        }
        
        console.log(`✅ Marks ${id} deleted`);
        
        // Log activity
        await logActivity(pool, `Deleted marks entry`, 'marks', 'deleted');
        
        res.json({ success: true, message: 'Marks deleted successfully' });
    } catch (error) {
        console.error('❌ Marks delete error:', error);
        res.status(500).json({ 
            error: 'Failed to delete marks',
            details: error.message 
        });
    }
});

router.put('/marks/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        const { moduleId, category, marks } = req.body;
        
        console.log('📊 Updating marks:', { id, moduleId, category, marks });
        
        // Validate required fields
        if (!moduleId || !marks) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['moduleId', 'marks']
            });
        }
        
        // Get module details
        const [moduleRows] = await pool.query('SELECT * FROM modules WHERE id = ?', [moduleId]);
        if (moduleRows.length === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }
        
        const module = moduleRows[0];
        
        const [result] = await pool.query(
            'UPDATE marks SET module_id = ?, module_name = ?, lecturer = ?, category = ?, marks = ? WHERE id = ?',
            [moduleId, module.name, module.lecturer || '', category || 'test01', parseFloat(marks), id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Marks not found' });
        }
        
        console.log(`✅ Marks ${id} updated`);
        
        // Log activity
        await logActivity(pool, `Updated marks: ${marks} for ${module.name} (${module.code})`, 'marks', 'updated');
        
        res.json({ success: true, message: 'Marks updated successfully' });
    } catch (error) {
        console.error('❌ Marks update error:', error);
        res.status(500).json({ 
            error: 'Failed to update marks',
            details: error.message 
        });
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
        
        // Log activity
        await logActivity(pool, `Added money record: ${person} owes ${parseFloat(amount).toLocaleString()} TZS`, 'money', 'added');
        
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
        
        // Log activity
        await logActivity(pool, `Added appointment: ${name} on ${date} at ${time}`, 'appointment', 'added');
        
        return sendApiResponse(res, true, { 
            id: result.insertId, 
            message: 'Appointment added successfully' 
        });
    } catch (error) {
    }
});

// Money endpoints
router.get('/money', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        console.log('💰 Loading money records...');
        const [rows] = await pool.query('SELECT * FROM money_records ORDER BY borrow_date');
        console.log(`✅ Loaded ${rows.length} money records`);
        res.json(rows);
    } catch (error) {
        console.error('❌ Money load error:', error);
        res.status(500).json({ error: error.message });
    }
});

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
        
        // Log activity
        await logActivity(pool, `Added journey: ${from} to ${to} on ${date}`, 'journey', 'added');
        
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
        
        // Log activity
        await logActivity(pool, `Added savings: ${parseFloat(amount).toLocaleString()} TZS`, 'savings', 'added');
        
        res.json({ id: result.insertId, success: true, message: 'Savings record added successfully' });
    } catch (error) {
        console.error('❌ Savings insert error:', error);
        res.status(500).json({ 
            error: 'Failed to add savings record',
            details: error.message 
        });
    }
});

router.put('/journeys/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        const { from, to, date, time, transportCost, foodCost } = req.body;
        
        console.log('🚗 Updating journey:', { id, from, to, date, time, transportCost, foodCost });
        
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
            'UPDATE journeys SET journey_from = ?, journey_to = ?, journey_date = ?, journey_time = ?, transport_cost = ?, food_cost = ? WHERE id = ?',
            [from, to, date, time || '00:00', transport, food, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Journey not found' });
        }
        
        console.log(`✅ Journey ${id} updated`);
        res.json({ success: true, message: 'Journey updated successfully' });
    } catch (error) {
        console.error('❌ Journey update error:', error);
        res.status(500).json({ 
            error: 'Failed to update journey',
            details: error.message 
        });
    }
});

router.put('/journeys/:id/status', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        const { status } = req.body;
        
        console.log('🚗 Updating journey status:', { id, status });
        
        // Validate status
        const validStatuses = ['pending', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Invalid status',
                validStatuses 
            });
        }
        
        const [result] = await pool.query(
            'UPDATE journeys SET status = ? WHERE id = ?',
            [status, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Journey not found' });
        }
        
        console.log(`✅ Journey ${id} status updated to ${status}`);
        
        // Log activity
        await logActivity(pool, `Updated journey status to ${status}`, 'journey', 'status_updated');
        
        res.json({ success: true, message: `Journey marked as ${status}` });
    } catch (error) {
        console.error('❌ Journey status update error:', error);
        res.status(500).json({ 
            error: 'Failed to update journey status',
            details: error.message 
        });
    }
});

router.delete('/money/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        
        console.log(`🗑️ Deleting money record ID: ${id}`);
        
        const [result] = await pool.query('DELETE FROM money_records WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Money record not found' });
        }
        
        console.log(`✅ Money record ${id} deleted`);
        
        // Log activity
        await logActivity(pool, `Deleted money record`, 'money', 'deleted');
        
        res.json({ success: true, message: 'Money record deleted successfully' });
    } catch (error) {
        console.error('❌ Money delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/modules/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        
        console.log(`🗑️ Deleting module ID: ${id}`);
        
        const [result] = await pool.query('DELETE FROM modules WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }
        
        console.log(`✅ Module ${id} deleted`);
        
        // Log activity
        await logActivity(pool, `Deleted module`, 'module', 'deleted');
        
        res.json({ success: true, message: 'Module deleted successfully' });
    } catch (error) {
        console.error('❌ Module delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/appointments/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        
        console.log(`🗑️ Deleting appointment ID: ${id}`);
        
        const [result] = await pool.query('DELETE FROM appointments WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        console.log(`✅ Appointment ${id} deleted`);
        
        // Log activity
        await logActivity(pool, `Deleted appointment`, 'appointment', 'deleted');
        
        res.json({ success: true, message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('❌ Appointment delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/journeys/:id', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        
        console.log(`🗑️ Deleting journey ID: ${id}`);
        
        const [result] = await pool.query('DELETE FROM journeys WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Journey not found' });
        }
        
        console.log(`✅ Journey ${id} deleted`);
        
        // Log activity
        await logActivity(pool, `Deleted journey`, 'journey', 'deleted');
        
        res.json({ success: true, message: 'Journey deleted successfully' });
    } catch (error) {
        console.error('❌ Journey delete error:', error);
        res.status(500).json({ error: error.message });
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
        
        console.log(`✅ Savings ${id} deleted`);
        
        // Log activity
        await logActivity(pool, `Deleted savings record`, 'savings', 'deleted');
        
        res.json({ success: true, message: 'Savings record deleted successfully' });
    } catch (error) {
        console.error('❌ Savings delete error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/appointments/:id/complete', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        
        console.log('📅 Completing appointment:', { id });
        
        const [result] = await pool.query(
            'UPDATE appointments SET status = "completed" WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        console.log(`✅ Appointment ${id} marked as completed`);
        
        // Log activity
        await logActivity(pool, `Completed appointment`, 'appointment', 'completed');
        
        res.json({ success: true, message: 'Appointment marked as completed' });
    } catch (error) {
        console.error('❌ Appointment complete error:', error);
        res.status(500).json({ 
            error: 'Failed to complete appointment',
            details: error.message 
        });
    }
});

router.put('/money/:id/return', async (req, res) => {
    try {
        const { pool } = require('../config/database-simple');
        const id = req.params.id;
        
        console.log('💰 Marking money as returned:', { id });
        
        const [result] = await pool.query(
            'UPDATE money_records SET status = "returned" WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Money record not found' });
        }
        
        console.log(`✅ Money record ${id} marked as returned`);
        
        // Log activity
        await logActivity(pool, `Marked money as returned`, 'money', 'returned');
        
        res.json({ success: true, message: 'Money marked as returned' });
    } catch (error) {
        console.error('❌ Money return error:', error);
        res.status(500).json({ 
            error: 'Failed to mark money as returned',
            details: error.message 
        });
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
