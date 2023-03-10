import mysql, { QueryOptions } from "mysql"

const connection = mysql.createConnection({
    host: "localhost",
    user: 'root',
    password: '123456',
    database: 'gastos_mensais'
})

connection.connect()


export default {
    query(sqlQuery: string, params?: any[]) {

        return new Promise((resolve, reject) => {
            let queryObject: QueryOptions = {
                sql: sqlQuery,
                values: params
            }
            connection.query(queryObject, (error, result) => {
                if (error) {
                    reject({ error })
                    return
                }
                resolve(result)
            })
        })
    }
}