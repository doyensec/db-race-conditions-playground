const mysql = require('mysql')

class Db {
    pool = null

    constructor() {
        this.pool = mysql.createPool({
            host: 'localhost',
            port: 3306,
            user: 'racer',
            password: 'password',
            database: 'test001',
            insecureAuth: true,
            connectionLimit: 10,
        });
    }

    async init(isolation) {
        return new Promise((resolve, reject) => {
            if (!this.pool) {
                reject({ error: 'db not initiated' })
                return
            }

            this.pool.getConnection((error, conn) => {
                if (error) {
                    reject({ error: error })
                    return
                }
    
                conn.query('SET SESSION TRANSACTION ISOLATION LEVEL ' + isolation, (error, results, fields) => {
                    if (error) {
                        reject({ error: error })
                        conn.release();
                        return
                    }
    
                    resolve()
                    conn.release();
                })
            })
        })
    }

    async getIsolation() {
        return new Promise((resolve, reject) => {
            if (!this.pool) {
                reject({ error: 'db not initiated' })
                return
            }

            this.pool.getConnection((error, conn) => {
                if (error) {
                    reject({ error: error })
                    return
                }
       
                conn.query('SELECT @@transaction_isolation', (error, results, fields) => {
                    if (error) {
                        reject({ error: error })
                        conn.release();
                        return
                    }
    
                    resolve(results)
                    conn.release();
                })
        })
        })
    }

    async transfer(source, destination, amount) {
        return new Promise((resolve, reject) => {
            if (!this.pool) {
                reject({ error: 'db not initiated' })
                return
            }
    
            this.pool.getConnection((error, conn) => {
                if (error) {
                    reject({ error: error })
                    return
                }
    
                //conn.beginTransaction((error) => {
                conn.query('BEGIN', (error) => {
                    if (error) {
                        reject({ error: error })
                        conn.release();
                        return
                    }
    
                    conn.query('SELECT * FROM users WHERE id = ?', [source], (error, results, fields) => {
                        if (error) {
                            reject({ error: error })
                            conn.release();
                            return
                        }
    
                        const entry = results[0]

                        if (amount <= 0 || entry.balance < amount) {
                            reject({ error: 'invalid transfer' })
                            conn.release();
                            return
                        }

                        conn.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, source], (error, results, fields) => {
                            if (error) {
                                reject({ error: error })
                                conn.release();
                                return
                            }

                            conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, destination], (error, results, fields) => {
                                if (error) {
                                    reject({ error: error })
                                    conn.release();
                                    return
                                }

                                //conn.commit((error) => {
                                conn.query('COMMIT', (error) => {   
                                    if (error) {
                                        conn.rollback(() => { reject({ error: error }) })
                                        return
                                    }
    
                                    resolve({ status: 'ok' })
                                    conn.release()
                                })
                            })
                        })
                    })
                })
            })
        })
    }

    async reset() {
        return new Promise((resolve, reject) => {
            if (!this.pool) {
                reject({ error: 'db not initiated' })
                return
            }
    
            this.pool.getConnection((error, conn) => {
                if (error) {
                    reject({ error: error })
                    return
                }
    
                conn.query('UPDATE users SET balance = 100 WHERE id = 1', (error, results, fields) => {
                });
                conn.query('UPDATE users SET balance = 20 WHERE id = 2', (error, results, fields) => {
                });
    
                resolve({ status: 'ok' })
                conn.release();
            })
        })
    }

    async dump() {
        return new Promise((resolve, reject) => {
            if (!this.pool) {
                reject({ error: 'db not initiated' })
                return
            }
    
            this.pool.getConnection((error, conn) => {
                if (error) {
                    reject({ error: error })
                    return
                }
    
                conn.query('SELECT * FROM users', (error, results, fields) => {
                    if (error) {
                        reject({ error: error })
                        conn.release();
                        return
                    }
    
                    resolve(results)
                    conn.release();
                });
            })
        })
    }

    async dump0(onSuccess, onError) {
        if (!this.pool) {
            onError({ error: 'db not initiated' })
            return
        }

        this.pool.getConnection((error, conn) => {
            if (error) {
                onError({ error: error })
                return
            }

            conn.query('SELECT * FROM users', (error, results, fields) => {
                if (error) {
                    onError({ error: error })
                    conn.release();
                    return
                }

                onSuccess(results)
                conn.release();
            });
        })
    }
}

module.exports = { Db };