import mysql, { QueryOptions } from "mysql2"
import "dotenv/config"

type transactionParam = {
    query: string,
    params: any[]
}

const connection = mysql.createConnection({
    host: process.env.db_host,
    user: process.env.db_user,
    password: process.env.db_password,
    database: process.env.db_database,
})

connection.connect()

export default {
    query<T = any>(sqlQuery: string, params?: any[], debug?: boolean): Promise<T[]> {

        return new Promise((resolve, reject) => {
            let queryObject: QueryOptions = {
                sql: sqlQuery,
                values: params
            }

            if (debug) {
                console.log(queryObject)
            }

            connection.query(queryObject, (error, result) => {
                if (error) {
                    reject(error)
                    return
                }
                resolve(result as T[])
            })
        })
    },

    transaction(queryes: transactionParam[]) {
        return new Promise((resolve, reject) => {
            connection.beginTransaction(async (error) => {
                if (error) return reject(error)

                try {
                    for await (let item of queryes) {
                        await this.query(item.query, item.params)
                    }
                    connection.commit(console.log)
                    resolve({ msg: "Success" })
                } catch (error) {
                    reject(error)
                    connection.rollback(console.log)
                }
            })
        })
    },

    transactionFn(fn: () => Promise<any>) {
        return new Promise((resolve, reject) => {
            connection.beginTransaction(async (error) => {
                if (error) return reject(error)

                try {
                    let res = await fn()
                    connection.commit(console.log)
                    resolve(res)
                } catch (error) {
                    reject(error)
                    connection.rollback(console.log)
                }
            })
        })
    }
}