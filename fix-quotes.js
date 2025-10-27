const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des guillemets typographiques...\n');

function getAllTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllTsxFiles(filePath, fileList);
    } else if (file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixQuotes(content) {
  let fixed = content;
  
  // Apostrophes courbes -> apostrophe droite
  fixed = fixed.replace(/[\u2018\u2019]/g, "'");  // ' et '
  
  // Guillemets courbes -> guillemets droits
  fixed = fixed.replace(/[\u201C\u201D]/g, '"');  // " et "
  
  // Guillemets français
  fixed = fixed.replace(/[\u00AB\u00BB]/g, '"');  // « et »
  
  return fixed;
}

const frontendSrc = path.join(__dirname, 'frontend', 'src');
const files = getAllTsxFiles(frontendSrc);
let count = 0;

files.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixQuotes(content);
    
    if (content !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      count++;
      const relativePath = filePath.replace(__dirname + path.sep, '');
      console.log(`✅ ${relativePath}`);
    }
  } catch (err) {
    console.error(`❌ Erreur: ${filePath}`, err.message);
  }
});

console.log(`\n════════════════════════════════════════════════════`);
console.log(`✅ ${count} fichiers corrigés !`);
console.log(`════════════════════════════════════════════════════\n`);
console.log(`🔄 Le frontend va recompiler automatiquement...`);
console.log(`   Attendez 20-30 secondes puis rafraîchissez votre navigateur\n`);

