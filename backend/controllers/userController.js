const User = require('../models/userModel');
const bcrypt = require('bcrypt');

const createUser = async (req, res) => {
    try{
        const { username, email, password, smsActivateApiKey } = req.body;
        const existingUser = await User.findOne({ $or: [{username}, {email}] });
        if(existingUser){
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword, smsActivateApiKey });
        await newUser.save();

        res.status(201).json({ message: `User ${username} with ${email} has created successfully` });
    } catch(err){
        res.status(500).json({ message: `Error to create user: ${err.message}` });
    }
};

const getUsers = async (req, res) => {
    try{
        const user = await User.find().select('-password -smsActivateApiKey');
        res.status(200).json(users);
    } catch (err){
        res.status(500).json({ message: `Error to get users: ${err.message}` });
    }
};

const getUserById = async (req, res) => {
    try{
        const user = await User.findById(req.params.id).select('-password -smsActivateApiKey');
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch(err){
        res.status(500).json({ message: `Error to get user: ${err.message}` });
    }
};

const updateUser = async (req, res) => {
    try{
        const {username, email } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true}.select('-password -smsActivateApiKey'));
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully', user });
    } catch(err){
        res.status(500).json({ message: `Error to update user: ${err.message}` });
    }
};

const deleteUser = async (req, res) => {
    try{
        const user = await User.findByIdAndDelete(req.params.id);
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch(err){
        res.status(500).json({ message: `Error to delete user: ${err.message}` });
    }
};

module.exports = { createUser, getUsers, getUserById, updateUser, deleteUser };