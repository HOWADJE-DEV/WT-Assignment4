const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../Models/User');
const router = express.Router();

// Get the actual user information from the token
router.get('/me', async (req, res) => {
    try {
      let token = req.cookies.token;
      if (!token) {
        const bearerHeader = req.headers['authorization'];
        if (typeof bearerHeader !== 'undefined') {
          const bearer = bearerHeader.split(' ');
          token = bearer[1];
        }
      }
      if (!token) {
        return res.send({ user: null });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded._id)
      const username = user.username;
      const email = user.email;
      const expert = user.expert;
      const id = user._id;
      res.send({ username, email, expert, id });
    } catch (error) {
      res.send({ user: null });
    }
});

// Route to create a new user
router.post('/createUser', async (req, res) => {
    const { username, password, email, expert } = req.body;
    try {
        const user = new User({ username, password, email, expert });
        await user.save();

        // Create a JWT token
        const token = jwt.sign({ _id: user._id, password: user.password }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Set the token as a cookie
        res.cookie('token', token, { httpOnly: true });

        // Redirect to the home page
        res.status(201).json({ message: 'User created successfully!', success: true, redirect: '/home' });
    } catch (error) {
        console.log(error);
        res.status(400).send({ message: 'Error creating user', error, success: false });
    }
});


// Route to login a user
router.post('/login', async (req, res) => {
    const { username, password, rememberMe } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send({
                message: 'Invalid username or password',
                success: false
            });
        }
        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            return res.status(400).send({
                message: 'Invalid username or password',
                success: false
            });
        }

        // Generate token
        const token = jwt.sign({
            _id: user._id,
            username: user.username // It's safer to not include sensitive data like password
        }, process.env.JWT_SECRET, {
            expiresIn: '30d' // or '7d' based on your security requirement
        });

        // Send token in a cookie or in the response
        if (rememberMe)
            res.cookie('token', token, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
        res.send({
            message: 'Login successful!',
            user,
            token,
            success: true
        });
    } catch (error) {
        console.log(error); // Log the error
        res.status(500).send({
            message: 'Error logging in',
            error,
            success: false
        });
    }
});

// Route to logout a user
router.get('/logout', (req, res) => {
    res.clearCookie('token');
});

// Route to get a user by id
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        res.send(user);
    } catch (error) {
        res.status(500).send();
    }
});

// Route to update a user
router.patch('/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        updates.forEach((update) => user[update] = req.body[update]);
        await user.save();
        res.send(user);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Route to delete a user
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        res.send(user);
    } catch (error) {
        res.status(500).send();
    }
});



module.exports = router;
module.exports = router;
