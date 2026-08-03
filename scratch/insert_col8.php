<?php
$filepath = __DIR__ . '/../resources/js/Pages/Monitoring/Tabs/DashboardTab.jsx';
$content = file_get_contents($filepath);

$lineEnding = (strpos($content, "\r\n") !== false) ? "\r\n" : "\n";
$le = $lineEnding;

$marker = '                                            </div>' . $le
        . '                                        </div>' . $le
        . $le
        . '                                        {/* Row 2:';

$newCard = '                                            </div>' . $le
         . $le
         . '                                            {/* Column 8: Realisasi vs Rencana Jual */}' . $le
         . '                                            <div style={{ flex: "0 0 200px", display: "flex", flexDirection: "column", minWidth: 180 }}>' . $le
         . '                                                <div style={{ ...S.card, padding: 0, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>' . $le
         . '                                                    <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8, background: "#f8fafc" }}>' . $le
         . '                                                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>' . $le
         . '                                                            <i className="bi bi-bar-chart-line-fill" style={{ fontSize: 12, color: "#0ea5e9" }} />' . $le
         . '                                                        </div>' . $le
         . '                                                        <div>' . $le
         . '                                                            <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>Realisasi vs Rencana Jual</div>' . $le
         . '                                                            <div style={{ fontSize: 9.5, color: T.slate, marginTop: 1 }}>Data RJS 2025 & 2026</div>' . $le
         . '                                                        </div>' . $le
         . '                                                    </div>' . $le
         . '                                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "14px 16px", gap: 10, justifyContent: "center" }}>' . $le
         . '                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>' . $le
         . '                                                            <div style={{ fontSize: 10, color: T.slate, fontWeight: 600 }}>Realisasi 2025</div>' . $le
         . '                                                            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{Number(insights?.totalRealisasi2025 || 0).toLocaleString("id-ID")}</div>' . $le
         . '                                                        </div>' . $le
         . '                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>' . $le
         . '                                                            <div style={{ fontSize: 10, color: T.slate, fontWeight: 600 }}>Rencana 2026</div>' . $le
         . '                                                            <div style={{ fontSize: 14, fontWeight: 800, color: "#0ea5e9" }}>{Number(insights?.totalRencanaJual2026 || 0).toLocaleString("id-ID")}</div>' . $le
         . '                                                        </div>' . $le
         . '                                                    </div>' . $le
         . '                                                </div>' . $le
         . '                                            </div>' . $le
         . '                                        </div>' . $le
         . $le
         . '                                        {/* Row 2:';

if (strpos($content, $marker) !== false) {
    $newContent = str_replace($marker, $newCard, $content);
    file_put_contents($filepath, $newContent);
    echo 'SUCCESS: Card inserted!' . PHP_EOL;
} else {
    echo 'MARKER_NOT_FOUND' . PHP_EOL;
}
