const maria = require('mariadb')

class Db {
    pool = null
    isolation = null;

    constructor() {
        this.pool = maria.createPool({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'password',
            database: 'test001',
        });
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
            throw { error: 'db not initiated' }
        }

        let conn = null
        try {
            conn = await this.pool.getConnection()

            await conn.query('SET TRANSACTION ISOLATION LEVEL ' + this.isolation);
            await conn.query('BEGIN')

            let data = await conn.query('SELECT * FROM users WHERE id = ?', [source])
            let entry = data[0]

            if (amount < 0 || entry.balance < amount) {
                throw { error: 'invalid transfer' }
            }
            
            await conn.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, source])
            await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, destination])

            await conn.query('COMMIT')
            return { status: 'ok' }
        }
        catch (ex) {
            if (conn) await conn.query("ROLLBACK")
            throw ex
        }
        finally {
            if (conn) conn.end()
        }
    }

    async reset() {
        if (!this.pool) {
            throw { error: 'db not initiated' }
        }

        let conn = null
        try {
            conn = await this.pool.getConnection()
            conn.query('UPDATE users SET balance = 100 WHERE id = 1')
            conn.query('UPDATE users SET balance = 20 WHERE id = 2')
            return { status: 'ok' }
        }
        catch (ex) {
            throw ex
        }
        finally {
            if (conn) conn.end()
        }
    }

    async dump() {
        if (!this.pool) {
            throw { error: 'db not initiated' }
        }

        let conn = null
        try {
            conn = await this.pool.getConnection()
            const data = await conn.query('SELECT * FROM users')
            return data
        }
        catch (ex) {
            throw ex
        }
        finally {
            if (conn) conn.end()
        }
    }
}

module.exports = { Db };