require('dotenv').config()
const express = require('express')
const spdy = require('spdy')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const { jwtDecode } = require('jwt-decode')
const { Db: PgSqlDb } = require('./pg')
const { Db: MySqlDb } = require('./mysql')
const { Db: MariaDb } = require('./maria')

const CERT_DIR = `${__dirname}/cert`
const PORT = 9009
const app = express()

const auth = false;

let db
const dbType = process.env.DB
console.log(`db => '${dbType}'`)

if (dbType === 'pg') {
    db = new PgSqlDb()
} else if (dbType === 'mysql') {
    db = new MySqlDb()
} else if(dbType == 'maria') {
    db = new MariaDb()
} else {
    throw `unknown db => '${dbType}'`
}

const isolation = process.env.ISOLATION
console.log(`isolation => '${isolation}'`)

if (isolation === '0') {
    db.init('READ UNCOMMITTED')
} else if (isolation === '1') {
    db.init('READ COMMITTED')
} else if (isolation === '2') {
    db.init('REPEATABLE READ')
} else if (isolation === '3') {
    db.init('SERIALIZABLE')
} else {
    throw `unknown isolation level => '${isolation}'`
}

const HTTP2_ENABLED = process.env.HTTP2 === 'true'
console.log(`http2 => '${HTTP2_ENABLED}'`)

app.use(express.json())

app.use((req, res, next) => {
    res.locals.traceId = uuidv4()
    next()
})

app.get('/', async (req, res) => {
    res.status(200).json({pong: 1})
})

app.get('/ping', async (req, res) => {
    res.status(200).json({pong: 1})
})

app.get('/config', async (req, res) => {
    res.status(200).json({
        db: process.env.DB,
        isolation: process.env.ISOLATION,
        http2: process.env.HTTP2
    })
})

app.get('/isolation', async (req, res) => {
    try {
        const result = await db.getIsolation()
        res.status(200).json(result)
    } catch (ex) {
        res.status(500).json(ex)
    }
})

app.get('/dump', async (req, res) => {
    try {
        const result = await db.dump()
        res.status(200).json(result)
    } catch (ex) {
        res.status(500).json(ex)
    }
})

app.get('/reset', async (req, res) => {
    try {
        const result = await db.reset()
        res.status(200).json(result)
    } catch (ex) {
        res.status(500).json(ex)
    }
})

app.post('/transfer', async (req, res) => {
    try {
        const from = req.body.from
        const to = req.body.to
        const amount = req.body.amount
    
        const result = await db.transfer(from, to, amount)
        res.status(200).json(result) 
    } catch (ex) {
        res.status(500).json(ex)
    }
})

let server = app
if (HTTP2_ENABLED) {
    server = spdy.createServer({
        key: fs.readFileSync(`${CERT_DIR}/server.key`),
        cert: fs.readFileSync(`${CERT_DIR}/server.cert`),
    }, app)
}
server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}...`)
})

