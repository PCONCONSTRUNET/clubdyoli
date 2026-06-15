const path = require('path');
const fs = require('fs');

async function generateIcons() {
  try {
    const sourcePath = 'c:\\Users\\P-CON CONSTRUNET\\Desktop\\pwa dyoli.png';
    const publicDir = 'c:\\Users\\P-CON CONSTRUNET\\.antigravity-ide\\clubdyoli\\public';
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    console.log("Copiando imagens...");
    
    fs.copyFileSync(sourcePath, path.join(publicDir, 'icon-192x192.png'));
    fs.copyFileSync(sourcePath, path.join(publicDir, 'icon-512x512.png'));
    fs.copyFileSync(sourcePath, path.join(publicDir, 'apple-icon.png'));

    console.log("Ícones copiados com sucesso!");
  } catch (error) {
    console.error("Erro ao copiar ícones:", error);
  }
}

generateIcons();
