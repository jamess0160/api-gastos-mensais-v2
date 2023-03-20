import express from "express"
import AsyncHandler from "../src/asyncHandler"
import conn from "../src/conn"

const entradas = express()

entradas.get('/entradas', AsyncHandler(async (req, res) => {
    res.json(await conn.query("SELECT * FROM entradas ORDER BY id LIMIT 500"))
}))

entradas.get('/entradas/:mes', AsyncHandler(async (req, res) => {
    res.json(await conn.query("SELECT * FROM entradas WHERE MONTH(data_registro) = ? ORDER BY id", [req.params.mes]))
}))

entradas.post('/entradas', AsyncHandler(async (req, res) => {
    res.json(await conn.query("INSERT INTO entradas SET ?", [req.body]))
}))

entradas.put('/entradas/:id', AsyncHandler(async (req, res) => {
    res.json(await conn.query("UPDATE entradas SET ? WHERE id = ?", [req.body, req.params.id]))
}))

entradas.delete('/entradas/:id', AsyncHandler(async (req, res) => {
    res.json(await conn.query("DELETE FROM entradas WHERE id = ?", [req.params.id]))
}))

export default entradas