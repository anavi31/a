const fs = require('fs');
const csv = require('csv-parser');

function lerPostsForum() {
  return new Promise((resolve) => {
    const posts = [];
    fs.createReadStream('forum.csv')
      .pipe(csv())
      .on('data', (row) => posts.push(row))
      .on('end', () => resolve(posts));
  });
}

module.exports = (app) => {
  app.get('/forum', async (req, res) => {
    const { tag } = req.query;
    const posts = await lerPostsForum();
    const filtrados = tag
      ? posts.filter(p => p.tag && p.tag.toLowerCase() === tag.toLowerCase())
      : posts;
        res.json(filtrados);
  });

  app.get('/forum/:titulo', async (req, res) => {
    const titulo = decodeURIComponent(req.params.titulo);
    const posts = await lerPostsForum();
    const post = posts.find(p => p.titulo === titulo);
    if (!post) return res.status(404).send('Post não encontrado');
  });
};