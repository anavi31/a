const fs = require('fs');
const csv = require('csv-parser');
const locaisPath = './locais.csv';
const comentariosPath = './comentarios.json';

function lerLocais() {
  return new Promise((resolve) => {
    const locais = [];
    fs.createReadStream(locaisPath)
      .pipe(csv())
      .on('data', (data) => locais.push(data))
      .on('end', () => resolve(locais));
  });
}

module.exports = (app) => {
  app.get('/locais', async (req, res) => {
    const { tag } = req.query;
    const locais = await lerLocais();
    const resultado = tag ? locais.filter(l => l.tag.toLowerCase() === tag.toLowerCase()) : locais;
    res.json(resultado);
  });

  app.get('/local/:nome', async (req, res) => {
    const nome = decodeURIComponent(req.params.nome);
    const locais = await lerLocais();
    const local = locais.find(l => l.nome === nome);
    if (!local) return res.status(404).send('Local não encontrado');

    const comentarios = JSON.parse(fs.readFileSync(comentariosPath, 'utf-8') || '{}');
    res.json({ ...local, comentarios: comentarios[nome] || [] });
  });

  app.post('/local/:nome/comentario', (req, res) => {
    const nome = decodeURIComponent(req.params.nome);
    const { autor, texto } = req.body;
    if (!autor || !texto) return res.status(400).send('Autor e texto obrigatórios');

    let comentarios = {};
    if (fs.existsSync(comentariosPath)) {
      comentarios = JSON.parse(fs.readFileSync(comentariosPath, 'utf-8') || '{}');
    }
    if (!comentarios[nome]) comentarios[nome] = [];
    comentarios[nome].push({ autor, texto, data: new Date().toISOString() });

    fs.writeFileSync(comentariosPath, JSON.stringify(comentarios, null, 2));
    res.send('Comentário adicionado com sucesso');
  });

  app.get('/local/endereco/:nome', async (req, res) => {
    const nome = decodeURIComponent(req.params.nome);
    const locais = await lerLocais();
    const local = locais.find(l => l.nome === nome);
    if (!local) return res.status(404).send('Local não encontrado');

    const cep = local.cep;

    res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Mapa de ${local.nome}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
      <style>
        body { font-family: sans-serif; text-align: center; padding: 20px; }
        #map { height: 400px; width: 100%; max-width: 600px; margin: 20px auto; border-radius: 8px; }
      </style>
    </head>
    <body>
      <button onclick="history.back()">← Voltar</button>
      <h2>${local.nome}</h2>
      <p>Localização aproximada com base no CEP: ${cep}</p>
      <div id="map">Carregando mapa...</div>

      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
      <script>
        async function buscarCoordenadas(cep) {
          const resp = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + cep + '+Brasil');
          const dados = await resp.json();
          return dados[0];
        }

        async function carregarMapa() {
          const resultado = await buscarCoordenadas('${cep}');
          if (!resultado) {
            document.getElementById('map').innerText = 'Não foi possível localizar o endereço.';
            return;
          }

          const lat = parseFloat(resultado.lat);
          const lon = parseFloat(resultado.lon);

          const mapa = L.map('map').setView([lat, lon], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(mapa);
          L.marker([lat, lon]).addTo(mapa);
        }

        carregarMapa();
      </script>
    </body>
    </html>`);
  });
};