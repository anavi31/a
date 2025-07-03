const fs = require('fs');
const bcrypt = require('bcrypt');
const csv = require('csv-parser');
const { parse } = require('json2csv');

function lerUsuarios() {
  return new Promise((resolve) => {
    const users = [];
    fs.createReadStream('users.csv')
      .pipe(csv())
      .on('data', (data) => users.push(data))
      .on('end', () => resolve(users));
  });
}

function salvarUsuario(novo) {
  const linha = `\n${Object.values(novo).join(',')}`;
  fs.appendFileSync('users.csv', linha);
}

function salvarCodigo(email, codigo) {
  const dados = JSON.parse(fs.readFileSync('codes.json', 'utf-8') || '{}');
  dados[email] = { codigo, timestamp: Date.now() };
  fs.writeFileSync('codes.json', JSON.stringify(dados));
}

function validarCodigo(email, codigo) {
  const dados = JSON.parse(fs.readFileSync('codes.json', 'utf-8') || '{}');
  return dados[email] && dados[email].codigo === codigo;
}

module.exports = { lerUsuarios, salvarUsuario, salvarCodigo, validarCodigo };