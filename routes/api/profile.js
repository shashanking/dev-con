const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/jwtAuth');
const Profile = require('../../Model/Profile');
const User = require('../../Model/User');

// @route   Get api/profile/me
// @desc    Geting user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'No profile found' });
    }

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/all
// @desc    Geting all user profile
// @access  Private
router.get('/all', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/profile/user/:user_id
// @desc    Geting profile by user_id
// @access  Private
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'No profile found' });
    }
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'No profile found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/profile/experience
// @desc    creating profile exp
// @access  Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('comapany', 'Company name is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const { title, company, from, description, location } = req.body;

      const newExp = {
        title,
        company,
        from,
        description,
        location,
      };

      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp); //shifts element to first position
      await profile.save();

      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/profile
// @desc    Delete profile, user and post
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    //remove profile
    await Profile.findOneAndRemove({ user: req.user.id });

    //remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'user deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json({ msg: 'Experience of Index ' + removeIndex + ' deleted' });
    res.send(profile);
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') {
      res.json({ msg: 'Invalid ObjectId' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/profile
// @desc    creating and updating
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'status is required').not().isEmpty(),
      check('skills', 'skills are required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      res.status(400).json({ errors: error.array() });
    }
    const { website, status, skills, facebook, instagram } = req.body;

    //Build Profle model
    const profileFields = {};
    profileFields.user = req.user.id;
    if (website) profileFields.website = website;
    if (status) profileFields.status = status;
    if (website)
      profileFields.skills = skills.split(',').map((skill) => skill.trim());

    // Build Social Object
    profileFields.social = {};
    if (facebook) profileFields.social.facebook = facebook;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      profile = new Profile(profileFields);
      profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

module.exports = router;
