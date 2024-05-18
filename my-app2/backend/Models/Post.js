const mongoose = require('mongoose');

// Create the comment schema
const CommentSchema = new mongoose.Schema({
    text: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    username: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to update the updatedAt value
CommentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create upvote schema
const UpvoteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    value: Boolean
});

// Create the asnwer schema
const AnswerSchema = new mongoose.Schema({
    text: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    username: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    upvotes: [UpvoteSchema], // Use the UpvoteSchema for upvotes
    upvote_value: Number,
    comments: [CommentSchema], // Use the CommentSchema for comments
    isValidated: {
      type: Boolean,
      default: false
    }
}, {
    timestamps: true
});

// Pre-save hook to update the updatedAt value
AnswerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Rating schema
const RatingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rating: Number
});

// Create the post schema
const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    author_username: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    is_archived: {
        type: Boolean,
        default: false
    },
    ratings: [RatingSchema], // Use the RatingSchema for ratings
    rating_value: Number,
    answers: [AnswerSchema] // Use the CommentSchema for comments
}, {
    timestamps: true
});

// Pre-save hook to update the updatedAt value
PostSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Export the model
const Post = mongoose.model('Post', PostSchema);

module.exports = mongoose.model('Post', PostSchema);
