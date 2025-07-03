const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());

const session = require('express-session');
const passport = require('passport');
app.use(session({ secret: 'secreto', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

require('./autenticacao')(app, passport);
require('./suporte')(app);
require('./locais')(app);
require('./forum')(app);

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});