'use strict'

const config = require('config')

const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const koaBody = require('koa-body')
const cors = require('@koa/cors')
const logger = require('koa-logger')

const booksRoute = require('./books/routes')
const middleware = require('./modules/middleware')

const app = new Koa()

app.use(cors())
app.use(koaBody({ multipart: true, maxFieldsSize: 5 * 1024 * 1024 }))
app.use(logger())
app.use(bodyParser())

app.use(middleware.time)
app.use(middleware.err)
app.use(booksRoute)

const serverPort = config.has('port') ? config.get('port') : 3009
app.listen(serverPort)
