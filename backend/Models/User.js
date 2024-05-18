const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Create the user schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    expert: {
        type: Boolean,
        required: true
    },
});

// Method to hash the password
UserSchema.methods.hashPassword = async function() {
    this.password = await bcrypt.hash(this.password, 10);
}

// Method to validate the password
UserSchema.methods.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
}

// Pre-save hook to hash the password before saving the user
UserSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        await this.hashPassword();
    }
    next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;