USE gastos_mensais_v2;

INSERT INTO
    bancos (nome, cor)
VALUES
    ("Nubank Tiago", "#8A05BE");

INSERT INTO
    registro_gastos (data_gasto, descricao, valor, tipo, banco_id)
VALUES
    ("2023-01-23", "teste", 10, 3, 1);

INSERT INTO
    entradas (nome, valor)
VALUES
    ("Salario Tiago", 3000);