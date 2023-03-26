USE gastos_mensais_v2;

INSERT INTO
    bancos (nome, icone, posicao)
VALUES
    ("Nubank Tiago", "nubank.svg", 2);

INSERT INTO
    registro_gastos (data_gasto, descricao, parcela_atual, parcelas_totais, valor, tipo, banco_id)
VALUES
    ("2023-03-26", "teste", 1, 2, 10, 3, 1);

INSERT INTO
    entradas (nome, valor)
VALUES
    ("Salario Tiago", 3000);