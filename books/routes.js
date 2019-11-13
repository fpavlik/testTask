'use strict'

const Router = require('@koa/router')
const config = require('config')
const router = new Router({
    prefix: config.get('api') + 'posts'
})
const {
    verifyToken,
    validatePage,
    checkQueryCountPage,
    checkQueryId,
    checkHeaderToken,
    checkBodyId,
    checkPost
} = require('../modules/validate')
const { service } = require('./service')

const { addIndex } = require('../modules/service')

router.get('/', checkQueryId(), async (ctx, next) => {
    const { id } = ctx.request.query
    const post = await service.getPostByID(id)
    if (post) {
        ctx.body = post
    } else {
        ctx.throw(101)
    }
    return next()
}, checkPost())

// TODO fix checkHeaderToken()
router.get('/personal', validatePage(), verifyToken(), async (ctx, next) => {
    ctx.body = await service.getPersonal(ctx.query['count'], ctx.skip, ctx.userInfo['_id'])
    return next()
}, addIndex())

router.get('/personal/day', verifyToken(), async (ctx, next) => {
    ctx.body = await service.getPersonalByDay(ctx.userInfo['_id'])
    return next()
}, addIndex())

// TODO fix checkQueryId(), checkQueryCountPage()
router.get('/suggest', validatePage(), async (ctx, next) => {
    ctx.body = await service.getSuggests(ctx.query['count'], ctx.skip, ctx.query['id'])
    return next()
}, addIndex())

router.get('/analog', validatePage(), async (ctx, next) => {
    ctx.body = await service.getAnalog(ctx.query['count'], ctx.skip, ctx.query['id'])
    return next()
}, addIndex())

router.get('/daily', checkQueryCountPage(), validatePage(), async (ctx, next) => {
    ctx.body = await service.getDailyPosts(ctx.query['count'], ctx.skip)
    return next()
}, addIndex())

router.get('/daily/day', async (ctx, next) => {
    ctx.body = await service.getDailyPostsByDay()
    return next()
}, addIndex())

router.get('/rubric', validatePage(), async (ctx, next) => {
    ctx.body = await service.getPostsByRubricId(ctx.query['id'], ctx.query['count'], ctx.skip)
    return next()
}, addIndex())

router.get('/favorites', validatePage(), verifyToken(), async (ctx, next) => {
    ctx.body = await service.getFavorites(ctx.userInfo['_id'], ctx.query['count'], ctx.skip)
    return next()
}, addIndex())

router.get('/favorites/all', verifyToken(), async (ctx, next) => {
    ctx.body = await service.getFavorites(ctx.userInfo['_id'], 300, 0)
    return next()
}, addIndex())

router.post('/favorites', checkHeaderToken(), checkBodyId(), verifyToken(), async (ctx) => {
    await service.addFavorites(ctx.userInfo['_id'], ctx.request.body['id'])
})
// TODO fix checkHeaderToken(), checkQueryId(), verifyToken()
router.delete('/favorites', verifyToken(), async (ctx) => {
    await service.deleteFavorites(ctx.userInfo['_id'], ctx.query['id'])
})

router.get('/search', validatePage(), async (ctx, next) => {
    ctx.body = await service.search(ctx.query['count'], ctx.skip, ctx.query['search'])
    return next()
}, addIndex())

module.exports = router.routes()
