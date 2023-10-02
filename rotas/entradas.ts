import express from "express"
import AsyncHandler from "../src/asyncHandler"
import conn from "../src/conn"
import { parse } from "path"
import moment from "moment"

export type Entrada = {
	id: number
	tipo_id: number
	valor: number
	nome: string
	data_registro: string
}

const entradas = express()

entradas.get('/entradas', AsyncHandler(async (req, res) => {
	res.json(await conn.query("SELECT * FROM entradas ORDER BY id LIMIT 500"))
}))

entradas.get('/entradas/recentes/mes=:mes/ano=:ano', AsyncHandler(async (req, res) => {
	res.json(await pegarEntradasMesAno(req.params.mes, req.params.ano))
}))

export async function pegarEntradasMesAno(mes: string, ano: string): Promise<Array<Entrada & { nome_tipo: string }>> {
	let entradas = await conn.query<Entrada & { nome_tipo: string }>(`
		SELECT
			entradas.*,
			tipos_entrada.nome as nome_tipo
		FROM
			entradas
			JOIN tipos_entrada ON tipos_entrada.id = entradas.tipo_id
		WHERE
			MONTH(data_registro) = ? AND YEAR(data_registro) = ?
	`, [mes, ano])

	if (!entradas) {
		return pegarEntradasMesAno((parseInt(mes) - 1).toString(), ano)
	}

	return entradas
}

entradas.post('/entradas', AsyncHandler(async (req, res) => {
	res.json(await conn.query("INSERT INTO entradas SET ?", [req.body]))
}))

entradas.post('/entradas/clonar', AsyncHandler(async (req, res) => {
	let { mes, ano } = req.body

	let entradasAnteriores = await pegarEntradasMesAno(mes, ano)

	res.json(await Promise.all(entradasAnteriores.map((item) => {
		let data: Partial<Entrada> = {
			nome: item.nome,
			tipo_id: item.tipo_id,
			valor: item.valor,
			data_registro: moment(item.data_registro).set("month", parseInt(mes)).format("YYYY-MM-DD hh:mm:ss")
		}
		return conn.query("INSERT INTO entradas SET ?", [data])
	})))
}))

entradas.put('/entradas/:id', AsyncHandler(async (req, res) => {
	res.json(await conn.query("UPDATE entradas SET ? WHERE id = ?", [req.body, req.params.id]))
}))

entradas.delete('/entradas/:id', AsyncHandler(async (req, res) => {
	res.json(await conn.query("DELETE FROM entradas WHERE id = ?", [req.params.id]))
}))

export default entradas