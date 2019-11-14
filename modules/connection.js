'use strict'

const mysql = require('mysql')
const config = require('config')

const connection = mysql.createConnection({
  host     : config.get('db.host'),
  user     : config.get('db.user'),
  password : config.get('db.pass'),
  database : config.get('db.dbName')
})

connection.connect()

exports.con = connection 