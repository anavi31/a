const fs = require('fs');
const { enviarCodigo, enviarConfirmacaoSuporte } = require('./email');

module.exports = (app) => {

  const { enviarConfirmacaoSuporte } = require('./email');

  app.post('/suporte', async (req, res) => {
    const { nome, email, suporte, mensagem } = req.body;

    if (!nome || !email || !suporte || !mensagem) {
      return res.status(400).send('Todos os campos são obrigatórios.');
    }

    const textoEmail = `
Olá, ${nome}!

Recebemos sua solicitação para o suporte "${suporte}".

Nossa equipe analisará sua mensagem:
"${mensagem}"

Fique de olho na sua caixa de entrada — você receberá uma resposta em até 7 dias úteis.

Atenciosamente,
Equipe de Suporte`;

    try {
      await enviarConfirmacaoSuporte(
        email,
        `Solicitação de Suporte (${suporte}) - Rede do Orgulho`,
        textoEmail
      );
      res.send('Solicitação enviada com sucesso!');
    } catch (err) {
      console.error(err);
      res.status(500).send('Erro ao enviar o e-mail de confirmação.');
    }
  });
};