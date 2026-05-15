import * as SQLite from 'expo-sqlite';

// --- função de criar e abrir o banco de dados
async function Banco() {
  const bd = await SQLite.openDatabaseAsync("FatecV");
  console.log('Banco CRIADO !!!');
  return bd;
}

// criar a tabela
async function createTable(x) {
  try {
    await x.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS USUARIO(
        ID_US INTEGER PRIMARY KEY AUTOINCREMENT,
        NOME_US VARCHAR(100),
        CEP_US VARCHAR(8),
        LOGRADOURO_US VARCHAR(200),
        BAIRRO_US VARCHAR(100),
        CIDADE_US VARCHAR(100),
        ESTADO_US VARCHAR(2)
      )
    `);
    console.log('Tabela CRIADA!!!');
  } catch (error) {
    console.log('Erro ao Criar tabela', error);
  }
}

// Inserir dados
async function inserirUsuario(db, nome, cep, logradouro, bairro, cidade, estado) {
  try {
    await db.runAsync(
      "INSERT INTO USUARIO(NOME_US, CEP_US, LOGRADOURO_US, BAIRRO_US, CIDADE_US, ESTADO_US) VALUES(?,?,?,?,?,?)",
      nome, cep, logradouro, bairro, cidade, estado
    );
    console.log('Usuário Inserido !!!');
  } catch (error) {
    console.log('Erro ao inserir usuário', error);
  }
}

//Editar dados

async function atualizarUsuario(db, id, nome, cep, logradouro, bairro, cidade, estado) {
  try {
    await db.runAsync(
      "UPDATE USUARIO SET NOME_US=?, CEP_US=?, LOGRADOURO_US=?, BAIRRO_US=?, CIDADE_US=?, ESTADO_US=? WHERE ID_US=?",
      nome, cep, logradouro, bairro, cidade, estado, id
    );
    console.log('Usuário Atualizado!!!');
  } catch (error) {
    console.log('Erro ao atualizar usuário', error);
  }
}

// Exibir os dados
async function selectUsuarios(db) {
  try {
    const resultado = await db.getAllAsync("SELECT * FROM USUARIO");
    console.log('Usuários encontrados !!!');
    return resultado;
  } catch (error) {
    console.log("Erro ao exibir usuários", error);
  }
}

// Filtro por ID
async function selectUsuarioId(db, id) {
  try {
    const resultado = await db.getFirstAsync("SELECT * FROM USUARIO WHERE ID_US = ?", id);
    console.log('Usuário encontrado!!');
    return resultado;
  } catch (error) {
    console.log("Erro ", error);
  }
}

// Deletar
async function deletaUsuario(db, id) {
  try {
    await db.runAsync("DELETE FROM USUARIO WHERE ID_US = ?", id);
    console.log('Deletado com sucesso');
  } catch (error) {
    console.log('Erro ao deletar', error);
  }
}

export { Banco, createTable, inserirUsuario,  atualizarUsuario, selectUsuarios, selectUsuarioId, deletaUsuario };