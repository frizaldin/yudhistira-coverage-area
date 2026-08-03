
const fs = require('fs');
const file = 'c:/laragon/www/coverage-area/resources/js/Pages/Monitoring/Cabang.jsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
console.log('Lines:', lines.length);

