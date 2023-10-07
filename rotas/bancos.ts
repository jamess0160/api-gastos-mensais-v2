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
        let [{ totalGeral, totalGeralInativos }] = await conn.query("SELECT DISTINCT SUM(valor) as totalGeralInativos, SUM(CASE WHEN active = 1 THEN valor ELSE 0 END) AS totalGeral FROM registro_gastos WHERE banco_id = ? AND ((MONTH(data_registro) = ?  AND YEAR(data_registro) = ?) OR fixo = true) AND tipo = ? AND descricao NOT LIKE '%*%'", [item.id, req.params.mes, req.params.ano, 1])
        let [{ totalTransportes, totalTransportesInativos }] = await conn.query("SELECT DISTINCT SUM(valor) as totalTransportesInativos, SUM(CASE WHEN active = 1 THEN valor ELSE 0 END) AS totalTransportes FROM registro_gastos WHERE banco_id = ? AND ((MONTH(data_registro) = ?  AND YEAR(data_registro) = ?) OR fixo = true) AND tipo = ? AND descricao NOT LIKE '%*%'", [item.id, req.params.mes, req.params.ano, 2])
        let [{ totalAlimentacao, totalAlimentacaoInativos }] = await conn.query("SELECT DISTINCT SUM(valor) as totalAlimentacaoInativos, SUM(CASE WHEN active = 1 THEN valor ELSE 0 END) AS totalAlimentacao FROM registro_gastos WHERE banco_id = ? AND ((MONTH(data_registro) = ?  AND YEAR(data_registro) = ?) OR fixo = true) AND tipo = ? AND descricao NOT LIKE '%*%'", [item.id, req.params.mes, req.params.ano, 3])

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

bancos.get('/bancos/gastosPessoais/mes=:mes/ano=:ano', AsyncHandler(async (req, res) => {

    let entradas = await pegarEntradasMesAno(req.params.mes, req.params.ano)

    let saldoGeral = entradas.reduce((old, item) => {
        if (item.tipo_id === 1) {
            return old + item.valor
        }

        return old
    }, 0)

    let saldoPessoalTiago = entradas.reduce((old, item) => {
        if (item.tipo_id === 2) {
            return old + item.valor
        }

        return old
    }, 0)

    let saldoPessoalLuana = entradas.reduce((old, item) => {
        if (item.tipo_id === 3) {
            return old + item.valor
        }

        return old
    }, 0)

    let gastosGeraisInativos = await pegarGastosGeraisInativos(req.params.mes, req.params.ano)

    let disponivel = saldoGeral - gastosGeraisInativos

    const maxEntradassGerais = 1400

    let entradasGerais = disponivel / 2 > maxEntradassGerais ? maxEntradassGerais : disponivel / 2

    let entradasPessoais = (disponivel - entradasGerais) / 2

    let entradasTiago = entradasPessoais + saldoPessoalTiago
    let entradasLuana = entradasPessoais + saldoPessoalLuana

    let [{ totalGeral }] = await conn.query("SELECT DISTINCT SUM(valor) as totalGeral FROM registro_gastos WHERE ((MONTH(data_registro) = ?  AND YEAR(data_registro) = ?) OR fixo = true) AND destino = 1 AND descricao NOT LIKE '%*%'", [req.params.mes, req.params.ano])
    let [{ totalTiago }] = await conn.query("SELECT DISTINCT SUM(valor) as totalTiago FROM registro_gastos WHERE ((MONTH(data_registro) = ?  AND YEAR(data_registro) = ?) OR fixo = true) AND destino = 2 AND descricao NOT LIKE '%*%'", [req.params.mes, req.params.ano])
    let [{ totalLuana }] = await conn.query("SELECT DISTINCT SUM(valor) as totalLuana FROM registro_gastos WHERE ((MONTH(data_registro) = ?  AND YEAR(data_registro) = ?) OR fixo = true) AND destino = 3 AND descricao NOT LIKE '%*%'", [req.params.mes, req.params.ano])
    let [{ totalConjunto }] = await conn.query("SELECT DISTINCT SUM(valor) as totalConjunto FROM registro_gastos WHERE ((MONTH(data_registro) = ?  AND YEAR(data_registro) = ?) OR fixo = true) AND destino = 4 AND descricao NOT LIKE '%*%'", [req.params.mes, req.params.ano])

    res.json({
        geral: (entradasGerais || 0) - totalGeral,
        tiago: (entradasTiago || 0) - (totalTiago + (totalConjunto / 2)),
        luana: (entradasLuana || 0) - (totalLuana + (totalConjunto / 2)),
    })
}))

async function pegarGastosGeraisInativos(mes: string, ano: string): Promise<number> {
    let registros = await conn.query<Registro_gasto>(`
        SELECT
            DISTINCT *
        FROM
            registro_gastos
        WHERE
            (
                (
                    MONTH(data_registro) = ?
                    AND YEAR(data_registro) = ?
                )
                OR fixo = true
            )
            AND destino is null
            AND descricao NOT LIKE '%*%'
    `, [mes, ano])

    let copia = [...registros].reverse()

    let filtered = registros.filter((item, index) => {

        let finded = copia.find((subItem) => subItem.descricao === item.descricao && subItem.data_registro.toString() === item.data_registro.toString())

        if (!finded) return true

        return registros.indexOf(finded) === index
    })

    return filtered.reduce((old, item) => old + item.valor, 0)
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