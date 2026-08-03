
const fs = require('fs');
const file = 'c:/laragon/www/coverage-area/resources/js/Pages/Monitoring/Cabang.jsx';
let content = fs.readFileSync(file, 'utf8');

// The exact string blocks for TRL and TRL per Jenjang:
// Since they are long, we can find them by index.
const trlStart = content.indexOf('                        {/* TRL */}');
const trlEnd = content.indexOf('                        {/* Sales Performance */}');
const trlBlock = content.substring(trlStart, trlEnd).trim();

const trlJenjangStart = content.indexOf('                        {/* TRL per Jenjang */}');
const trlJenjangEnd = content.indexOf('                    </div>\n                </div>\n\n                {/* -- R3');
const trlJenjangBlock = content.substring(trlJenjangStart, trlJenjangEnd).trim();

const p3Start = content.indexOf('{/* Strategic School */}');
const p3End = content.indexOf('{/* Pra Area Cover */}');
const strategicSchoolBlock = content.substring(p3Start, p3End).trim();


console.log('TRL Block Length:', trlBlock.length);
console.log('TRL Jenjang Length:', trlJenjangBlock.length);

