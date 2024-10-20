require('dotenv').config();
const User = require('../models/userModel');
const Plan = require('../models/planModel');
const PlanType = require('../models/planTypeModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { encryptApiKey } = require('../utils/encryptApiKeyUtils');


// Função de registro
const register = async (req, res) => {
    try {
        const { username, email, password, smsActivateApiKey } = req.body;

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const encryptedApiKey = encryptApiKey(smsActivateApiKey);

        const newUser = new User({ username, email, password: hashedPassword, smsActivateApiKey: encryptedApiKey });
        await newUser.save();

        const planType = await PlanType.findOne({ name: 'basic' });
        if (!planType) {
            return res.status(500).json({ message: 'Default plan type not found' });
        }

        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + planType.durationInDays);
        const newPlan = new Plan({ userId: newUser._id, planTypeId: planType._id, expirationDate });
        await newPlan.save();

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: 'Registration successful', token, user: { username, email } });
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error });
    }
};

// Função de login
const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] }).select('+smsActivateApiKey');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error });
    }
};

module.exports = { register, login };