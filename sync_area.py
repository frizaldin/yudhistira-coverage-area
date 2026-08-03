import re

cabang_path = './resources/js/Pages/Monitoring/Cabang.jsx'
area_path = './resources/js/Pages/Monitoring/Area.jsx'

with open(cabang_path, 'r', encoding='utf-8') as f:
    cabang_content = f.read()

with open(area_path, 'r', encoding='utf-8') as f:
    area_content = f.read()

start_marker = '/* ── DESIGN TOKENS ── */'
end_marker = '/* ════════════════════════════\n   MAIN PAGE'

start_idx_cabang = cabang_content.find(start_marker)
end_idx_cabang = cabang_content.find(end_marker)

if start_idx_cabang == -1 or end_idx_cabang == -1:
    print("Markers not found in Cabang.jsx")
    exit(1)

generic_components = cabang_content[start_idx_cabang:end_idx_cabang]

start_idx_area = area_content.find(start_marker)
end_idx_area = area_content.find(end_marker)

if start_idx_area == -1 or end_idx_area == -1:
    print("Markers not found in Area.jsx")
    exit(1)

# Replace the block
area_content = area_content[:start_idx_area] + generic_components + area_content[end_idx_area:]

# Now apply hover effects to <tr key={...}>
pattern = r'<tr key=\{([^\}]+)\}>'
replacement = r'''<tr key={\1}
    style={{ transition: "background 0.2s ease" }}
    onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
>'''

area_content = re.sub(pattern, replacement, area_content)

with open(area_path, 'w', encoding='utf-8') as f:
    f.write(area_content)

print("Successfully synced generic components and hover effects to Area.jsx")
