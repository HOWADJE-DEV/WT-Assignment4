const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Post = require('../Models/Post');
const User = require('../Models/User'); // Assuming User model is used
const router = express.Router();

dotenv.config();

// Create post
router.post('/create_post', async (req, res) => {
  const secret = process.env.JWT_SECRET;
  const { title, content, token } = req.body;
  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded._id); // Assuming User model is used
    const author_username = user.username;
    console.log("Author:", author_username);
    const newPost = new Post({ title, content, author_username, user, ratings: [], answers: [], rating_value: 0, archived: false, date: new Date() });
    await newPost.save();
    res.status(201).json({ message: 'Post created' });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized/Error' });
  }
});

// Get a few posts
router.get('/posts/:page/:filter_archived/:searchInput?', async (req, res) => {
  try {
    const {page, filter_archived} = req.params;
    const filter_archived_bool = filter_archived === 'true';
    const perPage = 5;
    // If filter_archived is true, we ignore the archived posts
    const query = filter_archived_bool ? {is_archived: false} : {};

    // If the search input is not empty, we search for the posts that contain the search input in the title or content
    const { searchInput } = req.params;
    if (searchInput) {
      query.$or = [
        { title: { $regex: searchInput, $options: 'i' } },
        { content: { $regex: searchInput, $options: 'i' } }
      ];
    }

    // We retrieve the posts by creation date, in descending order
    // We then skip the posts that are before the current page, and limit the results to the perPage value
    // We also need to calculate the "rating_value" of each post, which is the sum of all the ratings (1-5 stars)
    const posts = await Post.find(query).sort({createdAt: -1}).lean();
    const totalPosts = posts.length;
    const totalPages = Math.ceil(totalPosts / perPage);
    const currentPage = Math.min(Number(page), totalPages);
    const skipPosts = (currentPage - 1) * perPage;
    const limitedPosts = posts.slice(skipPosts, skipPosts + perPage);
    const pagesNeeded = Math.ceil(totalPosts / perPage);
    res.status(200).json({posts: limitedPosts, pagesNeeded});
  } catch (error) {
    res.status(500).json({message: 'Error'});
  }
});

// Get a single post
router.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id).lean();
  // We sort the answers by the upvote_value field, in descending order (most upvoted first), and then by creation date
  post.answers.sort((a, b) => b.upvote_value - a.upvote_value || a.date - b.date);

  res.status(200).json(post);
});

// Archive a post
router.post('/archive_post', async (req, res) => {
  const { postId, token } = req.body;
  const secret = process.env.JWT_SECRET;
  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded._id);
    const post = await Post.findById(postId);
    if (post.author_username === user.username) {
      post.is_archived = true;
      await post.save();
      res.status(201).json({message: 'Post archived'});
    } else {
      res.status(401).json({message: 'Unauthorized'});
    }
  } catch (error) {
    res.status(401).json({message: 'Unauthorized'});
  }
});

// Rate a post
router.post('/rate_post', async (req, res) => {
  const { postId, rating, token } = req.body;
  const secret = process.env.JWT_SECRET;

  // Retrieve user from token
  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded._id);

    // We need to check if the user has already rated the post
    const post = await Post.findById(postId);

    if (!post.ratings)
      post.ratings = [];
    const user_rating = post.ratings.find(rating => rating.user.toString() === user._id.toString());
    // If the user has already rated the post, we update the rating value
    if (user_rating)
      user_rating.rating = rating;
    // If not, we add a new rating
    else
      post.ratings.push({ user: user, rating: rating });

    // CALCULATE THE RATING VALUE
    // Update the rating value of the post only if there are ratings
    if (post.ratings && post.ratings.length > 0) {
      // Rating value is the sum of all the ratings divided by the number of ratings
      // We first check if the sum is 0
      const sum = post.ratings.reduce((acc, rating) => acc + rating.rating, 0);
      if (sum === 0)
        post.rating_value = 0;
      else
        post.rating_value = sum / post.ratings.length;
    } else {
      post.rating_value = 0;
    }

    await post.save();
    res.status(201).json({ message: 'Post rated' });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// Create an answer to a post
router.post('/create_answer', async (req, res) => {
  const { postId, text, token } = req.body;
  const secret = process.env.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded._id);
    const username = user.username;
    const answer = { text, user, username, date: new Date(), upvotes: [], upvote_value: 0, comments: []};
    await Post.findByIdAndUpdate(postId, { $push: { answers: answer } });
    res.status(201).json({ message: 'Answer created' });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// Upvote an answer
router.post('/upvote_answer', async (req, res) => {
  const { postId, answerId, token, value } = req.body;
  const secret = process.env.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded._id);
    const post = await Post.findById(postId);
    const answer = post.answers.id(answerId);

    // Add the upvote to the answer's upvotes array, or update the value if the user has already upvoted
    const upvote = answer.upvotes.find(upvote => upvote.user.toString() === user._id.toString());
    if (upvote) {
      // If it is the same value, we remove the upvote
      if (upvote.value === value)
        answer.upvotes.pull(upvote);
      else
        upvote.value = value;
    }
    else
      answer.upvotes.push({ user: user, value: value });

    // Calculate the new upvote_value of the answer (true = 1, false = -1)
    answer.upvote_value = answer.upvotes.reduce((acc, upvote) => acc + (upvote.value ? 1 : -1), 0);

    await post.save();
    res.status(201).json({ message: 'Upvote registered' });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// Create a comment to an answer
router.post('/create_comment', async (req, res) => {
  const { postId, answerId, text, token } = req.body;
  // decode user
  const secret = process.env.JWT_SECRET;
  const decoded = jwt.verify(token, secret);
  const user = await User.findById(decoded._id);
  const username = user.username;
  const date = new Date();
  const comment = { text, user, username, date };

  // Add a new comment to the answer
  await Post.updateOne({ _id: postId, 'answers._id': answerId }, { $push: { 'answers.$.comments': comment } });
  res.status(201).json({ message: 'Comment created' });
});

// Validate an answer
router.post('/validate_answer', async (req, res) => {
  const { postId, answerId, token } = req.body;
  const secret = process.env.JWT_SECRET;
  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded._id);
    const post = await Post.findById(postId);
    const answer = post.answers.id(answerId);

    if (post.author_username === user.username) {
      answer.isValidated = true;
      await post.save();
      res.status(201).json({ message: 'Answer validated' });
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

module.exports = router;
