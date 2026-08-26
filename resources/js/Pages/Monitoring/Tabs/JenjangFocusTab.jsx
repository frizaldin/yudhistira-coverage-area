import React, { useEffect, useMemo, useState } from "react";
import { T, Card } from "./SalesPerformanceShared";

const JENJANG_ORDER = ["SD", "SMP", "SMA", "SMK"];

function parseKecamatanName(raw) {
    const full = String(raw || "").trim();
    if (!full) {
        return { base: "TANPA KECAMATAN", kotaKab: null, display: "Tanpa Kecamatan" };
    }
    const parts = full.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
        const base = parts[0].toUpperCase();
        const kotaKab = parts.slice(1).join(", ").toUpperCase();
        return { base, kotaKab, display: `${base}, ${kotaKab}` };
    }
    return {
        base: parts[0].toUpperCase(),
        kotaKab: null,
        display: parts[0].toUpperCase(),
    };
}

function emptyTotals() {
    return {
        count: 0,
        siswa: 0,
        realYm3: 0,
        realYm2: 0,
        potensiPrev: 0,
        spPrev: 0,
        realPrev: 0,
        potensiCurr: 0,
        spCurr: 0,
        realCurr: 0,
    };
}

function addSchoolToTotals(acc, s) {
    acc.count += 1;
    acc.siswa += Number(s.total_student) || 0;
    acc.realYm3 += Number(s.real_exemplar_ym3) || 0;
    acc.realYm2 += Number(s.real_exemplar_ym2) || 0;
    acc.potensiPrev += Number(s.potential_exemplar_previous) || 0;
    acc.spPrev += Number(s.sp_exemplar_previous) || 0;
    acc.realPrev += Number(s.real_exemplar_previous) || 0;
    acc.potensiCurr += Number(s.potential_exemplar_current) || 0;
    acc.spCurr += Number(s.sp_exemplar_current) || 0;
    acc.realCurr += Number(s.real_exemplar_current) || 0;
    return acc;
}

function schoolJenjang(s) {
    return (
        String(s.jenjang || "Lainnya").toUpperCase().trim() || "Lainnya"
    );
}

function sortJenjangItems(a, b) {
    const ia = JENJANG_ORDER.indexOf(a.jenjang || a.key);
    const ib = JENJANG_ORDER.indexOf(b.jenjang || b.key);
    const oa = ia === -1 ? 99 : ia;
    const ob = ib === -1 ? 99 : ib;
    if (oa !== ob) return oa - ob;
    return String(a.jenjang || a.key || "").localeCompare(
        String(b.jenjang || b.key || ""),
    );
}

/** Kota/Kab + Kecamatan (totals saja, tanpa daftar sekolah) */
function buildKotaSummaries(schools, keyPrefix = "") {
    const kotaMap = {};
    (schools || []).forEach((s) => {
        const parsed = parseKecamatanName(s.kecamatan_name);
        const kotaKey = parsed.kotaKab || "TANPA KOTA/KAB";
        const kotaDisplay = parsed.kotaKab || "Tanpa Kota/Kab";
        const kecKey = parsed.base || "TANPA KECAMATAN";
        const kecDisplay = parsed.base || "Tanpa Kecamatan";

        if (!kotaMap[kotaKey]) {
            kotaMap[kotaKey] = {
                key: keyPrefix ? `${keyPrefix}::${kotaKey}` : kotaKey,
                rawKey: kotaKey,
                display: kotaDisplay,
                kecamatanMap: {},
                totals: emptyTotals(),
            };
        }
        const kota = kotaMap[kotaKey];
        if (!kota.kecamatanMap[kecKey]) {
            kota.kecamatanMap[kecKey] = {
                key: `${kota.key}::${kecKey}`,
                rawKey: kecKey,
                display: kecDisplay,
                totals: emptyTotals(),
            };
        }
        addSchoolToTotals(kota.kecamatanMap[kecKey].totals, s);
        addSchoolToTotals(kota.totals, s);
    });

    return Object.values(kotaMap)
        .sort((a, b) => a.display.localeCompare(b.display, "id"))
        .map((kota) => ({
            ...kota,
            kecamatanList: Object.values(kota.kecamatanMap).sort((a, b) =>
                a.display.localeCompare(b.display, "id"),
            ),
        }));
}

/** Tab Jenjang — dashboard Area & Cabang (duplikat mandiri dari ProspekTab). */
export default function JenjangFocusTab(props) {
    const {
        listSekolah,
        configuration,
        insights,
        filters,
        groupByCabang = false,
        focusFilter = null,
    } = props;

    const [nameFilter, setNameFilter] = useState("");
    const [kotaFilter, setKotaFilter] = useState("");
    const [cabangFilter, setCabangFilter] = useState("");
    const [sort, setSort] = useState({ key: "name", dir: "asc" });
    // key di Set = terbuka; default kosong = semua tertutup (lazy load anak)
    const [expandedCabang, setExpandedCabang] = useState(() => new Set());
    const [expandedKota, setExpandedKota] = useState(() => new Set());
    const [expandedKec, setExpandedKec] = useState(() => new Set());
    const [expandedJenjang, setExpandedJenjang] = useState(() => new Set());

    const clearExpanded = () => {
        setExpandedJenjang(new Set());
        setExpandedCabang(new Set());
        setExpandedKota(new Set());
        setExpandedKec(new Set());
    };

    useEffect(() => {
        if (!focusFilter) return;
        const kota = String(focusFilter.kotaKab || "").trim();
        const cabang = String(focusFilter.cabang || "").trim();
        if (groupByCabang && cabang) {
            setCabangFilter(cabang);
        }
        if (kota) {
            setKotaFilter(kota);
        }
        setNameFilter("");
    }, [focusFilter, groupByCabang]);

    const toggleInSet = (setter) => (key) => {
        setter((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleCabang = toggleInSet(setExpandedCabang);
    const toggleKota = toggleInSet(setExpandedKota);
    const toggleKec = toggleInSet(setExpandedKec);
    const toggleJenjang = toggleInSet(setExpandedJenjang);

    const currYear = Number(
        filters?.tahun ||
            insights?.targetYear ||
            configuration?.target_year ||
            2026,
    );
    const prevYear = currYear - 1;
    const ym2 = currYear - 2;
    const ym3 = currYear - 3;

    const areaCoverSchools = useMemo(
        () => (listSekolah || []).filter((s) => s.is_active == 1),
        [listSekolah],
    );

    const cabangOptions = useMemo(() => {
        if (!groupByCabang) return [];
        const set = new Set();
        areaCoverSchools.forEach((s) => {
            set.add(s.cabang_name || "Tanpa Cabang");
        });
        return [...set].sort((a, b) => a.localeCompare(b, "id"));
    }, [areaCoverSchools, groupByCabang]);

    const kotaOptions = useMemo(() => {
        const set = new Set();
        areaCoverSchools.forEach((s) => {
            if (groupByCabang && cabangFilter) {
                const cn = s.cabang_name || "Tanpa Cabang";
                if (cn !== cabangFilter) return;
            }
            const parsed = parseKecamatanName(s.kecamatan_name);
            set.add(parsed.kotaKab || "TANPA KOTA/KAB");
        });
        return [...set].sort((a, b) => a.localeCompare(b, "id"));
    }, [areaCoverSchools, groupByCabang, cabangFilter]);

    const filteredSorted = useMemo(() => {
        const q = nameFilter.trim().toLowerCase();
        let rows = areaCoverSchools;
        if (groupByCabang && cabangFilter) {
            rows = rows.filter(
                (s) => (s.cabang_name || "Tanpa Cabang") === cabangFilter,
            );
        }
        if (kotaFilter) {
            rows = rows.filter((s) => {
                const parsed = parseKecamatanName(s.kecamatan_name);
                const kota = parsed.kotaKab || "TANPA KOTA/KAB";
                return kota === kotaFilter;
            });
        }
        if (q) {
            rows = rows.filter((s) =>
                String(s.name || "")
                    .toLowerCase()
                    .includes(q),
            );
        }

        const dir = sort.dir === "asc" ? 1 : -1;
        const key = sort.key;
        return [...rows].sort((a, b) => {
            if (key === "name") {
                return (
                    String(a.name || "").localeCompare(String(b.name || ""), "id", {
                        sensitivity: "base",
                    }) * dir
                );
            }
            const av = Number(a[key]) || 0;
            const bv = Number(b[key]) || 0;
            if (av === bv) {
                return String(a.name || "").localeCompare(String(b.name || ""), "id", {
                    sensitivity: "base",
                });
            }
            return (av - bv) * dir;
        });
    }, [areaCoverSchools, nameFilter, kotaFilter, cabangFilter, groupByCabang, sort]);

    // Reset expand saat filter/sort berubah supaya tidak bawa state lama
    useEffect(() => {
        clearExpanded();
    }, [nameFilter, kotaFilter, cabangFilter, sort.key, sort.dir]);

    // Fokus dari market share: buka jenjang + kota terkait setelah filter aktif
    useEffect(() => {
        if (!focusFilter?.kotaKab) return;
        const ku = String(focusFilter.kotaKab).trim().toUpperCase();
        const jKeys = new Set();
        const kotaKeys = new Set();
        const cabKeys = new Set();
        filteredSorted.forEach((s) => {
            const parsed = parseKecamatanName(s.kecamatan_name);
            const kota = parsed.kotaKab || "TANPA KOTA/KAB";
            if (kota !== ku) return;
            const j = schoolJenjang(s);
            jKeys.add(j);
            if (groupByCabang) {
                const cn = s.cabang_name || "Tanpa Cabang";
                cabKeys.add(`${j}::${cn}`);
                kotaKeys.add(`${j}::${cn}::${ku}`);
            } else {
                kotaKeys.add(`${j}::${ku}`);
            }
        });
        setExpandedJenjang(jKeys);
        setExpandedCabang(cabKeys);
        setExpandedKota(kotaKeys);
    }, [focusFilter, filteredSorted, groupByCabang]);

    const totalItems = filteredSorted.length;

    /** Index sekolah per jenjang (referensi ringan untuk lazy expand) */
    const schoolsByJenjang = useMemo(() => {
        const map = {};
        filteredSorted.forEach((s) => {
            const j = schoolJenjang(s);
            if (!map[j]) map[j] = [];
            map[j].push(s);
        });
        return map;
    }, [filteredSorted]);

    /** Level 1: ringkasan jenjang saja (tanpa anak) */
    const jenjangRoots = useMemo(() => {
        const map = {};
        filteredSorted.forEach((s) => {
            const j = schoolJenjang(s);
            if (!map[j]) {
                map[j] = {
                    jenjang: j,
                    key: j,
                    display: j,
                    totals: emptyTotals(),
                };
            }
            addSchoolToTotals(map[j].totals, s);
        });
        return Object.values(map).sort(sortJenjangItems);
    }, [filteredSorted]);

    /** Level 2a (area): cabang di bawah jenjang yang terbuka */
    const cabangByJenjang = useMemo(() => {
        if (!groupByCabang) return {};
        const out = {};
        expandedJenjang.forEach((j) => {
            const schools = schoolsByJenjang[j] || [];
            const cabangMap = {};
            schools.forEach((s) => {
                const cn = s.cabang_name || "Tanpa Cabang";
                if (!cabangMap[cn]) {
                    cabangMap[cn] = {
                        key: `${j}::${cn}`,
                        display: cn,
                        totals: emptyTotals(),
                    };
                }
                addSchoolToTotals(cabangMap[cn].totals, s);
            });
            out[j] = Object.values(cabangMap).sort((a, b) =>
                a.display.localeCompare(b.display, "id"),
            );
        });
        return out;
    }, [groupByCabang, expandedJenjang, schoolsByJenjang]);

    /** Level 2b/3: kota+kecamatan summary hanya untuk parent yang terbuka */
    const kotaByParent = useMemo(() => {
        const out = {};
        if (groupByCabang) {
            expandedCabang.forEach((cabKey) => {
                const parts = String(cabKey).split("::");
                const j = parts[0];
                const cabName = parts.slice(1).join("::");
                const schools = (schoolsByJenjang[j] || []).filter(
                    (s) => (s.cabang_name || "Tanpa Cabang") === cabName,
                );
                out[cabKey] = buildKotaSummaries(schools, cabKey);
            });
        } else {
            expandedJenjang.forEach((j) => {
                out[j] = buildKotaSummaries(schoolsByJenjang[j] || [], j);
            });
        }
        return out;
    }, [
        groupByCabang,
        expandedCabang,
        expandedJenjang,
        schoolsByJenjang,
    ]);

    /** Level akhir: daftar sekolah hanya untuk kecamatan yang terbuka */
    const schoolsByKec = useMemo(() => {
        const out = {};
        expandedKec.forEach((kecKey) => {
            const parts = String(kecKey).split("::");
            if (parts.length < 3) return;
            const kecRaw = parts[parts.length - 1];
            const kotaRaw = parts[parts.length - 2];
            const j = parts[0];
            let schools = schoolsByJenjang[j] || [];
            if (groupByCabang && parts.length >= 4) {
                const cabName = parts[1];
                schools = schools.filter(
                    (s) => (s.cabang_name || "Tanpa Cabang") === cabName,
                );
            }
            const list = schools.filter((s) => {
                const p = parseKecamatanName(s.kecamatan_name);
                return (
                    (p.kotaKab || "TANPA KOTA/KAB") === kotaRaw &&
                    (p.base || "TANPA KECAMATAN") === kecRaw
                );
            });
            out[kecKey] = list.map((s, i) => ({ ...s, _rowNo: i + 1 }));
        });
        return out;
    }, [expandedKec, schoolsByJenjang, groupByCabang]);

    const toggleSort = (key) => {
        setSort((prev) =>
            prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                : { key, dir: key === "name" ? "asc" : "desc" },
        );
    };

    const sortMark = (key) => {
        if (sort.key !== key) return "";
        return sort.dir === "asc" ? " ↑" : " ↓";
    };

    // Tinggi baris 1 thead (group Real / tahun) agar baris 2 sticky tepat di bawahnya
    const TH_ROW1_H = 28;
    const thBase = {
        padding: "5px 6px",
        color: T.slate,
        fontWeight: 700,
        fontSize: 10,
        borderBottom: `1px solid ${T.border}`,
        borderRight: `1px solid ${T.border}`,
        background: "#f8fafc",
        whiteSpace: "nowrap",
        textAlign: "center",
        userSelect: "none",
        position: "sticky",
        zIndex: 4,
    };
    const thLeft = { ...thBase, textAlign: "left" };
    const thCenter = { ...thBase, textAlign: "center" };
    const tdBase = {
        padding: "4px 6px",
        color: T.slate,
        fontSize: 10.5,
        borderRight: `1px solid ${T.border}`,
    };
    const tdCenter = {
        ...tdBase,
        textAlign: "center",
        whiteSpace: "nowrap",
    };
    const tdLeft = {
        ...tdBase,
        textAlign: "left",
    };

    const sortableTh = (label, key, extra = {}) => (
        <th
            onClick={() => toggleSort(key)}
            title="Klik untuk sortir"
            style={{
                ...thCenter,
                top: TH_ROW1_H,
                cursor: "pointer",
                ...extra,
            }}
        >
            {label}
            {sortMark(key)}
        </th>
    );

    const totals = filteredSorted.reduce(
        (acc, s) => addSchoolToTotals(acc, s),
        emptyTotals(),
    );

    const fmt = (n) => new Intl.NumberFormat("id-ID").format(n || 0);
    const color = T.green;
    // No, Nama, Siswa, Real×3, Curr×3 (Potensi/SP/Real)
    const colCount = 9;

    const metricCells = (t, opts = {}) => {
        const {
            bold = false,
            lastColor = T.text,
            borderRightLast,
        } = opts;
        const cell = (value, extra = {}) => (
            <td
                style={{
                    ...tdCenter,
                    color: T.text,
                    fontWeight: bold ? 800 : 600,
                    ...extra,
                }}
            >
                {fmt(value)}
            </td>
        );
        return (
            <>
                {cell(t.siswa)}
                {cell(t.realYm3)}
                {cell(t.realYm2)}
                {cell(t.realPrev)}
                {cell(t.potensiCurr)}
                {cell(t.spCurr)}
                {cell(t.realCurr, {
                    color: lastColor,
                    fontWeight: bold ? 800 : 700,
                    borderRight:
                        borderRightLast !== undefined
                            ? borderRightLast
                            : "none",
                })}
            </>
        );
    };

    const renderSchoolRows = (schools, padLeft = 40) =>
        (schools || []).map((s) => (
            <tr
                key={s.id || s._rowNo}
                style={{
                    borderBottom: `1px solid ${T.border}`,
                    transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f8fafc")
                }
                onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "white")
                }
            >
                <td style={{ ...tdBase, textAlign: "center" }}>{s._rowNo}</td>
                <td
                    style={{
                        ...tdBase,
                        fontWeight: 600,
                        color: T.text,
                        paddingLeft: padLeft,
                    }}
                >
                    {s.name}
                </td>
                <td style={{ ...tdCenter, fontWeight: 600 }}>
                    {fmt(s.total_student || 0)}
                </td>
                <td style={tdCenter}>{fmt(s.real_exemplar_ym3 || 0)}</td>
                <td style={tdCenter}>{fmt(s.real_exemplar_ym2 || 0)}</td>
                <td style={tdCenter}>{fmt(s.real_exemplar_previous || 0)}</td>
                <td style={tdCenter}>{fmt(s.potential_exemplar_current || 0)}</td>
                <td style={tdCenter}>{fmt(s.sp_exemplar_current || 0)}</td>
                <td
                    style={{
                        ...tdCenter,
                        color,
                        fontWeight: 700,
                        borderRight: "none",
                    }}
                >
                    {fmt(s.real_exemplar_current || 0)}
                </td>
            </tr>
        ));

    const renderKotaBlocks = (kotaList, padKota = 14, padKec = 28, padSch = 40) =>
        (kotaList || []).map((kota) => {
            const kotaOpen = expandedKota.has(kota.key);
            return (
                <React.Fragment key={kota.key}>
                    <tr
                        onClick={() => toggleKota(kota.key)}
                        title={
                            kotaOpen
                                ? "Klik untuk sembunyikan"
                                : "Klik untuk load kecamatan"
                        }
                        style={{
                            background: kotaOpen ? "#bfdbfe" : "#dbeafe",
                            borderBottom: `1px solid ${T.border}`,
                            cursor: "pointer",
                        }}
                    >
                        <td
                            style={{
                                ...tdBase,
                                textAlign: "center",
                                color: T.blue,
                                fontWeight: 800,
                            }}
                        >
                            <i
                                className={`bi bi-chevron-${kotaOpen ? "down" : "right"}`}
                                style={{ fontSize: 11 }}
                            />
                        </td>
                        <td
                            style={{
                                ...tdBase,
                                color: "#1e3a8a",
                                fontWeight: 800,
                                paddingLeft: padKota,
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                }}
                            >
                                <i
                                    className="bi bi-building"
                                    style={{ fontSize: 11 }}
                                />
                                {kota.display}
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color: T.slate,
                                        fontSize: 10,
                                    }}
                                >
                                    ({kota.totals.count} sekolah)
                                </span>
                            </span>
                        </td>
                        {metricCells(kota.totals, {
                            bold: true,
                            lastColor: color,
                        })}
                    </tr>
                    {kotaOpen &&
                        (kota.kecamatanList || []).map((kec) => {
                            const kecOpen = expandedKec.has(kec.key);
                            return (
                                <React.Fragment key={kec.key}>
                                    <tr
                                        onClick={() => toggleKec(kec.key)}
                                        title={
                                            kecOpen
                                                ? "Klik untuk sembunyikan"
                                                : "Klik untuk load sekolah"
                                        }
                                        style={{
                                            background: kecOpen
                                                ? "#dbeafe"
                                                : "#eff6ff",
                                            borderBottom: `1px solid ${T.border}`,
                                            cursor: "pointer",
                                        }}
                                    >
                                        <td
                                            style={{
                                                ...tdBase,
                                                textAlign: "center",
                                                color: T.blue,
                                                fontWeight: 800,
                                            }}
                                        >
                                            <i
                                                className={`bi bi-chevron-${kecOpen ? "down" : "right"}`}
                                                style={{ fontSize: 11 }}
                                            />
                                        </td>
                                        <td
                                            style={{
                                                ...tdBase,
                                                color: "#1e40af",
                                                fontWeight: 800,
                                                paddingLeft: padKec,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                }}
                                            >
                                                <i
                                                    className="bi bi-geo-alt-fill"
                                                    style={{ fontSize: 11 }}
                                                />
                                                {kec.display}
                                                <span
                                                    style={{
                                                        fontWeight: 600,
                                                        color: T.slate,
                                                        fontSize: 10,
                                                    }}
                                                >
                                                    ({kec.totals.count} sekolah)
                                                </span>
                                            </span>
                                        </td>
                                        {metricCells(kec.totals, {
                                            bold: true,
                                            lastColor: color,
                                        })}
                                    </tr>
                                    {kecOpen &&
                                        renderSchoolRows(
                                            schoolsByKec[kec.key] || [],
                                            padSch,
                                        )}
                                </React.Fragment>
                            );
                        })}
                </React.Fragment>
            );
        });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 2,
                }}
            >
                <div
                    style={{
                        width: 3,
                        height: 18,
                        background: T.blue,
                        borderRadius: 3,
                    }}
                />
                <h2
                    style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: T.text,
                        margin: 0,
                    }}
                >
                    Rekapan Area Cover {currYear}
                </h2>
            </div>

            <Card
                title="Jenjang"
                style={{
                    flex: 1,
                    minWidth: 300,
                    display: "flex",
                    flexDirection: "column",
                }}
                noPad
            >
                <div
                    style={{
                        padding: "6px 10px",
                        borderBottom: `1px solid ${T.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        flexWrap: "wrap",
                        background: "#fff",
                    }}
                >
                    <div style={{ fontSize: 10, color: T.slate }}>
                        Menampilkan{" "}
                        <strong style={{ color: T.text }}>{totalItems}</strong>{" "}
                        sekolah (filter) · total AC {areaCoverSchools.length} ·
                        klik Jenjang untuk load Kota/Kab · klik Kecamatan untuk load
                        sekolah · Real {ym3}–{prevYear} · {currYear} Potensi/SP/Real
                        {groupByCabang
                            ? " · grouping Jenjang → Cabang → Kota/Kab → Kecamatan"
                            : " · grouping Jenjang → Kota/Kab → Kecamatan"}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                        }}
                    >
                        {groupByCabang && (
                            <select
                                value={cabangFilter}
                                onChange={(e) => {
                                    setCabangFilter(e.target.value);
                                    setKotaFilter("");
                                }}
                                style={{
                                    minWidth: 160,
                                    maxWidth: 220,
                                    padding: "5px 8px",
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 6,
                                    fontSize: 11,
                                    outline: "none",
                                    color: T.text,
                                    background: "#f8fafc",
                                    cursor: "pointer",
                                }}
                            >
                                <option value="">Semua Cabang</option>
                                {cabangOptions.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        )}
                        <select
                            value={kotaFilter}
                            onChange={(e) => setKotaFilter(e.target.value)}
                            style={{
                                minWidth: 160,
                                maxWidth: 220,
                                padding: "5px 8px",
                                border: `1px solid ${T.border}`,
                                borderRadius: 6,
                                fontSize: 11,
                                outline: "none",
                                color: T.text,
                                background: "#f8fafc",
                                cursor: "pointer",
                            }}
                        >
                            <option value="">Semua Kota/Kab</option>
                            {kotaOptions.map((kota) => (
                                <option key={kota} value={kota}>
                                    {kota === "TANPA KOTA/KAB"
                                        ? "Tanpa Kota/Kab"
                                        : kota}
                                </option>
                            ))}
                        </select>
                        <div style={{ position: "relative", minWidth: 180 }}>
                            <i
                                className="bi bi-search"
                                style={{
                                    position: "absolute",
                                    left: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: 11,
                                    color: "#94a3b8",
                                }}
                            />
                            <input
                                type="text"
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                placeholder="Filter nama sekolah..."
                                style={{
                                    width: "100%",
                                    padding: "5px 8px 5px 26px",
                                    border: `1px solid ${T.border}`,
                                    borderRadius: 6,
                                    fontSize: 11,
                                    outline: "none",
                                    color: T.text,
                                    background: "#f8fafc",
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        overflow: "auto",
                        flex: 1,
                        maxHeight: "calc(100vh - 210px)",
                    }}
                >
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "separate",
                            borderSpacing: 0,
                            textAlign: "left",
                            fontSize: 10.5,
                            minWidth: 980,
                        }}
                    >
                        <thead>
                            <tr>
                                <th
                                    rowSpan={2}
                                    style={{
                                        ...thBase,
                                        top: 0,
                                        width: 36,
                                        verticalAlign: "middle",
                                    }}
                                >
                                    No
                                </th>
                                <th
                                    rowSpan={2}
                                    onClick={() => toggleSort("name")}
                                    title="Klik untuk sortir"
                                    style={{
                                        ...thLeft,
                                        top: 0,
                                        minWidth: 150,
                                        verticalAlign: "middle",
                                        cursor: "pointer",
                                    }}
                                >
                                    Nama Sekolah{sortMark("name")}
                                </th>
                                <th
                                    rowSpan={2}
                                    onClick={() => toggleSort("total_student")}
                                    title="Klik untuk sortir"
                                    style={{
                                        ...thCenter,
                                        top: 0,
                                        verticalAlign: "middle",
                                        cursor: "pointer",
                                    }}
                                >
                                    Jml Siswa{sortMark("total_student")}
                                </th>
                                <th
                                    colSpan={3}
                                    style={{
                                        ...thBase,
                                        top: 0,
                                        background: "#f1f5f9",
                                        color: T.slate,
                                    }}
                                >
                                    Real
                                </th>
                                <th
                                    colSpan={3}
                                    style={{
                                        ...thBase,
                                        top: 0,
                                        background: "#eff6ff",
                                        color: T.blue,
                                        borderRight: "none",
                                    }}
                                >
                                    {currYear}
                                </th>
                            </tr>
                            <tr>
                                {sortableTh(String(ym3), "real_exemplar_ym3")}
                                {sortableTh(String(ym2), "real_exemplar_ym2")}
                                {sortableTh(
                                    String(prevYear),
                                    "real_exemplar_previous",
                                )}
                                {sortableTh(
                                    "Potensi",
                                    "potential_exemplar_current",
                                )}
                                {sortableTh("SP", "sp_exemplar_current")}
                                {sortableTh(
                                    "Real",
                                    "real_exemplar_current",
                                    { borderRight: "none" },
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                style={{
                                    background: "#eff6ff",
                                    borderBottom: `1px solid ${T.border}`,
                                    fontWeight: 700,
                                }}
                            >
                                <td style={tdBase}>—</td>
                                <td
                                    style={{
                                        ...tdBase,
                                        color: T.blue,
                                        fontWeight: 800,
                                    }}
                                >
                                    Total ({totals.count} sekolah)
                                </td>
                                {metricCells(totals, {
                                    bold: true,
                                    lastColor: color,
                                })}
                            </tr>

                            {jenjangRoots.length > 0 ? (
                                jenjangRoots.map((jg) => {
                                    const jOpen = expandedJenjang.has(jg.key);
                                    return (
                                        <React.Fragment key={jg.key}>
                                            <tr
                                                onClick={() => toggleJenjang(jg.key)}
                                                title={
                                                    jOpen
                                                        ? "Klik untuk sembunyikan"
                                                        : "Klik untuk load detail"
                                                }
                                                style={{
                                                    background: jOpen
                                                        ? "#bfdbfe"
                                                        : "#dbeafe",
                                                    borderBottom: `1px solid ${T.border}`,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        textAlign: "center",
                                                        color: T.blue,
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    <i
                                                        className={`bi bi-chevron-${jOpen ? "down" : "right"}`}
                                                        style={{ fontSize: 11 }}
                                                    />
                                                </td>
                                                <td
                                                    style={{
                                                        ...tdBase,
                                                        color: "#0f172a",
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: 6,
                                                        }}
                                                    >
                                                        <i
                                                            className="bi bi-layers-fill"
                                                            style={{ fontSize: 11 }}
                                                        />
                                                        {jg.display}
                                                        <span
                                                            style={{
                                                                fontWeight: 600,
                                                                color: T.slate,
                                                                fontSize: 10,
                                                            }}
                                                        >
                                                            ({jg.totals.count} sekolah)
                                                        </span>
                                                    </span>
                                                </td>
                                                {metricCells(jg.totals, {
                                                    bold: true,
                                                    lastColor: color,
                                                })}
                                            </tr>
                                            {jOpen &&
                                                (groupByCabang
                                                    ? (
                                                          cabangByJenjang[
                                                              jg.key
                                                          ] || []
                                                      ).map((cab) => {
                                                          const cabOpen =
                                                              expandedCabang.has(
                                                                  cab.key,
                                                              );
                                                          return (
                                                              <React.Fragment
                                                                  key={cab.key}
                                                              >
                                                                  <tr
                                                                      onClick={() =>
                                                                          toggleCabang(
                                                                              cab.key,
                                                                          )
                                                                      }
                                                                      title={
                                                                          cabOpen
                                                                              ? "Klik untuk sembunyikan"
                                                                              : "Klik untuk load Kota/Kab"
                                                                      }
                                                                      style={{
                                                                          background:
                                                                              cabOpen
                                                                                  ? "#bfdbfe"
                                                                                  : "#dbeafe",
                                                                          borderBottom: `1px solid ${T.border}`,
                                                                          cursor: "pointer",
                                                                      }}
                                                                  >
                                                                      <td
                                                                          style={{
                                                                              ...tdBase,
                                                                              textAlign:
                                                                                  "center",
                                                                              color: T.blue,
                                                                              fontWeight: 800,
                                                                          }}
                                                                      >
                                                                          <i
                                                                              className={`bi bi-chevron-${cabOpen ? "down" : "right"}`}
                                                                              style={{
                                                                                  fontSize: 11,
                                                                              }}
                                                                          />
                                                                      </td>
                                                                      <td
                                                                          style={{
                                                                              ...tdBase,
                                                                              color: "#1e3a8a",
                                                                              fontWeight: 800,
                                                                              paddingLeft: 14,
                                                                          }}
                                                                      >
                                                                          <span
                                                                              style={{
                                                                                  display:
                                                                                      "inline-flex",
                                                                                  alignItems:
                                                                                      "center",
                                                                                  gap: 6,
                                                                              }}
                                                                          >
                                                                              <i
                                                                                  className="bi bi-diagram-3"
                                                                                  style={{
                                                                                      fontSize: 11,
                                                                                  }}
                                                                              />
                                                                              {cab.display}
                                                                              <span
                                                                                  style={{
                                                                                      fontWeight: 600,
                                                                                      color: T.slate,
                                                                                      fontSize: 10,
                                                                                  }}
                                                                              >
                                                                                  (
                                                                                  {
                                                                                      cab.totals
                                                                                          .count
                                                                                  }{" "}
                                                                                  sekolah)
                                                                              </span>
                                                                          </span>
                                                                      </td>
                                                                      {metricCells(
                                                                          cab.totals,
                                                                          {
                                                                              bold: true,
                                                                              lastColor:
                                                                                  color,
                                                                          },
                                                                      )}
                                                                  </tr>
                                                                  {cabOpen &&
                                                                      renderKotaBlocks(
                                                                          kotaByParent[
                                                                              cab.key
                                                                          ] ||
                                                                              [],
                                                                          28,
                                                                          40,
                                                                          52,
                                                                      )}
                                                              </React.Fragment>
                                                          );
                                                      })
                                                    : renderKotaBlocks(
                                                          kotaByParent[
                                                              jg.key
                                                          ] || [],
                                                          14,
                                                          28,
                                                          40,
                                                      ))}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={colCount}
                                        style={{
                                            padding: "16px",
                                            textAlign: "center",
                                            color: T.slate,
                                            fontSize: 11,
                                        }}
                                    >
                                        {nameFilter.trim()
                                            ? "Tidak ada sekolah yang cocok dengan filter"
                                            : "Tidak ada data"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
