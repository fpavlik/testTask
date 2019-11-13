'use strict'

const mongoose = require('mongoose')
const FavoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId
    },
    postId: {
        type: mongoose.Schema.Types.ObjectId
    }
})

const BlocksSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    html: {
        type: String
    },
    params: {
        type: Object
    }
})

const idTagsSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId
    }
})

const PostSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    photo: {
        source: { type: String },
        url: { type: String }
    },
    lead: {
        type: String
    },
    lettersCount: {
        type: Number
    },
    html: {
        type: String,
        required: true
    },
    rubric: {
        type: mongoose.Schema.Types.ObjectId
    },
    countView: { type: Number },
    authorId: { type: mongoose.Schema.Types.ObjectId },
    author: { type: String },
    tags: [idTagsSchema],
    requiredBlocks: [BlocksSchema],
    optionalBlocks: [BlocksSchema],
    eventDate: { type: Date },
    positionMain: { type: Number, default: 0 },
    positionRubrics: { type: Number, default: 0 },
    mainRejected: { type: Boolean, default: false },
    hotBlock: { type: Boolean, default: false },
    hotNews: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    suggests: { type: Array },
    updated: { type: Date, default: Date.now },
    created: { type: Date, default: Date.now },
    date: { type: Date, default: Date.now }
})

PostSchema.index({ created: -1 })
PostSchema.index({ hotBlock: -1, hotNews: -1, positionMain: -1 })
PostSchema.index({ hotBlock: -1, hotNews: -1, positionRubrics: -1 })
PostSchema.index({ "html": "text", "title": "text", "lead": "text" },
    { name: 'text index', weights: { html: 5, title: 15, lead: 10 } }, { default_language: "russian" })
exports.Post = mongoose.model('Post', PostSchema)
exports.Favorite = mongoose.model('Favorite', FavoriteSchema)
