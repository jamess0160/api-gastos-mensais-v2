CREATE DATABASE gastos_mensais_v2;

USE gastos_mensais_v2;

CREATE TABLE bancos (
    id int PRIMARY KEY auto_increment,
    nome varchar(80),
    cor varchar(10)
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
    data_gasto date,
    descricao varchar(120),
    valor float,
    tipo int,
    banco_id int,
    foreign key (banco_id) references bancos(id)
);

create table entradas (
    id int PRIMARY KEY auto_increment,
    nome varchar(30),
    valor float
);