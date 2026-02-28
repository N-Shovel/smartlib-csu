import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace .ts imports with no extension
  content = content.replace(/from ["'](.+?)\.ts["']/g, 'from "$1"');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.js')) {
      fixImportsInFile(filePath);
    }
  });
}

walkDir(distDir);
console.log('✓ Fixed imports in compiled files');
