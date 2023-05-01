import mysql, { QueryOptions } from "mysql"

type transactionParam = {
    query: string,
    params: any[]
}

const connection = mysql.createConnection({
    host: "localhost",
    user: 'root',
    password: '123456',
    database: 'gastos_mensais_v2_teste'
})

connection.connect()


export default {
    query<T = any>(sqlQuery: string, params?: any[]): Promise<T[]> {

        return new Promise((resolve, reject) => {
            let queryObject: QueryOptions = {
                sql: sqlQuery,
                values: params
            }
            console.log(queryObject)
            connection.query(queryObject, (error, result) => {
                if (error) {
                    reject(error)
                    return
                }
                resolve(result)
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
                    connection.commit()
                    resolve({ msg: "Success" })
                } catch (error) {
                    reject(error)
                    connection.rollback()
                }
            })
        })
    }
}