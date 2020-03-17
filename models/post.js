const mongoose = require('mongoose');

const postSChema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    imageUrl: {
        type: String,
        required: true
    },

    content: {
        type: String,
        required: true
    },

    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {timestamps: true});//automatically adds createdAt and updatedAt

module.exports = mongoose.model('Post', postSChema);