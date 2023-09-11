import express from "express"
import rotas from "./rotas"
import AsyncHandler from "./src/asyncHandler"
import conn from "./src/conn"
import cors from 'cors'
import 'dotenv/config'

const app = express()

app.use(cors())
app.use(express.json())

app.get("/teste", AsyncHandler(async (req, res, next) => {
    res.json(await conn.query("SELECT NOW() as TesteConexao"))
}))

app.use(rotas)

const port = process.env.port || 3000

app.listen(port, () => {
    console.log(`API aberta: http://localhost:${port}/teste`)
})