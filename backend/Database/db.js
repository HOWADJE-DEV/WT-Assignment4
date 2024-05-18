const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const db_uri = process.env.MONGODB_URI || "mongodb+srv://dbAdmin:admin@griffith-wt-assignment3.q7bytar.mongodb.net/?retryWrites=true&w=majority&appName=Griffith-WT-Assignment3";

const db = async () => {
    try {
        await mongoose.connect(db_uri);
        console.log('Connected to the database');
    } catch (error) {
        console.log('Error connecting to the database');
        console.log(error);
    }
}

module.exports = db;