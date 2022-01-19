const express = require('express');
const config = require('config');
const router = express.Router();
const jwtAuth = require('../../middleware/jwtAuth');
const User = require('../../Model/User');
const jwt = require('jsonwebtoken');
const secret = config.get('jwtSecret');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// @route   POST api/auth
// @desc    register user
// @access  public
router.get('/', jwtAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth
// @desc    validate user
// @access  public
router.post(
  '/',
  [
    check('email', 'Please include a email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;

    try {
      //check if user exists
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      //return jsonWebToken
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        //header,
        payload,
        secret,
        {
          expiresIn: 3600000,
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
