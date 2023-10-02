DROP DATABASE gastos_mensais_v2_teste;

CREATE DATABASE gastos_mensais_v2_teste;

USE gastos_mensais_v2_teste;

CREATE TABLE bancos (
    id int PRIMARY KEY auto_increment,
    nome varchar(80),
    icone varchar(60),
    posicao int DEFAULT 1000
);

/*
 Tipos de gastos:
 1- Geral
 2- Transporte
 3- Alimentação
 */
/*
 Tipos de destinos:
 1- Geral
 2- Tiago
 3- Luana
 4- Conjunto
 */
CREATE TABLE registro_gastos (
    id int PRIMARY KEY auto_increment,
    data_registro datetime DEFAULT (CURRENT_DATE),
    data_gasto date DEFAULT (CURRENT_DATE),
    descricao varchar(120),
    parcela_atual int,
    parcelas_totais int,
    valor float,
    tipo int,
    destino int,
    banco_id int,
    anterior_id int,
    fixo boolean,
    active boolean default true,
    foreign key (banco_id) references bancos(id),
    foreign key (anterior_id) references registro_gastos(id)
);

CREATE TABLE tipos_entrada(
    id int PRIMARY KEY auto_increment,
    nome varchar(30)
);

CREATE TABLE entradas (
    id int PRIMARY KEY auto_increment,
    tipo_id int,
    valor float,
    data_registro datetime DEFAULT (CURRENT_DATE),
    foreign key (tipo_id) references tipos_entrada(id)
);

/*
 Tipos:
 1- Geral
 2- Tiago
 3- Luana
 */
CREATE TABLE entradas_pessoais (
    id int PRIMARY KEY auto_increment,
    tipo int,
    valor float,
    data_registro datetime DEFAULT (CURRENT_DATE)
);

alter table
    entradas
add
    nome varchar(30);