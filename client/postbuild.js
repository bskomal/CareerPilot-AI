import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');
const clientPath = path.join(distPath, 'client');

if (!fs.existsSync(clientPath)) {
    fs.mkdirSync(clientPath, { recursive: true });
}

fs.copyFileSync(
    path.join(distPath, 'index.html'),
    path.join(clientPath, 'index.html')
);
console.log('Postbuild: Successfully copied index.html to dist/client/index.html');
