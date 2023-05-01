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

//#region Rotas

bancos.get('/bancos', AsyncHandler(async (req, res) => {
    res.json(await conn.query("SELECT * FROM bancos ORDER BY posicao, id LIMIT 500"))
}))

bancos.get('/bancos/porId/:id', AsyncHandler(async (req, res) => {
    let [banco] = await conn.query("SELECT * FROM bancos WHERE id = ?", [parseInt(req.params.id)])
    res.json(banco)
}))

bancos.get('/bancos/gastosPorBanco/mes=:mes', AsyncHandler(async (req, res) => {

    let bancos: Tile[] = await conn.query("SELECT * FROM bancos ORDER BY posicao, id LIMIT 500")

    for await (let item of bancos) {
        let [{ totalGeral }] = await conn.query("SELECT SUM(valor) as totalGeral FROM registro_gastos WHERE banco_id = ? AND MONTH(data_registro) = ? AND tipo = ? AND descricao NOT LIKE '%*%'", [item.id, req.params.mes, 1])
        let [{ totalTransportes }] = await conn.query("SELECT SUM(valor) as totalTransportes FROM registro_gastos WHERE banco_id = ? AND MONTH(data_registro) = ? AND tipo = ? AND descricao NOT LIKE '%*%'", [item.id, req.params.mes, 2])
        let [{ totalAlimentacao }] = await conn.query("SELECT SUM(valor) as totalAlimentacao FROM registro_gastos WHERE banco_id = ? AND MONTH(data_registro) = ? AND tipo = ? AND descricao NOT LIKE '%*%'", [item.id, req.params.mes, 3])

        item.totais = {
            alimentacao: totalAlimentacao !== null ? totalAlimentacao.toFixed(2) : 0,
            transportes: totalTransportes !== null ? totalTransportes.toFixed(2) : 0,
            geral: totalGeral !== null ? totalGeral.toFixed(2) : 0,
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

//#endregion

export default bancos