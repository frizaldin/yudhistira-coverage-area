const fs = require("fs");
const path = require("path");

const files = [
    "resources/js/Pages/Monitoring/Tabs/SekolahTabCabang.jsx",
    "resources/js/Pages/Monitoring/Tabs/NonAreaCoverTab.jsx",
];

const startMarker =
    "                                            // Group: Kecamatan → Jenjang → sekolah";
const endMarker = "                                        })()}";
const newBlock = fs.readFileSync(
    "scratch/sekolah_group_kota_block.jsx.txt",
    "utf8",
);

for (const rel of files) {
    const full = path.join(process.cwd(), rel);
    let src = fs.readFileSync(full, "utf8");
    const start = src.indexOf(startMarker);
    const end = src.indexOf(endMarker, start);
    if (start < 0 || end < 0) {
        console.error("markers not found in", rel, { start, end });
        process.exit(1);
    }
    src = src.slice(0, start) + newBlock + src.slice(end);
    fs.writeFileSync(full, src);
    console.log("patched", rel);
}
