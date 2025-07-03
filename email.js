const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'redeorgulho@gmail.com',
    pass: 'ytjizrxdtqjteygp'
  }
});

function enviarCodigo(email, codigo) {
  const texto = `Olá! 🏳️‍🌈

Seu código de verificação da Rede do Orgulho é:

👉 ${codigo}

Falta pouco! Volte para o site e insira o código acima. Esse código é válido apenas quando usado com o endereço de e-mail onde ele foi recebido.

Com carinho,
Equipe Rede do Orgulho 💜`;

  const mailOptions = {
    from: 'redeorgulho@gmail.com',
    to: email,
    subject: 'Código de verificação - Rede do Orgulho',
    text: texto
  };

  return transporter.sendMail(mailOptions);
}

function enviarConfirmacaoSuporte(email, assunto, mensagem) {
  const mailOptions = {
    from: 'redeorgulho@gmail.com',
    to: email,
    subject: assunto,
    text: mensagem
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { enviarCodigo, enviarConfirmacaoSuporte };
