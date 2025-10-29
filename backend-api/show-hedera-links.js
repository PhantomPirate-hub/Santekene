require('dotenv').config();

console.log('\n🔗 VOS LIENS HASHSCAN (TESTNET)\n');
console.log('═'.repeat(60));

const operatorId = process.env.HEDERA_OPERATOR_ID || 'NON_CONFIGURÉ';
const topicId = process.env.HEDERA_TOPIC_ID || 'NON_CONFIGURÉ';
const tokenId = process.env.HEDERA_TOKEN_ID || 'NON_CONFIGURÉ';

console.log('\n📍 COMPTE PRINCIPAL:');
console.log(`   https://hashscan.io/testnet/account/${operatorId}`);

console.log('\n📜 TOPIC HCS (Audit Trail):');
console.log(`   https://hashscan.io/testnet/topic/${topicId}`);

console.log('\n💰 TOKEN KENEPOINTS:');
console.log(`   https://hashscan.io/testnet/token/${tokenId}`);

console.log('\n' + '═'.repeat(60));
console.log('\n💡 Astuce: Copiez ces liens dans votre navigateur pour voir vos transactions!');
console.log('\n📋 Actions maintenant sur HCS:');
console.log('   - CONSULTATION_CREATED');
console.log('   - DOCUMENT_UPLOADED');
console.log('   - PRESCRIPTION_ISSUED');
console.log('   - DSE_ACCESS_GRANTED / DSE_ACCESS_DENIED');
console.log('   - POINTS_AWARDED (attribution KenePoints)');
console.log('\n🆕 Service HFS activé pour documents médicaux!');
console.log('   - Documents stockés de manière immuable');
console.log('   - Vérification d\'intégrité disponible');
console.log('   - Visualiser: https://hashscan.io/testnet/file/FILE_ID\n');

