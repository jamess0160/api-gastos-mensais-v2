USE gastos_mensais_v2_teste;

INSERT INTO
    bancos (nome, icone, posicao)
VALUES
    ("Nubank Tiago", "nubank.svg", 2);

INSERT INTO
    registro_gastos (
        descricao,
        parcela_atual,
        parcelas_totais,
        valor,
        tipo,
        destino,
        banco_id
    )
VALUES
    ("teste", 1, 2, 10, 3, 1, 1);

INSERT INTO
    tipos_entrada (nome)
VALUES
    ("Salario Tiago"),
    ("Salario Luana");

INSERT INTO
    entradas (tipo_id, valor)
VALUES
    (1, 3700),
    (2, 1600);

INSERT INTO
    entradas_pessoais (tipo, valor)
VALUES
    (1, 800),
    (2, 500),
    (3, 500);