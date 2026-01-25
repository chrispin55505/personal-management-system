const User = require('../models/User');

const userController = {
    register: async (req, res) => {
        try {
            // In a real application, you would hash the password here
            const newUserId = await User.create(req.body);
            res.status(201).json({ message: 'User created successfully', userId: newUserId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating user' });
        }
    },

    login: async (req, res) => {
        try {
            const user = await User.findByEmail(req.body.email);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // In a real application, you would compare the hashed password here
            if (user.password !== req.body.password) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // In a real application, you would generate a JWT here
            res.status(200).json({ message: 'Logged in successfully', user });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error logging in' });
        }
    }
};

module.exports = userController;
