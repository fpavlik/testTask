'use strict'

const Router = require('@koa/router')
const config = require('config')
const router = new Router({
    prefix: config.get('api') + 'books'
})
const { saveImg, addAuthor, addBook, updBook, getBooks } = require('./service')

router.get('/', async (ctx) => {
    // I want to use Redis, i understand how it can works, but i haven't got any experience((((
    // so we will use simple koa and mysql
    ctx.body = await getBooks(ctx)
})

router.put('/add', async (ctx) => {
    ctx.request.body.data = JSON.parse(ctx.request.body.data)
    // At first we have to save img and write img's path to all book data
    ctx = await saveImg(ctx)
    // Next step - lets try to create new author or use existed to get his id
    ctx = await addAuthor(ctx)
    // Finally - saving book
    await addBook(ctx)
    ctx.body = 'Saved!'
})

router.post('/update', async (ctx) => {
    ctx.request.body.data = JSON.parse(ctx.request.body.data)
    // The same process for img and author like in add route
    ctx = await saveImg(ctx)
    ctx = await addAuthor(ctx)
    await updBook(ctx)
    ctx.body = 'Updated!'
})

router.get('/*', async(ctx) => {
    ctx.throw(404)
})

module.exports = router.routes()
