import express from "express"
import rotas from "./rotas"
import AsyncHandler from "./src/asyncHandler"
import conn from "./src/conn"
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())

app.get("/teste", AsyncHandler(async (req, res, next) => {
    res.json(await conn.query("SELECT NOW() as TesteConexao"))
}))

app.use(rotas)

app.listen(3002, () => {
    console.log("API aberta: http://localhost:3001/teste")
})