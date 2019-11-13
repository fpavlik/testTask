'use strict'

const mongoose = require('mongoose')
const { Post, Favorite } = require('./model')
const { Feed } = require('../feeds/model')
const mainUrl = require('config').get('mainUrl')
const PROJECT = {
    type: 1,
    title: 1,
    photo: 1,
    lead: 1,
    lettersCount: 1,
    html: 1,
    author: 1,
    tags: 1,
    date: { $convert: { input: "$date", to: "long" } },
    'url': { $concat: [mainUrl, "$url"] },
    rubric: { $arrayElemAt: ["$rubric", 0] }
}
const LOOKUP = [{
    $lookup:
        {
            from: 'tags',
            localField: 'tags',
            foreignField: '_id',
            as: 'tags'
        }
}, {
    $lookup:
        {
            from: 'rubrics',
            localField: 'rubric',
            foreignField: '_id',
            as: 'rubric'
        }
}]

async function getPostByID (postID) {
    try {
        let post = await Post.aggregate().match({ '_id': mongoose.Types.ObjectId(postID) })
            .lookup({
                from: 'tags',
                localField: 'tags',
                foreignField: '_id',
                as: 'tags'
            }).lookup({
                from: 'rubrics',
                localField: 'rubric',
                foreignField: '_id',
                as: 'rubric'
            }).project(PROJECT)

        return post.length > 0 ? post[0] : null
    } catch (e) {
        console.log(e)
        return null
    }
}

function getDailyPosts (count, skip) {
    return Post.aggregate([
        { $match: { mainRejected: false, published: true } },
        ...getByDayAggregate(count, skip, true),
        ...LOOKUP,
        {
            $project: PROJECT
        }
    ])
}

async function getSuggests (count, skip, postId) {
    const post = await Post.findOne({ '_id': postId })
    return post ? Post.aggregate().match({ '_id': { $in: post.suggests }, published: true }).lookup({
        from: 'tags',
        localField: 'tags',
        foreignField: '_id',
        as: 'tags'
    }).lookup({
        from: 'rubrics',
        localField: 'rubric',
        foreignField: '_id',
        as: 'rubric'
    }).skip(parseInt(skip)).limit(parseInt(count)).project(PROJECT) : []
}

async function getFavorites (userId, count, skip) {
    return Favorite.aggregate([
        { $match: { 'userId': mongoose.Types.ObjectId(userId) } },
        {
            $lookup:
                {
                    from: 'posts',
                    localField: 'postId',
                    foreignField: '_id',
                    as: 'post'
                }
        },
        { $unwind: '$post' },
        { $replaceRoot: { newRoot: "$post" } },
        { $match: { published: true } },
        {
            $lookup:
                {
                    from: 'tags',
                    localField: 'tags',
                    foreignField: '_id',
                    as: 'tags'
                }
        }, {
            $lookup:
                {
                    from: 'rubrics',
                    localField: 'rubric',
                    foreignField: '_id',
                    as: 'rubric'
                }
        }
    ]).skip(parseInt(skip)).limit(parseInt(count)).project(PROJECT)
}

async function addFavorites (userId, postId) {
    const existFavorite = await Favorite.findOne({ userId, postId })
    if (!existFavorite) {
        const favorite = new Favorite({ userId, postId })
        return favorite.save()
    }
}

async function deleteFavorites (userId, postId) {
    return Favorite.deleteOne({ userId, postId })
}

async function getPostsByRubricId (rubricId, count, skip) {
    return Post.aggregate([
        { $match: { rubric: mongoose.Types.ObjectId(rubricId) } },
        ...getByDayAggregate(count, skip, false),
        ...LOOKUP,
        { $project: PROJECT }
    ])
}

async function getAnalog (count, skip, postId) {
    const post = await Post.findOne({ '_id': postId })
    if (!post) {
        return []
    }
    const partCount = Math.floor(count / 2)
    const partSkip = Math.floor(skip / 2)
    const result = []
    const byRubrics = await getPostsByMatch({
        date: { $lt: new Date(post.date) },
        rubric: post.rubric
    }, partSkip, partCount)
    const byTags = await getPostsByMatch({
        date: { $lt: new Date(post.date) },
        tags: { $in: post.tags }
    }, partSkip, partCount)

    for (let i = 0; i < partCount; i++) {
        if (byRubrics[i]) {
            result.push(byRubrics[i])
        }
        if (byTags[i]) {
            result.push(byTags[i])
        }
    }

    return result
}

async function getPersonal (count, skip, userId) {
    const feeds = await Feed.findOne({ userId })
    if (!feeds) {
        return []
    }

    return getPostsByMatch({ tags: { $in: feeds.tags } }, parseInt(skip), parseInt(count))
}

async function getPersonalByDay (count, skip, userId) {
    const feeds = await Feed.findOne({ userId })
    if (!feeds) {
        return []
    }

    const date = new Date()
    date.setDate(date.getDate() - 1)

    return getPostsByMatch({
        tags: { $in: feeds.tags },
        date: { $gte: date, $lte: new Date }
    }, parseInt(skip), parseInt(count))
}

async function search (count, skip, match) {
    return getPostsByMatch({ '$text': { '$search': match } }, parseInt(skip), parseInt(count),
        { $sort: { score: { $meta: "textScore" } } })
}

async function getDailyPostsByDay () {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    return Post.aggregate([
        { $match: { mainRejected: false, published: true, date: { $gte: date, $lte: new Date } } },
        ...getByDayAggregate(40, 0, true),
        ...LOOKUP,
        {
            $project: PROJECT
        }
    ])
}

function getByDayAggregate (count, skip, main = true) {
    return [{ $sort: { created: -1 } },
        { $skip: parseInt(skip) },
        { $limit: parseInt(count) },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, posts: { $push: "$$ROOT" } } },
        { $sort: { _id: -1 } },
        { $unwind: '$posts' },
        { $replaceRoot: { newRoot: "$posts" } },
        { $sort: { hotBlock: -1, hotNews: -1, [main ? 'positionMain' : 'positionRubrics']: -1 } }]
}

function getPostsByMatch (match, skip, limit, additional = { $match: {} }) {
    return Post.aggregate([
        { $match: match },
        { $match: { published: true } },
        {
            $lookup:
                {
                    from: 'tags',
                    localField: 'tags',
                    foreignField: '_id',
                    as: 'tags'
                }
        }, {
            $lookup:
                {
                    from: 'rubrics',
                    localField: 'rubric',
                    foreignField: '_id',
                    as: 'rubric'
                }
        },
        additional
    ]).skip(skip).limit(limit).project(PROJECT)
}

exports.service = {
    getPostByID,
    getDailyPosts,
    getSuggests,
    getFavorites,
    addFavorites,
    getAnalog,
    getPersonal,
    deleteFavorites,
    getDailyPostsByDay,
    getPersonalByDay,
    getPostsByRubricId,
    search
}