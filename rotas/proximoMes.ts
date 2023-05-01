import express from "express"
import AsyncHandler from "../src/asyncHandler"
import conn from "../src/conn"
import { Registro_gasto } from "./registro_gastos"
import { Entrada } from "./entradas"

const proximoMes = express()

proximoMes.post("/proximoMes/mesAtual=:mes/anoAtual=:ano", AsyncHandler(async (req, res) => {

    if (await verificarMesDuplicado(req.params)) {
        res.status(500).json({
            msg: "Este mês já foi duplicado!"
        })
        return
    }

    let gastos = await pegarGastos(req.params)
    let entradas = await pegarEntradas(req.params)

    res.json(await conn.transaction([
        ...gastos,
        ...entradas,
        { query: "INSERT INTO mesesDuplicados SET ?", params: [req.params] }
    ]))
}))

async function verificarMesDuplicado({ mes, ano }: any): Promise<boolean> {
    let [mesAtual] = await conn.query("SELECT * FROM mesesDuplicados WHERE mes = ? AND ano = ?", [mes, ano])

    return mesAtual ? true : false
}

async function pegarGastos({ mes, ano }: any) {
    let registrosParaDuplicar = await conn.query<Registro_gasto>(`
        SELECT
            *
        FROM
            registro_gastos
        WHERE
            (
                parcela_atual < parcelas_totais
                OR (
                    data_gasto is null
                    AND parcela_atual is null
                )
            )
            AND MONTH(data_registro) = ?
            AND YEAR(data_registro) = ?
    `, [mes, ano])

    let novosRegistros = registrosParaDuplicar.map((item) => {
        return {
            data_gasto: item.data_gasto,
            descricao: item.descricao,
            parcela_atual: item.parcela_atual ? item.parcela_atual + 1 : null,
            parcelas_totais: item.parcelas_totais,
            valor: item.valor,
            tipo: item.tipo,
            banco_id: item.banco_id
        }
    })

    return novosRegistros.map((item) => {
        return {
            query: "INSERT INTO registro_gastos SET ?",
            params: [item]
        }
    })
}

async function pegarEntradas({ mes, ano }: any) {
    let registrosParaDuplicar = await conn.query<Entrada>(`
        SELECT * FROM entradas WHERE id IN (
            SELECT max(id) FROM entradas WHERE MONTH(data_registro) = ? AND YEAR(data_registro) = ? GROUP BY tipo_id
        )
    `, [mes, ano])

    let novosRegistros = registrosParaDuplicar.map((item) => {
        return {
            tipo_id: item.tipo_id,
            valor: item.valor
        }
    })

    return novosRegistros.map((item) => {
        return {
            query: "INSERT INTO entradas SET ?",
            params: [item]
        }
    })
}


export default proximoMes