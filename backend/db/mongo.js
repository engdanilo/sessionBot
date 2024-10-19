const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

let mongoURI = process.env.MONGO_ENV === 'production' ? process.env.MONGO_URI : process.env.MONGO_URI_DEV;

const connectDB = async () => {

    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = {connectDB, mongoURI};