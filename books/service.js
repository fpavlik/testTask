// 'use strict'

const {
    con
} = require('../modules/connection')
const fs = require('fs')
const path = require('path')

exports.addBook = async (ctx) => {
    return new Promise((resolve, reject) => {
        const book = ctx.request.body.data
        let sql = `INSERT INTO books (title, date, author_id, description, image) VALUES (${con.escape(book.title)}, ${con.escape(book.date)}, ${con.escape(book.authorId)}, ${con.escape(book.description)}, ${con.escape(book.image)})`
        con.query(sql, (err, result) => {
            if (err) ctx.throw(400, `Failed to save book \n ${err}`)
            resolve()
        })
    })
}

exports.addAuthor = async (ctx) => {
    return new Promise((resolve, reject) => {
        const author = ctx.request.body.data.author
        let sql = `INSERT INTO authors (author_name, author_email) VALUES (${con.escape(author.authorName)}, ${con.escape(author.authorEmail)});`
        con.query(sql, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    sql = `SELECT id FROM authors WHERE author_email = ${con.escape(author.authorEmail)};`
                    con.query(sql, (err, result) => {
                        if (err) ctx.trow(400, `Cannot find author ID \n ${err}`)
                        ctx.request.body.data.authorId = result[0].id
                        resolve(ctx)
                    })
                } else {
                    ctx.throw(400, `Cannot save new author \n ${err}`)
                }
            } else {
                ctx.request.body.data.authorId = result.insertId
                resolve(ctx)
            }
        })
    })
}

exports.saveImg = async (ctx) => {
    return new Promise((resolve, reject) => {
        if (!ctx.request.files.img) {
            ctx.throw(404, 'Img not found')
        }

        const type = /jpg|jpeg|png/.exec(ctx.request.files.img.type)

        if (!type || (!type[0])) {
            ctx.throw(400, 'Format not valid')
        }

        const pathToSave = path.join(__dirname, 'img', `${Date.now().toString()}.${type[0]}`)

        fs.createReadStream(ctx.request.files.img.path).pipe(fs.createWriteStream(pathToSave))
            .on('close', () => {
                ctx.request.body.data.image = pathToSave
                resolve(ctx)
            })
    })
}

exports.updBook = async (ctx) => {
    return new Promise((resolve, reject) => {
        const book = ctx.request.body.data
        let sql = `UPDATE books 
        SET title = ${con.escape(book.title)}, 
        date = ${con.escape(book.date)}, 
        author_id = ${con.escape(book.authorId)}, 
        description = ${con.escape(book.description)}, 
        image = ${con.escape(book.image)} 
        WHERE id = ${con.escape(book.id)}`
        con.query(sql, (err, result) => {
            if (err) ctx.throw(400, `Failed to update book \n ${err}`)
            resolve()
        })
    })
}

exports.getBooks = async (ctx) => {
    return new Promise((resolve, reject) => {
        //lets create my own query builder!!!
        const q = {
            title: ctx.query.title ? ctx.query.title : null,
            date: ctx.query.date ? ctx.query.date : null,
            description: ctx.query.description ? ctx.query.description : null,
            author: ctx.query.author ? ctx.query.author : null,
            offset: ctx.query.offset ? ctx.query.offset : null,
            limit: ctx.query.limit ? ctx.query.limit : null
        }
    
        // Some words about that `q`. q - means `query`, i've done it becouse there is some
        // troubles with iterations in forin cycle with object `ctx.query`
    
        let sql = `SELECT books.id as book_id, title, date, authors.author_name, description, image 
        FROM books
        INNER JOIN authors
        on books.author_id`
        let groupCount = 0
        let orderCount = 0
        if (q.title || q.date || q.description || q.author || q.offset || q.limit) {
            for (const key in q) {
                if (q.hasOwnProperty(key)) {
                    const el = q[key]
                    if (!el) continue
                    if (key.toUpperCase() == 'LIMIT' && el) {
                        sql = sql + `\n LIMIT ${el} `
                    } else if (key.toUpperCase() == 'OFFSET' && el) {
                        sql = sql + `\n OFFSET ${el} `
                    } else {
                        if (el.toUpperCase() == 'GROUP') {
                            if (groupCount === 0) {
                                sql = (key.toUpperCase() == 'AUTHOR') ? sql + `\n GROUP BY author_name` : sql + `\n GROUP BY ${key} `
                            } else {
                                sql = (key.toUpperCase() == 'AUTHOR') ? pasteString('GROUP BY', sql, ` author_name,`) : pasteString('GROUP BY', sql, ` ${key},`)
                            }
                            groupCount++
                        } else {
                            if (orderCount === 0) {
                                sql = (key.toUpperCase() == 'AUTHOR') ? sql + `\n ORDER BY author_name ${el.toUpperCase()}` : sql + `\n ORDER BY ${key} ${el.toUpperCase()} `
                            } else {
                                sql = (key.toUpperCase() == 'AUTHOR') ? pasteString('ORDER BY', sql, ` author_name ${el.toUpperCase()},`) : pasteString('ORDER BY', sql, ` ${key} ${el.toUpperCase()},`)
                            }
                            orderCount++
                        }
                    }
                }
            }
        }

        sql = validateSQL(sql)
        con.query(sql, (err, result) => {
            if (err) ctx.throw(400, `Failed to update book \n ${err}`)
            resolve(result)
        })
    })
}

function pasteString (word, string, sub) {
    let pos = string.indexOf(word)
    let begin = string.slice(0, pos + word.length)
    let end = string.substring(pos + word.length, string.length)
    return begin + sub + end
}

function validateSQL(sql) {
    if (sql.includes('GROUP BY') && sql.includes('ORDER BY')) {
        let orderPos = sql.indexOf('ORDER BY')
        let groupPos = sql.indexOf('GROUP BY')
        if (groupPos > orderPos) {
            let begin = sql.slice(0, orderPos)
            let order = sql.slice(orderPos, groupPos)
            if (sql.includes('OFFSET') && sql.includes('LIMIT')) {
                let limitPos = sql.indexOf('LIMIT')
                let offsetPos = sql.indexOf('OFFSET')
                if (limitPos > offsetPos) {
                    let group = sql.slice(groupPos, offsetPos)
                    let offset = sql.slice(offsetPos, limitPos)
                    let limit = sql.substring(limitPos, sql.length)
                    return begin + group + order + limit + offset
                } else {
                    let group = sql.slice(groupPos, limitPos)
                    let end = sql.substring(limitPos, sql.length)
                    return begin + group + order + end
                }
            } else if (sql.includes('OFFSET')) {
                let offsetPos = sql.indexOf('OFFSET')
                let group = sql.slice(groupPos, offsetPos)
                let end = sql.substring(offsetPos, sql.length)
                return begin + group + order + end
            } else if (sql.includes('LIMIT')) {
                let limitPos = sql.indexOf('LIMIT')
                let group = sql.slice(groupPos, limitPos)
                let end = sql.substring(limitPos, sql.length)
                return begin + group + order + end
            } else {
                let group = sql.substring(groupPos, sql.length)
                return begin + group + order
            }
        } else {
            if (sql.includes('OFFSET') && sql.includes('LIMIT')) {
                let limitPos = sql.indexOf('LIMIT')
                let offsetPos = sql.indexOf('OFFSET')
                if (limitPos > offsetPos) {
                    let begin = sql.slice(0, offsetPos)
                    let offset = sql.slice(offsetPos, limitPos)
                    let limit = sql.substring(limitPos, sql.length)
                    return begin + limit + offset
                } else {
                    return sql
                }
            } else {
                return sql
            }
        }
    } else {
        if (sql.includes('OFFSET') && sql.includes('LIMIT')) {
            let limitPos = sql.indexOf('LIMIT')
            let offsetPos = sql.indexOf('OFFSET')
            if (limitPos > offsetPos) {
                let begin = sql.slice(0, offsetPos)
                let offset = sql.slice(offsetPos, limitPos)
                let limit = sql.substring(limitPos, sql.length)
                return begin + limit + offset
            } else {
                return sql
            }
        } else {
            return sql
        }
    }
}
