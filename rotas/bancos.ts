import express from "express"
import AsyncHandler from "../src/asyncHandler"
import conn from "../src/conn"
import { Registro_gasto } from "./registro_gastos"

export type Banco = {
    id: number,
    nome: string,
    cor: string,
}

type Tile = Banco & {
    totais: {
        alimentacao: string,
        transportes: string,
        geral: string
    },
    total: string
}

const bancos = express()

bancos.get('/bancos', AsyncHandler(async (req, res) => {
    res.json(await conn.query("SELECT * FROM bancos ORDER BY id LIMIT 500"))
}))

bancos.get('/bancos/porId/:id', AsyncHandler(async (req, res) => {
    let [banco] = await conn.query("SELECT * FROM bancos WHERE id = ?", [parseInt(req.params.id)])
    res.json(banco)
}))

bancos.get('/bancos/gastosPorBanco', AsyncHandler(async (req, res) => {
    let bancos: Tile[] = await conn.query("SELECT * FROM bancos ORDER BY posicao, id LIMIT 500")

    for await (let item of bancos) {
        let gastosAlimentacao: Registro_gasto[] = await conn.query("SELECT * FROM registro_gastos WHERE banco_id = ? AND tipo = ?", [item.id, 1])
        let gastosTransportes: Registro_gasto[] = await conn.query("SELECT * FROM registro_gastos WHERE banco_id = ? AND tipo = ?", [item.id, 2])
        let gastosGeral: Registro_gasto[] = await conn.query("SELECT * FROM registro_gastos WHERE banco_id = ? AND tipo = ?", [item.id, 3])

        let totalAlimentacao = gastosAlimentacao.reduce((anterior, atual) => anterior + atual.valor, 0)
        let totalTransportes = gastosTransportes.reduce((anterior, atual) => anterior + atual.valor, 0)
        let totalGeral = gastosGeral.reduce((anterior, atual) => anterior + atual.valor, 0)

        item.totais = {
            alimentacao: totalAlimentacao.toFixed(2),
            transportes: totalTransportes.toFixed(2),
            geral: totalGeral.toFixed(2),
        }
        item.total = (totalAlimentacao + totalTransportes + totalGeral).toFixed(2)
    }

    res.json(bancos)
}))

bancos.post('/bancos', AsyncHandler(async (req, res) => {
    res.json(await conn.query("INSERT INTO bancos SET ?", [req.body]))
}))

bancos.put('/bancos/:id', AsyncHandler(async (req, res) => {
    res.json(await conn.query("UPDATE bancos SET ? WHERE id = ?", [req.body, req.params.id]))
}))

bancos.delete('/bancos/:id', AsyncHandler(async (req, res) => {
    res.json(await conn.query("DELETE FROM bancos WHERE id = ?", [req.params.id]))
}))

export default bancos