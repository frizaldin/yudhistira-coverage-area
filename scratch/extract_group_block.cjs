const fs = require("fs");
const s = fs.readFileSync("scratch/patch_sekolah_group_kota.cjs", "utf8");
const start = s.indexOf("const newBlock = `") + "const newBlock = `".length;
const end = s.indexOf("`;\n\nfor (const rel of files)");
if (start < 0 || end < 0) {
    console.error("failed to locate newBlock", start, end);
    process.exit(1);
}
let body = s.slice(start, end);
// Escape ${ so when re-used as template literal they stay literal JSX expressions
body = body.replace(/\$\{/g, "\\${");
fs.writeFileSync("scratch/sekolah_group_kota_block.jsx.txt", body);
console.log("ok", body.length);
