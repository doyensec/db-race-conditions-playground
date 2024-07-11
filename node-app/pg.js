const Pool = require('pg').Pool

class Db {
    pool = null
    isolation = null;

    constructor() {
        this.pool = new Pool({
            host: 'localhost',
            database: 'test001',
            user: 'postgres',
            password: 'postgres',
            port: 5432,
        })
    }

    async init(isolation) {
        this.isolation = isolation
        return Promise.resolve()
    }
    
    async getIsolation() {
        return Promise.resolve(this.isolation)
    }

    async transfer(source, destination, amount) {
        if (!this.pool) {
            return { error: 'db not initiated' }
        }

        const client = await this.pool.connect()
        try {
            await client.query('BEGIN TRANSACTION ISOLATION LEVEL ' + this.isolation)

            const data = await client.query('SELECT * FROM users WHERE id = $1', [source])
            const entry = data.rows[0]

            if (amount <= 0 || entry.balance < amount) {
                throw { error: 'invalid transfer' }
            }

            await client.query('UPDATE users SET balance = balance - $2 WHERE id = $1', [source, amount])
            await client.query('UPDATE users SET balance = balance + $2 WHERE id = $1', [destination, amount])

            await client.query('COMMIT')
            return { status: 'ok' }
        }
        catch (error) {
            await client.query('ROLLBACK')
            return { error: error }
        }
        finally {
            client.release()
        }
    }

    async reset() {
        if (!this.pool) {
            return { error: 'db not initiated' }
        }

        const client = await this.pool.connect()
        try {
            await client.query('UPDATE users SET balance = 10 WHERE id = 1')
            await client.query('UPDATE users SET balance = 20 WHERE id = 2')
            return { status: 'ok' }
        }
        catch (error) {
            return error;
        }
        finally {
            client.release()
        }
    }

    async dump() {
        if (!this.pool) {
            return { error: 'db not initiated' }
        }

        const client = await this.pool.connect()
        try {
            const data = await client.query('SELECT * FROM users')
            return data.rows;
        }
        catch (error) {
            return error
        }
        finally {
            client.release()
        }
    }
}

module.exports = { Db }