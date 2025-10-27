import * as fs from 'fs';
import * as path from 'path';

function removeConsoleLogs(filePath: string): boolean {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Supprimer les console.log (garder console.error et console.warn)
  const newContent = content.replace(/^\s*console\.log\([^)]*\);?\s*$/gm, '');
  
  if (newContent !== content) {
    modified = true;
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ Nettoyé: ${filePath}`);
  }
  
  return modified;
}

function processDirectory(dir: string): number {
  let totalModified = 0;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && file.name !== 'node_modules' && file.name !== '.next') {
      totalModified += processDirectory(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      if (!file.name.endsWith('.d.ts')) {
        if (removeConsoleLogs(fullPath)) {
          totalModified++;
        }
      }
    }
  }
  
  return totalModified;
}

console.log('\n🧹 NETTOYAGE DES CONSOLE.LOG (FRONTEND)...\n');
console.log('════════════════════════════════════════════════════\n');

const frontendModified = processDirectory('./src');
console.log(`\n📊 Frontend: ${frontendModified} fichier(s) modifié(s)`);

console.log('\n✅ Nettoyage terminé !\n');
console.log('💡 Les console.error et console.warn ont été conservés.\n');

