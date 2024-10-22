const User = require('../models/userModel');
const bcrypt = require('bcrypt');

const register = async (req, res ) => {
    try {

        // Verifies if the id is already registered
        const existingUser = await User.findOne({ telegramId });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const newUser = new User({
            telegramId,
            firstName,
            lastName,
            username
        });

        await newUser.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { register };