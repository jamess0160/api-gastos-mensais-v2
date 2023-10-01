import express from "express"
import AsyncHandler from "../src/asyncHandler"
import conn from "../src/conn"

export type Entrada = {
	id: number
	tipo_id: number
	valor: number
	data_registro: string
}

const entradas = express()

entradas.get('/entradas', AsyncHandler(async (req, res) => {
	res.json(await conn.query("SELECT * FROM entradas ORDER BY id LIMIT 500"))
}))

entradas.get('/entradas/recentes/mes=:mes/ano=:ano', AsyncHandler(async (req, res) => {
	res.json(await pegarEntradasMesAno(req.params.mes, req.params.ano))
}))

export async function pegarEntradasMesAno(mes: string, ano: string) {
	let entradas = await conn.query<Entrada>(`
		SELECT
			entradas.*,
			tipos_entrada.nome
		FROM
			entradas
			JOIN tipos_entrada ON tipos_entrada.id = entradas.tipo_id
		WHERE
			entradas.id IN (SELECT max(id) FROM entradas WHERE MONTH(data_registro) = ? AND YEAR(data_registro) = ? GROUP BY tipo_id)
	`, [mes, ano])

	if (entradas.length === 0) {
		return await conn.query<Entrada>(`
			SELECT
				entradas.*,
				tipos_entrada.nome
			FROM
				entradas
				JOIN tipos_entrada ON tipos_entrada.id = entradas.tipo_id
			WHERE
				entradas.id IN (SELECT max(id) FROM entradas GROUP BY tipo_id)
		`)
	}

	return entradas
}

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