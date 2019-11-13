'use strict'


function addIndex () {
    return (ctx, next) => {
        ctx.body.map((el, index) => {
            el.position = index + 1
            return el
        })
        return next()
    }
}

exports.addIndex = addIndex