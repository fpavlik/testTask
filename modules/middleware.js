'use strict'
const { errors } = require('./errors')
exports.err = async (ctx, next) => {
    try {
        await next()
        ctx.body = { data: ctx.body, 'res': 'success' }
    } catch (err) {
        ctx.status = 400
        ctx.body = JSON.stringify({
            'res': 'error',
            err: errors[err.status] ? errors[err.status] : err.message,
            code: err.status
        })
    }
}

exports.time = async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    ctx.set('X-Response-Time', `${ms}ms`)
}
