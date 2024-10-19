require('dotenv').config();
const express = require('express');
const {connectDB} = require('./db/mongo.js');
const port = process.env.PORT || 3000;

// Import routes
const sessionRoutes = require('./routes/sessionRoutes.js');
const authRoutes = require('./routes/authRoutes');

const app = express();

connectDB();

app.use(express.json());

//Use routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/auth', authRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})