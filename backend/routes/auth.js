import express from 'express';

import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';

import User from '../models/User.js';

import auth from '../middleware/auth.js';

import adminAuth from '../middleware/adminAuth.js';



const router = express.Router();



// Ensure default admin exists

User.ensureDefaultAdmin();



// Register

router.post('/register', async (req, res) => {

  try {

    const { phoneNumber, password } = req.body;



    if (!phoneNumber || !password) {

      return res.status(400).json({ message: 'Please provide all required fields' });

    }



    if (password.length < 6) {

      return res.status(400).json({ message: 'Password must be at least 6 characters long' });

    }



    let user = await User.findOne({ phoneNumber });

    if (user) {

      return res.status(400).json({ message: 'User already exists with this phone number' });

    }



    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);



    user = new User({

      phoneNumber,

      password: hashedPassword,

      isAdmin: false,

      virtualNumbers: []

    });



    await user.save();



    const token = jwt.sign(

      { userId: user._id },

      process.env.JWT_SECRET,

      { expiresIn: '24h' }

    );



    const userData = {

      id: user._id,

      phoneNumber: user.phoneNumber,

      isAdmin: user.isAdmin,

      virtualNumbers: user.virtualNumbers

    };



    res.status(201).json({

      token,

      user: userData

    });

  } catch (err) {

    console.error('Registration error:', err);

    res.status(500).json({ message: 'Server error during registration' });

  }

});



// Login

router.post('/login', async (req, res) => {

  try {

    const { phoneNumber, password } = req.body;



    if (!phoneNumber || !password) {

      return res.status(400).json({ message: 'Please provide all required fields' });

    }



    const user = await User.findOne({ phoneNumber });

    if (!user) {

      return res.status(400).json({ message: 'Invalid credentials' });

    }



    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {

      return res.status(400).json({ message: 'Invalid credentials' });

    }



    const token = jwt.sign(

      { userId: user._id },

      process.env.JWT_SECRET,

      { expiresIn: '24h' }

    );



    const userData = {

      id: user._id,

      phoneNumber: user.phoneNumber,

      isAdmin: user.isAdmin,

      virtualNumbers: user.virtualNumbers

    };



    res.json({

      token,

      user: userData

    });

  } catch (err) {

    console.error('Login error:', err);

    res.status(500).json({ message: 'Server error during login' });

  }

});



// Make user admin (admin only)

router.post('/make-admin/:userId', [auth, adminAuth], async (req, res) => {

  try {

    const user = await User.findById(req.params.userId);

    if (!user) {

      return res.status(404).json({ message: 'User not found' });

    }



    user.isAdmin = true;

    await user.save();



    res.json({ message: 'User is now an admin' });

  } catch (err) {

    console.error('Make admin error:', err);

    res.status(500).json({ message: 'Server error while making user admin' });

  }

});



// Get user profile

router.get('/profile', auth, async (req, res) => {

  try {

    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {

      return res.status(404).json({ message: 'User not found' });

    }

    res.json(user);

  } catch (err) {

    console.error('Profile fetch error:', err);

    res.status(500).json({ message: 'Server error while fetching profile' });

  }

});



// Add this new route to check server status

router.get('/check', (req, res) => {

  res.status(200).json({ status: 'ok' });

});



export default router;
