USE gastos_mensais_v2;

INSERT INTO
    bancos (nome, icone, posicao)
VALUES
    ("Nubank Tiago", "nubank.svg", 2);

INSERT INTO
    registro_gastos (
        data_gasto,
        descricao,
        parcela_atual,
        parcelas_totais,
        valor,
        tipo,
        banco_id
    )
VALUES
    ("2023-03-26", "teste", 1, 2, 10, 3, 1);

INSERT INTO
    tipos_entrada (nome)
VALUES
    ("Salario Tiago"),
    ("Salario Luana");

INSERT INTO
    entradas (tipo_id, valor, data_registro)
VALUES
    (1, 2881.59, '2023-02-25 13:00:00'),
    (2, 1000, '2023-02-25 13:00:00');

INSERT INTO
    entradas (tipo_id, valor)
VALUES
    (1, 2781.59),
    (2, 1000);