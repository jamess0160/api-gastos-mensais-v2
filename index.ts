import express from "express"
import rotas from "./rotas"
import AsyncHandler from "./src/asyncHandler"
import conn from "./src/conn"

const app = express()

app.get("/teste", AsyncHandler(async (req, res, next) => {
    res.json(await conn.query("SELECT NOW() as TesteConexao"))
}))

app.use(rotas)

app.listen(3001, () => {
    console.log("API aberta: http://localhost:3001/teste")
})