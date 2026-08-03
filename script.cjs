const fs = require('fs');
const file = 'c:/laragon/www/coverage-area/resources/js/Pages/Monitoring/SalesPerformanceDetail.jsx';
let content = fs.readFileSync(file, 'utf8');

// Col 1 adjustments
content = content.replace(/flex: 1\.5, minWidth: 350/g, 'flex: 1.2, minWidth: 220');
content = content.replace(/padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10/g, 'padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6');
content = content.replace(/gap: 8, borderTop: `1px solid \$\{T\.border\}`, paddingTop: 10/g, 'gap: 4, borderTop: `1px solid ${T.border}`, paddingTop: 6');
content = content.replace(/padding: "8px 10px",(\s*)display: "flex"/g, 'padding: "4px 6px",$1display: "flex"');
content = content.replace(/fontSize: 18/g, 'fontSize: 14');
content = content.replace(/fontSize: 15/g, 'fontSize: 12');
content = content.replace(/fontSize: 8\.5/g, 'fontSize: 8');
content = content.replace(/fontSize: 9, fontWeight: 700/g, 'fontSize: 8.5, fontWeight: 700');
content = content.replace(/fontSize: 11\.5, fontWeight: 700/g, 'fontSize: 11, fontWeight: 700');

// Col 2 adjustments
content = content.replace(/flex: 1, minWidth: 350/g, 'flex: 1.2, minWidth: 220');
content = content.replace(/padding: "8px 12px"/g, 'padding: "4px 6px"');

// Col 3, 4, 5, 7 adjustments (minWidth 160 -> 140)
content = content.replace(/flex: 1, display: "flex", flexDirection: "column", minWidth: 160/g, 'flex: 1, display: "flex", flexDirection: "column", minWidth: 140');

fs.writeFileSync(file, content);
console.log('Modified minWidths and paddings!');
