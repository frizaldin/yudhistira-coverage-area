const fs = require('fs');

const cabangPath = './resources/js/Pages/Monitoring/Cabang.jsx';
const areaPath = './resources/js/Pages/Monitoring/Area.jsx';

const cabangContent = fs.readFileSync(cabangPath, 'utf8');
let areaContent = fs.readFileSync(areaPath, 'utf8');

// Extract generic components from Cabang.jsx
// It starts at "/* ── DESIGN TOKENS ── */"
// and ends before "/* ════════════════════════════"
// Wait, the exact string for MAIN PAGE is:
// /* ════════════════════════════
//    MAIN PAGE
//    ════════════════════════════ */

const startMarker = '/* ── DESIGN TOKENS ── */';
const endMarker = '/* ════════════════════════════\n   MAIN PAGE';
const endMarkerOld = '/* ═';

const startIdxCabang = cabangContent.indexOf(startMarker);
const endIdxCabang = cabangContent.indexOf(endMarker);
if (startIdxCabang === -1 || endIdxCabang === -1) {
    console.error('Markers not found in Cabang.jsx');
    process.exit(1);
}
const genericComponents = cabangContent.slice(startIdxCabang, endIdxCabang);

const startIdxArea = areaContent.indexOf(startMarker);
const endIdxArea = areaContent.indexOf(endMarker);
// Wait, Area.jsx might have a slightly different end marker? Let's check Area.jsx end marker.
// Above I saw it is:
// /* ════════════════════════════
//    MAIN PAGE
//    ════════════════════════════ */
// wait, the previous tool output showed it as:
// /* â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• 
//    MAIN PAGE
//    â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â•  */
// which is just UTF-8 box drawing characters messed up in console, but in file it's `/* ════════════════════════════`.

const endIdxAreaActual = areaContent.indexOf('/* ════════════════════════════\n   MAIN PAGE');

if (startIdxArea === -1 || endIdxAreaActual === -1) {
    console.error('Markers not found in Area.jsx');
    process.exit(1);
}

// Replace the block
areaContent = areaContent.slice(0, startIdxArea) + genericComponents + areaContent.slice(endIdxAreaActual);

// Now apply hover effects to <tr key={...}>
// Regex: /<tr key=\{([^\}]+)\}>/g
// Replacement:
// <tr key={$1}
//     style={{ transition: "background 0.2s ease" }}
//     onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
//     onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
// >

areaContent = areaContent.replace(/<tr key=\{([^\}]+)\}>/g, `<tr key={$1}
    style={{ transition: "background 0.2s ease" }}
    onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
>`);

fs.writeFileSync(areaPath, areaContent);
console.log('Successfully synced generic components and hover effects to Area.jsx');
