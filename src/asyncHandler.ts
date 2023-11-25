import { NextFunction, Request, Response } from "express"
import path from "path"
import fs from 'fs/promises'

// Função destinada para tratar erros de funções asyncronas da API
export default function AsyncHandler(callback: (req: Request, res: Response, next?: NextFunction) => Promise<void>) {
    // Começa retornando uma função que sera executada pelo Express
    return function (req: Request, res: Response, next: NextFunction) {
        callback(req, res, next).catch((error: any) => {

            // Trata o erro passando ele para o console e adicionando pontos especificos ao arquivo log.json através da função adicionarLog

            console.log(error)
            adicionarLog({
                rota: req.originalUrl,
                msg: "sql" in error ? error.sqlMessage : error.toString(),
                stack: "sql" in error ? undefined : error.stack?.split("\n"),
                query: "sql" in error ? error.sql : ""
            })

            // Retorna a requisição para o cliente
            res.status(500).json({ error: "sql" in error ? error.sqlMessage : error.toString() })
        })
    }
}

var filaLog: any[] = []
const TEMPO_DE_ESPERA_LOGS = 100
var timeout: NodeJS.Timeout

// Adiciona o log para a fila dele e cria um timeout para ser cancelado caso venha outros logs juntos
function adicionarLog(obj: any) {
    filaLog.push(obj)

    clearTimeout(timeout)
    timeout = setTimeout(registrarLog, TEMPO_DE_ESPERA_LOGS)
}

const caminho = path.normalize(`${process.cwd()}/logs.json`)

// Pega os logs existentes, adiciona os logs atuais e insere no JSON
async function registrarLog() {
    try {
        // Filtra a fila de logs para retirar logs já inseridos
        filaLog = filaLog.filter((item) => !item.concluido)

        let json = await pegarJSON()
        let obj = JSON.parse(json)

        for await (let item of filaLog) {
            obj[`${new Date().toLocaleString('pt-br')} | ${Date.now()}`] = { ...item }
            await dormir(100)
            item.concluido = true
        }
        fs.writeFile(caminho, JSON.stringify(obj, null, 2), "utf-8")
    } catch (error) {
        console.log(error)
    }
}

// Função para pegar o json e tratar erros de não existencia
async function pegarJSON() {
    try {
        let json = await fs.readFile(caminho, "utf-8")
        return json || "{}"
    } catch (error: any) {
        if (error.toString().includes("no such file or directory")) {
            return "{}"
        }
        throw error
    }
}

// Função sleep
function dormir(tempo: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, tempo)
    })
}