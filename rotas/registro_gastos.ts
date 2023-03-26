import express from "express"
import AsyncHandler from "../src/asyncHandler"
import conn from "../src/conn"

export type Registro_gasto = {
    id: number
    data_registro: string
    data_gasto: string
    descricao: string
    parcela_atual: string
    parcelas_totais: string
    valor: number
    tipo: number
    banco_id: number
}

const registro_gastos = express()

registro_gastos.get('/registro_gastos', AsyncHandler(async (req, res) => {
    res.json(await conn.query("SELECT * FROM registro_gastos ORDER BY id LIMIT 500"))
}))

registro_gastos.get('/registro_gastos/:banco/:tipo/:mes', AsyncHandler(async (req, res) => {
    res.json(await conn.query("SELECT * FROM registro_gastos WHERE banco_id = ? AND tipo = ? AND MONTH(data_registro) = ? ORDER BY id", [req.params.banco, req.params.tipo, req.params.mes]))
}))

registro_gastos.post('/registro_gastos', AsyncHandler(async (req, res) => {
    res.json(await conn.query("INSERT INTO registro_gastos SET ?", [req.body]))
}))

registro_gastos.put('/registro_gastos/:id', AsyncHandler(async (req, res) => {
    res.json(await conn.query("UPDATE registro_gastos SET ? WHERE id = ?", [req.body, req.params.id]))
}))

registro_gastos.delete('/registro_gastos/:id', AsyncHandler(async (req, res) => {
    res.json(await conn.query("DELETE FROM registro_gastos WHERE id = ?", [req.params.id]))
}))

export default registro_gastos