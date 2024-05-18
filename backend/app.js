// Importing required modules
const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const db = require('./Database/db');

const userRouter = require('./Routers/user_routes');
const User = require('./Models/User');
const postRouter = require('./Routers/post_routes');
const Post = require('./Models/Post');

dotenv.config();

const app = express();
const router = express.Router();

// Setting up the port
const port = process.env.PORT || 3000;

// Setting up middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin",
               "http://localhost:4200");
    res.header("Access-Control-Allow-Headers",
               "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Middleware for JWT authentication (user token)
app.use(async (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            console.log("Token received in app.js: ", token);
            const data = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(data._id);
            if (user && user.password === data.password) {
                req.user = user;
                // Debug print
                console.log("User name retrieved from user token: ", user.username);
            }
        } catch (error) {
            console.log(error);
        }
    }
    next();
});

// Setting up the routes
app.use(router);
router.use(userRouter);
router.use(postRouter);

// Redirect to localhost:4200
app.get('/', (req, res) => {
    res.redirect('http://localhost:4200');
});

// Debug message, using port on
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Connecting to the database
db().then(r => console.log(r)).catch(e => console.log(e));
