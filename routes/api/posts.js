const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/jwtAuth');

const Profile = require('../../Model/Profile');
const Post = require('../../Model/Post');
const User = require('../../Model/User');

// @route   POST api/posts
// @desc    Create post
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('text', 'Text is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ errors: error.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = Post({
        text: req.body.text,
        title: req.body.title,
        avatar: user.avatar,
        name: user.name,
        user: req.user.id,
      });

      const post = await newPost.save();
      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).json('Server Error');
    }
  }
);

// @route   GET api/posts
// @desc    Get all post
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).json('Server Error');
  }
});

// @route   GET api/posts/post/:post_id
// @desc    Get single post
// @access  Private
router.get('/post/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.post_id,
    });
    //console.log(post.user);
    if (!post) {
      return res.status(400).json({ msg: 'No posts found' });
    }
    res.json(post);
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') return res.json({ msg: 'No posts found' });
    res.status(500).json('Server Error');
  }
});

// @route   DELETE api/posts/post/:post_id
// @desc    Delete post
// @access  Private
router.delete('/post/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);

    if (post.user !== req.user.id) {
      return res.status(400).json({ msg: 'invalid user' });
    }
    if (!post) {
      return res.status(400).json({ msg: 'No posts found' });
    }
    await Post.remove();
    res.json({ msg: 'Post removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') return res.json({ msg: 'No posts found' });
    res.status(500).json('Server Error');
  }
});

// @route   PUT api/posts/post/like/:post_id
// @desc    adding like
// @access  Private
router.put('/post/like/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    //if post has already liked by the user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({
        msg: 'post already liked',
        likes: post.likes.map((like) => like.user),
      });
    }
    //adding like of user in likes
    post.likes.unshift({ user: req.user.id });
    // save updated like in db
    await post.save();
    res.json({ post });
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') return res.json({ msg: 'No posts found' });
    res.status(500).json('Server Error');
  }
});

// @route   PUT api/posts/post/unlike/:post_id
// @desc    disliking the post
// @access  Private
router.put('/post/unlike/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    //if post has already liked by the user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({
        msg: "post has'nt been liked yet",
        likes: post.likes.map((like) => like.user),
      });
    }
    //adding like of user in likes
    //will do remove index function
    const removeindex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeindex, 1);
    // save updated like in db
    await post.save();
    res.json({ post });
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') return res.json({ msg: 'No posts found' });
    res.status(500).json('Server Error');
  }
});

// @route   PUT api/posts/post/comment/:post_id
// @desc    adding comment
// @access  Private
router.put('/post/comment/:post_id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const post = await Post.findById(req.params.post_id);
    //multiple comments

    //adding like of user in likes
    const newComment = {
      user: req.user.id,
      name: user.name,
      text: req.body.text,
      avatar: user.avatar,
    };

    post.comments.unshift(newComment);
    // save updated like in db
    await post.save();

    res.json({ post });
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') return res.json({ msg: 'No posts found' });
    res.status(500).json('Server Error');
  }
});

// @route   PUT api/posts/post/comment/:post_id
// @desc    deleteing comment on post
// @access  Private
router.delete('/post/comment/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    const comment = post.comments.find(
      (comment) => comment.user.toString() === req.user.id
    );
    if (!comment) {
      return res.status(400).json({ msg: 'No comment by user' });
    }

    if (post.comments.length === 0) {
      return res.status(500).json({ msg: 'No comments present on post' });
    }

    const removeindex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);
    post.comments.splice(removeindex, 1);
    // save updated like in db
    await post.save();
    res.json(post);
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId') return res.json({ msg: 'No posts found' });
    res.status(500).json('Server Error');
  }
});

module.exports = router;
