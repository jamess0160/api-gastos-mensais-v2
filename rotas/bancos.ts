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
    totalInativos: string
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

bancos.get('/bancos/gastosPorBanco/mes=:mes/ano=:ano', AsyncHandler(async (req, res) => {

    let bancos: Tile[] = await conn.query("SELECT * FROM bancos ORDER BY posicao, id LIMIT 500")

    for await (let item of bancos) {
        let [{ totalGeral, totalGeralInativos }] = await conn.query("SELECT SUM(valor) as totalGeralInativos, SUM(CASE WHEN active = 1 THEN valor ELSE 0 END) AS totalGeral FROM registro_gastos WHERE banco_id = ? AND MONTH(data_registro) = ?  AND YEAR(data_registro) = ? AND tipo = ?", [item.id, req.params.mes, req.params.ano, 1])
        let [{ totalTransportes, totalTransportesInativos }] = await conn.query("SELECT SUM(valor) as totalTransportesInativos, SUM(CASE WHEN active = 1 THEN valor ELSE 0 END) AS totalTransportes FROM registro_gastos WHERE banco_id = ? AND MONTH(data_registro) = ?  AND YEAR(data_registro) = ? AND tipo = ?", [item.id, req.params.mes, req.params.ano, 2])
        let [{ totalAlimentacao, totalAlimentacaoInativos }] = await conn.query("SELECT SUM(valor) as totalAlimentacaoInativos, SUM(CASE WHEN active = 1 THEN valor ELSE 0 END) AS totalAlimentacao FROM registro_gastos WHERE banco_id = ? AND MONTH(data_registro) = ?  AND YEAR(data_registro) = ? AND tipo = ?", [item.id, req.params.mes, req.params.ano, 3])

        item.totais = {
            alimentacao: totalAlimentacao !== null ? totalAlimentacao.toFixed(2) : 0,
            transportes: totalTransportes !== null ? totalTransportes.toFixed(2) : 0,
            geral: totalGeral !== null ? totalGeral.toFixed(2) : 0,
        }
        item.total = (totalAlimentacao + totalTransportes + totalGeral).toFixed(2)
        item.totalInativos = (totalAlimentacaoInativos + totalTransportesInativos + totalGeralInativos).toFixed(2)
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