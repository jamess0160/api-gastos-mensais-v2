import express from "express"
import rotas from "./rotas"
import AsyncHandler from "./src/asyncHandler"
import conn from "./src/conn"
import cors from 'cors'
import { Registro_gasto } from "./rotas/registro_gastos"
import moment from "moment"

const app = express()

app.use(cors())
app.use(express.json())

app.get("/teste", AsyncHandler(async (req, res, next) => {
    res.json(await conn.query("SELECT NOW() as TesteConexao"))
}))

app.post("/proximoMes/mesAtual=:mes", AsyncHandler(async (req, res) => {
    let registrosParaDuplicar = await conn.query<Registro_gasto>("SELECT * FROM registro_gastos WHERE parcela_atual < parcelas_totais AND MONTH(data_registro) = ?", [req.params.mes])

    let novosRegistros = registrosParaDuplicar.map((item) => {
        item.parcela_atual += 1
        item.data_registro = moment(item.data_registro).add(1, 'month').format("YYYY-MM-DD hh:mm:ss")
        return {
            ...item,
            id: undefined
        }
    })

    res.json(await conn.transaction(novosRegistros.map((item) => {
        return {
            query: "INSERT INTO registro_gastos SET ?",
            params: [item]
        }
    })))
}))

app.use(rotas)

app.listen(3002, () => {
    console.log("API aberta: http://localhost:3001/teste")
})