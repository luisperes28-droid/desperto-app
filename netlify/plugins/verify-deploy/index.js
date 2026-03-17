const fs = require('fs');
const path = require('path');

module.exports = {
  onPostBuild: ({ utils, constants }) => {
    const publishDir = constants.PUBLISH_DIR || 'dist';
    const indexPath = path.join(publishDir, 'index.html');

    if (!fs.existsSync(indexPath)) {
      utils.build.failBuild(
        `ERRO DEPLOY: index.html nao encontrado em ${publishDir}. Build nao gerou output.`
      );
      return;
    }

    const html = fs.readFileSync(indexPath, 'utf-8');

    const buildDateMatch = html.match(/meta name="build-date" content="([^"]+)"/);
    if (!buildDateMatch) {
      utils.build.failBuild(
        'ERRO DEPLOY: meta tag build-date nao encontrada no index.html. O build pode estar a usar ficheiros antigos.'
      );
      return;
    }

    const buildDate = buildDateMatch[1];
    const today = new Date().toISOString().split('T')[0];

    if (buildDate !== today) {
      utils.build.failBuild(
        `ERRO DEPLOY: build-date no index.html e "${buildDate}" mas hoje e "${today}". ` +
        `Os ficheiros estao desatualizados! Faz "Clear cache and deploy site" na Netlify.`
      );
      return;
    }

    const stats = fs.statSync(indexPath);
    const fileDate = stats.mtime.toISOString().split('T')[0];

    console.log('=== VERIFICACAO DEPLOY ===');
    console.log(`Build date (meta tag): ${buildDate}`);
    console.log(`File modified:         ${stats.mtime.toISOString()}`);
    console.log(`Today:                 ${today}`);
    console.log('Deploy verificado com sucesso!');
    console.log('=========================');
  },

  onSuccess: ({ utils }) => {
    console.log('Deploy publicado com sucesso e verificado.');
  },

  onError: ({ utils }) => {
    console.log(
      'ATENCAO: O deploy falhou. Verifica se o GitHub sync esta a enviar o codigo correto.'
    );
  },
};
