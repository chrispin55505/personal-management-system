const db = require('../db/db');

const User = {
    create: async (newUser) => {
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [newUser.name, newUser.email, newUser.password]
        );
        return result.insertId;
    },

    findByEmail: async (email) => {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }
};

module.exports = User;
