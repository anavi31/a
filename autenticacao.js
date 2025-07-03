const bcrypt = require('bcrypt');
const fs = require('fs');
const { enviarCodigo } = require('./email');
const { lerUsuarios, salvarUsuario, salvarCodigo, validarCodigo } = require('./utils');

const SALT = 10;

module.exports = (app, passport) => {
  app.post('/cadastro', async (req, res) => {
    const { nome, sobrenome, genero, orientacao, email, telefone, cpf, senha } = req.body;
    const usuarios = await lerUsuarios();
    if (usuarios.find(u => u.email === email)) return res.status(400).send('Email já cadastrado');

    const senhaHash = await bcrypt.hash(senha, SALT);
    const user = { nome, sobrenome, genero, orientacao, email, telefone, cpf, senha: senhaHash, verificado: false };
    salvarUsuario(user);
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    salvarCodigo(email, codigo);
    await enviarCodigo(email, codigo);
    res.send('Cadastro realizado. Código enviado para o e-mail.');
  });

  app.post('/validar-codigo', (req, res) => {
    const { email, codigo } = req.body;
    if (!validarCodigo(email, codigo)) return res.status(400).send('Código inválido');

    const linhas = fs.readFileSync('users.csv', 'utf-8').split('\n');
    const nova = linhas.map((linha, i) => {
      if (i === 0 || !linha.includes(email)) return linha;
      return linha.replace(/false$/, 'true');
    });
    fs.writeFileSync('users.csv', nova.join('\n'));
    res.send('Código validado com sucesso');
  });

  app.post('/reenviar-codigo', async (req, res) => {
  const { email } = req.body;

  try {
    const dados = JSON.parse(fs.readFileSync('codes.json', 'utf-8'));
    const codigoExistente = dados[email]?.codigo;

    if (!codigoExistente) {
      return res.status(404).send('Nenhum código encontrado para este e-mail.');
    }

    await enviarCodigo(email, codigoExistente);
    res.send('Código reenviado com sucesso!');
  } catch (err) {
    console.error('Erro ao reenviar código:', err);
    res.status(500).send('Erro ao reenviar o código.');
  }
  });

  app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    const usuarios = await lerUsuarios();
    const user = usuarios.find(u => u.email === email);
    if (!user || !(await bcrypt.compare(senha, user.senha))) return res.status(400).send('Credenciais inválidas');
    if (user.verificado !== 'true') return res.status(403).send('Conta não verificada');
    res.send('Login bem-sucedido');
  });

  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  passport.use(new GoogleStrategy({
    clientID: '889789394380-lc6hc8fmp9jv4ocreucussc2asg8l72j.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: '/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
  const emailGoogle = profile.emails[0].value;
  const usuarios = await lerUsuarios();
  const usuarioExiste = usuarios.find(u => u.email === emailGoogle);

  if (!usuarioExiste) return done(null, false);

  return done(null, profile);
  }));

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html?erro=email' }),
    (req, res) => res.send('Login bem-sucedido com Google!')
  );

  app.post('/recuperar', async (req, res) => {
    const { email } = req.body;
    const usuarios = await lerUsuarios();
    const user = usuarios.find(u => u.email === email);
    if (!user) return res.status(400).send('Email não encontrado');

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    salvarCodigo(email, codigo);
    await enviarCodigo(email, codigo);
    res.send('Código enviado para o e-mail');
  });

  app.post('/alterar-senha', async (req, res) => {
    const { email, novaSenha } = req.body;
    const hash = await bcrypt.hash(novaSenha, SALT);

    const linhas = fs.readFileSync('users.csv', 'utf-8').split('\n');
    const nova = linhas.map((linha, i) => {
      if (i === 0 || !linha.includes(email)) return linha;
      const partes = linha.split(',');
      partes[7] = hash;
      return partes.join(',');
    });
    fs.writeFileSync('users.csv', nova.join('\n'));
    res.send('Senha alterada com sucesso');
  });
};
