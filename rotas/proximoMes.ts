import express from "express"
import AsyncHandler from "../src/asyncHandler"
import conn from "../src/conn"
import { Registro_gasto } from "./registro_gastos"
import moment from "moment"
import { Entrada } from "./entradas"

const proximoMes = express()

proximoMes.post("/proximoMes/gastos/mesAtual=:mes", AsyncHandler(async (req, res) => {
    let registrosParaDuplicar = await conn.query<Registro_gasto>("SELECT * FROM registro_gastos WHERE parcela_atual < parcelas_totais AND MONTH(data_registro) = ?", [req.params.mes])

    let novosRegistros = registrosParaDuplicar.map((item) => {
        item.parcela_atual += 1
        return {
            data_gasto: item.data_gasto,
            descricao: item.descricao,
            parcela_atual: item.parcela_atual + 1,
            parcelas_totais: item.parcelas_totais,
            valor: item.valor,
            tipo: item.tipo,
            banco_id: item.banco_id
        }
    })

    res.json(await conn.transaction(novosRegistros.map((item) => {
        return {
            query: "INSERT INTO registro_gastos SET ?",
            params: [item]
        }
    })))
}))

proximoMes.post("/proximoMes/entradas/mesAtual=:mes", AsyncHandler(async (req, res) => {
    let registrosParaDuplicar = await conn.query<Entrada>(`
        SELECT * FROM entradas WHERE id IN (
            SELECT max(id) FROM entradas WHERE MONTH(data_registro) = ? GROUP BY tipo_id
        )
    `, [req.params.mes])

    let novosRegistros = registrosParaDuplicar.map((item) => {
        return {
            tipo_id: item.tipo_id,
            valor: item.valor
        }
    })

    res.json(await conn.transaction(novosRegistros.map((item) => {
        return {
            query: "INSERT INTO entradas SET ?",
            params: [item]
        }
    })))
}))


export default proximoMes