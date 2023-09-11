import express from "express"
import AsyncHandler from "../src/asyncHandler"
import conn from "../src/conn"
import moment from "moment"

export type Registro_gasto = {
    id: number
    data_registro: string
    data_gasto: string
    descricao: string
    parcela_atual: number
    parcelas_totais: number
    valor: number
    tipo: number
    destino: number
    banco_id: number
    anterior_id: number
    fixo: boolean
}

const registro_gastos = express()

registro_gastos.get('/registro_gastos', AsyncHandler(async (req, res) => {
    res.json(await conn.query("SELECT * FROM registro_gastos ORDER BY id LIMIT 500"))
}))

registro_gastos.get('/registro_gastos/:banco/:tipo/:mes/:ano', AsyncHandler(async (req, res) => {
    res.json(await conn.query("SELECT DISTINCT * FROM registro_gastos WHERE banco_id = ? AND tipo = ? AND ((MONTH(data_registro) = ? AND YEAR(data_registro) = ?) OR fixo = true) ORDER BY data_gasto, descricao", [req.params.banco, req.params.tipo, req.params.mes, req.params.ano]))
}))

registro_gastos.get('/registro_gastos/pessoais/:destino/:tipo/:mes/:ano', AsyncHandler(async (req, res) => {
    res.json(await conn.query("SELECT DISTINCT * FROM registro_gastos WHERE destino = ? AND tipo = ? AND ((MONTH(data_registro) = ? AND YEAR(data_registro) = ?) OR fixo = true) ORDER BY data_gasto, descricao", [req.params.destino, req.params.tipo, req.params.mes, req.params.ano]))
}))

registro_gastos.post('/registro_gastos', AsyncHandler(async (req, res) => {
    res.json(await novoGasto(req.body))
}))

function novoGasto(body: Partial<Registro_gasto>) {
    return conn.transactionFn(async () => {
        if (!body.parcela_atual || !body.parcelas_totais) {
            await conn.query("INSERT INTO registro_gastos SET ?", [body])
            return { msg: "Sucesso!" }
        }

        await conn.query("INSERT INTO registro_gastos SET ?", [body])

        let [inserido]: Registro_gasto[] = await conn.query("SELECT * FROM registro_gastos ORDER BY id DESC LIMIT 1")

        let novosRegistros: Partial<Registro_gasto>[] = []

        let count = 1
        for (let i = body.parcela_atual; i < body.parcelas_totais; i++) {
            novosRegistros.push({
                ...body,
                data_registro: body.data_registro ? moment(body.data_registro).add(count, "months").format("YYYY-MM-DD") : moment().add(count, "months").format("YYYY-MM-DD"),
                parcela_atual: i + 1,
                anterior_id: inserido.id
            })
            count++
        }

        if (novosRegistros.length === 0) {
            return { msg: "Sucesso!" }
        }

        await conn.query("INSERT INTO registro_gastos (??) VALUES ?", formatInsert(novosRegistros))

        return { msg: "Sucesso!" }
    })
}

function formatInsert(insert: Array<Record<string, any>>): [string[], any[]] {
    validateColumns(insert)

    return [
        Object.keys(insert[0]),
        insert.map((item) => Object.values(item))
    ]
}

function validateColumns(insert: Record<string, any>[]) {
    let firstColumns = JSON.stringify(Object.keys(insert[0]))

    let validar = insert.find((item) => {
        return JSON.stringify(Object.keys(item)) !== firstColumns
    })

    if (validar) throw new Error(`As chaves dos objetos do array não são iguais. Encontrou ${validar} enquanto esperava ${firstColumns}`)
}

registro_gastos.put('/registro_gastos/:id', AsyncHandler(async (req, res) => {
    let [registroParaApagar]: Registro_gasto[] = await conn.query("SELECT * FROM registro_gastos WHERE id = ?", [req.params.id])

    if (registroParaApagar.fixo && moment(registroParaApagar.data_registro).month() !== moment().month()) {
        res.json(await novoGasto(req.body))
        return
    }

    await conn.query("DELETE FROM registro_gastos WHERE anterior_id = ?", [req.params.id])
    await conn.query("DELETE FROM registro_gastos WHERE id = ?", [req.params.id])

    res.json(await novoGasto(req.body))
}))

registro_gastos.put('/registro_gastos/active=:active/:id', AsyncHandler(async (req, res) => {
    let bool = req.params.active === "false" ? false : true

    res.json(await conn.query("UPDATE registro_gastos SET active = ? WHERE id = ?", [bool, req.params.id]))
}))

registro_gastos.delete('/registro_gastos/:id', AsyncHandler(async (req, res) => {
    res.json(await conn.query("DELETE FROM registro_gastos WHERE id = ?", [req.params.id]))
}))

export default registro_gastos