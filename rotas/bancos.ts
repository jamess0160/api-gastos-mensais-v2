import express from "express"
import AsyncHandler from "../src/asyncHandler"
import conn from "../src/conn"
import { Registro_gasto } from "./registro_gastos"
import { pegarEntradasMesAno } from "./entradas"

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
        let [totalGeral, totalGeralInativos] = await pegarGastos(item.id, req.params.mes, req.params.ano, 1)
        let [totalTransportes, totalTransportesInativos] = await pegarGastos(item.id, req.params.mes, req.params.ano, 2)
        let [totalAlimentacao, totalAlimentacaoInativos] = await pegarGastos(item.id, req.params.mes, req.params.ano, 3)

        item.totais = {
            alimentacao: totalAlimentacao !== null ? totalAlimentacao.toFixed(2) : "0",
            transportes: totalTransportes !== null ? totalTransportes.toFixed(2) : "0",
            geral: totalGeral !== null ? totalGeral.toFixed(2) : "0",
        }
        item.total = (totalAlimentacao + totalTransportes + totalGeral).toFixed(2)
        item.totalInativos = (totalAlimentacaoInativos + totalTransportesInativos + totalGeralInativos).toFixed(2)
    }

    res.json(bancos)
}))

async function pegarGastos(IdBanco: number, mes: string, ano: string, tipo: number) {
    let gastos = await conn.query<Registro_gasto>(`
        SELECT
            *
        FROM
            registro_gastos
        WHERE
            banco_id = ?
            AND (
                (
                    MONTH(data_registro) = ?
                    AND YEAR(data_registro) = ?
                )
                OR fixo = true
            )
            AND tipo = ?
            AND descricao NOT LIKE '%*%'
    `, [IdBanco, mes, ano, tipo])

    let copia = [...gastos].reverse()

    let filtered = gastos.filter((item, index) => {

        let finded = copia.find((subItem) => subItem.descricao === item.descricao && subItem.data_registro.toString() === item.data_registro.toString())

        if (!finded) return true

        return gastos.indexOf(finded) === index
    })

    let { totalInativos, total } = filtered.reduce((old, item, index) => {

        old.totalInativos += item.valor

        if (item.active === 1) {
            old.total += item.valor
        }

        return old
    }, { totalInativos: 0, total: 0 })

    return [total, totalInativos]
}

bancos.get('/bancos/gastosPessoais/mes=:mes/ano=:ano', AsyncHandler(async (req, res) => {

    let entradas = await pegarEntradasMesAno(req.params.mes, req.params.ano)

    let saldoGeral = entradas.reduce((old, item) => {
        if (item.tipo_id === 1) {
            return old + item.valor
        }

        return old
    }, 0)

    let saldoEntradasPessoalTiago = entradas.reduce((old, item) => {
        if (item.tipo_id === 2) {
            return old + item.valor
        }

        return old
    }, 0)

    let saldoEntradasPessoalLuana = entradas.reduce((old, item) => {
        if (item.tipo_id === 3) {
            return old + item.valor
        }

        return old
    }, 0)

    let saldoEntradasPessoalGeral = entradas.reduce((old, item) => {
        if (item.tipo_id === 4) {
            return old + item.valor
        }

        return old
    }, 0)

    let { sum: gastosGeraisInativos, registros } = await pegarGastosInativos(req.params.mes, req.params.ano)

    let disponivel = saldoGeral - gastosGeraisInativos

    const maxEntradassGerais = 1400

    let entradasGeraisBase = disponivel / 2 > maxEntradassGerais ? maxEntradassGerais : disponivel / 2
    let entradasGerais = entradasGeraisBase + saldoEntradasPessoalGeral

    let entradasPessoais = (disponivel - entradasGeraisBase) / 2

    let entradasTiago = entradasPessoais + saldoEntradasPessoalTiago
    let entradasLuana = entradasPessoais + saldoEntradasPessoalLuana

    let totalGastosGeral = registros.reduce((old, item) => item.destino === 1 ? old + item.valor : old, 0)
    let totalGastosTiago = registros.reduce((old, item) => item.destino === 2 ? old + item.valor : old, 0)
    let totalGastosLuana = registros.reduce((old, item) => item.destino === 3 ? old + item.valor : old, 0)
    let totalGastosConjunto = registros.reduce((old, item) => item.destino === 4 ? old + item.valor : old, 0)

    res.json({
        geral: (entradasGerais || 0) - totalGastosGeral,
        tiago: (entradasTiago || 0) - (totalGastosTiago + (totalGastosConjunto / 2)),
        luana: (entradasLuana || 0) - (totalGastosLuana + (totalGastosConjunto / 2)),
    })
}))

async function pegarGastosInativos(mes: string, ano: string): Promise<{ sum: number, registros: Registro_gasto[] }> {
    let registros = await conn.query<Registro_gasto>(`
        SELECT
            *
        FROM
            registro_gastos
        WHERE
            id IN(
                select
                    MAX(id)
                from
                    registro_gastos
                WHERE
                    (
                        (
                            MONTH(data_registro) = ?
                            AND YEAR(data_registro) = ?
                        )
                        OR fixo = true
                    )
                    AND descricao NOT LIKE '%*%'
                GROUP BY
                    descricao,
                    data_registro
            );
    `, [mes, ano])

    return {
        sum: registros.reduce((old, item) => item.destino === null ? old + item.valor : old, 0),
        registros: registros
    }
}

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