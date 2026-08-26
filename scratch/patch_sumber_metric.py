from pathlib import Path

p = Path(r"c:\laragon\www\coverage-area\resources\js\Pages\Monitoring\Tabs\DashboardTab.jsx")
text = p.read_text(encoding="utf-8")
old = """                                                                                        {metricCells(
                                                                                            item,
                                                                                        )}"""
new = """                                                                                        {metricCells(
                                                                                            item,
                                                                                            {
                                                                                                componentType:
                                                                                                    "sumber_dana",
                                                                                                componentLabelPrefix:
                                                                                                    "Sumber Dana",
                                                                                            },
                                                                                        )}"""
count = text.count(old)
print("matches", count)
if count >= 1:
    # Prefer occurrence after Sumber Dana label
    marker = "Sumber\n                                                                                    Dana"
    idx = text.find(marker)
    if idx < 0:
        marker = "Sumber Dana"
        # find second metricCells bare after first jenjang already patched
        idx = 0
    pos = text.find(old, max(0, idx))
    print("pos", pos, "idx", idx)
    if pos >= 0:
        text = text[:pos] + new + text[pos + len(old):]
        p.write_text(text, encoding="utf-8")
        print("ok")
    else:
        print("pos not found")
else:
    print("no bare metricCells")
