CREATE DATABASE gastos_mensais_v2;

USE gastos_mensais_v2;

CREATE TABLE bancos (
    id int PRIMARY KEY auto_increment,
    nome varchar(80),
    icone varchar(60),
    posicao int
);

/*
 Tipos de gastos:
 1- Geral
 2- Transporte
 3- Alimentação
 */
CREATE TABLE registro_gastos (
    id int PRIMARY KEY auto_increment,
    data_registro datetime DEFAULT NOW(),
    data_gasto date DEFAULT (CURRENT_DATE),
    descricao varchar(120),
    parcela_atual int,
    parcelas_totais int,
    valor float,
    tipo int,
    banco_id int,
    foreign key (banco_id) references bancos(id)
);

create table entradas (
    id int PRIMARY KEY auto_increment,
    nome varchar(30),
    valor float,
    data_registro datetime DEFAULT NOW()
);