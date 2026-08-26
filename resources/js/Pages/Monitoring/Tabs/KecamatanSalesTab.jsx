import React, { useMemo, useState } from "react";
import {
    T, S, Card,
    stickyTableWrapStyle, stickyTableStyle,
} from "./SalesPerformanceShared";

const JENJANG_ORDER = ["SD", "SMP", "SMA", "SMK"];

/** Parse "BOGOR BARAT, KOTA BOGOR" → { base: "BOGOR BARAT", kotaKab: "KOTA BOGOR" } */
function parseKecamatanName(raw) {
    const full = String(raw || "").trim();
    if (!full) {
        return { base: "", kotaKab: "Tanpa Kota/Kab", full: "" };
    }
    const parts = full.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
        return {
            base: parts[0].toUpperCase(),
            kotaKab: parts.slice(1).join(", ").toUpperCase(),
            full,
        };
    }
    return {
        base: parts[0].toUpperCase(),
        kotaKab: null,
        full,
    };
}

/** Tab Kecamatan — dashboard Sales (duplikat mandiri dari KecamatanAreaTab). */
export default function KecamatanSalesTab(props) {
    const {
        insights,
        filters,
        isSalesDetail,
        listKecamatan = [],
        listSekolah = [],
        activeTab,
        openSekolahFromKecamatanJenjang,
        componentFilter = null,
        allowedKecamatanKeys = null,
        onClearComponentFilter,
    } = props;

    const formatNumber = (num) =>
        new Intl.NumberFormat("id-ID").format(num || 0);

    const [expandedKec, setExpandedKec] = useState(null);
    const [jenjangDetail, setJenjangDetail] = useState(null); // { kecKey, label, jenjang }
    const [sort, setSort] = useState({
        key: "real_exemplar",
        dir: "desc",
    });

    const yearLabel =
        insights?.targetYear ||
        filters?.tahun ||
        new Date().getFullYear();

    const toggleSort = (key) => {
        setSort((prev) =>
            prev.key === key
                ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
                : {
                      key,
                      dir: key === "display_name" ? "asc" : "desc",
                  },
        );
    };

    const sortMark = (key) => {
        if (sort.key !== key) return "";
        return sort.dir === "asc" ? " ↑" : " ↓";
    };

    const sortableTh = (label, key, align = "right") => (
        <th
            onClick={() => toggleSort(key)}
            title="Klik untuk sortir"
            style={{
                ...S.th,
                textAlign: align,
                cursor: "pointer",
                userSelect: "none",
                color: sort.key === key ? T.blue : T.slate,
            }}
        >
            {label}
            {sortMark(key)}
        </th>
    );

    // Agregasi dari seluruh sekolah cabang (bukan hanya area cover)
    const schoolSiswa = (s) => {
        if (s.jumlah_siswa_current != null) return Number(s.jumlah_siswa_current) || 0;
        if (s.has_year_plan === false) return 0;
        return Number(s.total_student) || 0;
    };

    const mergedKecamatan = useMemo(() => {
        const map = {};

        const ensure = (rawName) => {
            const parsed = parseKecamatanName(rawName || "");
            const key = parsed.base || parsed.full || "(TANPA NAMA)";
            if (!map[key]) {
                map[key] = {
                    key,
                    display_name: parsed.base || key,
                    kotaKab: parsed.kotaKab,
                    aliases: [],
                    sekolah_aktif: 0,
                    sekolah_realisasi: 0,
                    potensi_siswa: 0,
                    potensi: 0,
                    sp_exemplar: 0,
                    real_exemplar: 0,
                    total_sekolah: 0,
                };
            }
            const row = map[key];
            if (parsed.kotaKab && !row.kotaKab) row.kotaKab = parsed.kotaKab;
            if (parsed.full) row.aliases.push(parsed.full);
            return row;
        };

        // Sumber utama: seluruh sekolah di cabang
        (listSekolah || []).forEach((s) => {
            const row = ensure(s.kecamatan_name || "");
            row.total_sekolah += 1;
            if (s.is_active) row.sekolah_aktif += 1;
            if ((Number(s.real_exemplar_current) || 0) > 0) {
                row.sekolah_realisasi += 1;
            }
            row.potensi_siswa += schoolSiswa(s);
            row.potensi += Number(s.potential_exemplar_current) || 0;
            row.sp_exemplar += Number(s.sp_exemplar_current) || 0;
            row.real_exemplar += Number(s.real_exemplar_current) || 0;
        });

        // Lengkapi kota/kab dari listKecamatan bila belum ada di listSekolah
        (listKecamatan || []).forEach((curr) => {
            const row = ensure(curr.kecamatan_name || curr.kecamatan || "");
            if (!row.kotaKab) {
                const parsed = parseKecamatanName(
                    curr.kecamatan_name || curr.kecamatan || "",
                );
                if (parsed.kotaKab) row.kotaKab = parsed.kotaKab;
            }
            // Jika kecamatan belum punya sekolah di listSekolah, pakai metrik backend
            if (row.total_sekolah === 0) {
                row.total_sekolah += Number(curr.total_sekolah) || 0;
                row.sekolah_aktif += Number(curr.sekolah_aktif) || 0;
                row.sekolah_realisasi += Number(curr.sekolah_realisasi) || 0;
                row.potensi_siswa += Number(curr.potensi_siswa) || 0;
                row.potensi += Number(curr.potensi) || 0;
                row.sp_exemplar += Number(curr.sp_exemplar) || 0;
                row.real_exemplar += Number(curr.real_exemplar) || 0;
            }
        });

        return Object.values(map)
            .filter((r) => (Number(r.sekolah_aktif) || 0) > 0)
            .filter((r) => {
                if (!allowedKecamatanKeys) return true;
                const key = String(r.display_name || r.kecamatan || "")
                    .split(",")[0]
                    .trim()
                    .toUpperCase();
                // juga cek aliases
                if (allowedKecamatanKeys.has(key)) return true;
                return (r.aliases || []).some((a) =>
                    allowedKecamatanKeys.has(
                        String(a).split(",")[0].trim().toUpperCase(),
                    ),
                );
            })
            .map((r) => ({
                ...r,
                kotaKab: r.kotaKab || "Tanpa Kota/Kab",
                aliases: Array.from(new Set(r.aliases)),
            }));
    }, [listKecamatan, listSekolah, allowedKecamatanKeys]);

    const jenjangByKecamatan = useMemo(() => {
        const map = {};
        (listSekolah || []).forEach((s) => {
            const parsed = parseKecamatanName(s.kecamatan_name || "");
            const kecKey = parsed.base || parsed.full || "";
            const j =
                String(s.jenjang || "Lainnya").toUpperCase().trim() ||
                "Lainnya";
            if (!map[kecKey]) map[kecKey] = {};
            if (!map[kecKey][j]) {
                map[kecKey][j] = {
                    jenjang: j,
                    total_sekolah: 0,
                    area_cover: 0,
                    sekolah_realisasi: 0,
                    potensi_siswa: 0,
                    potensi: 0,
                    sp_exemplar: 0,
                    real_exemplar: 0,
                };
            }
            const row = map[kecKey][j];
            row.total_sekolah += 1;
            if (s.is_active) row.area_cover += 1;
            if ((Number(s.real_exemplar_current) || 0) > 0) {
                row.sekolah_realisasi += 1;
            }
            row.potensi_siswa += schoolSiswa(s);
            row.potensi += Number(s.potential_exemplar_current) || 0;
            row.sp_exemplar += Number(s.sp_exemplar_current) || 0;
            row.real_exemplar += Number(s.real_exemplar_current) || 0;
        });

        const sorted = {};
        Object.keys(map).forEach((kec) => {
            sorted[kec] = Object.values(map[kec]).sort((a, b) => {
                const ia = JENJANG_ORDER.indexOf(a.jenjang);
                const ib = JENJANG_ORDER.indexOf(b.jenjang);
                const oa = ia === -1 ? 99 : ia;
                const ob = ib === -1 ? 99 : ib;
                if (oa !== ob) return oa - ob;
                return a.jenjang.localeCompare(b.jenjang);
            });
        });
        return sorted;
    }, [listSekolah]);

    const groupedByKotaKab = useMemo(() => {
        const groups = mergedKecamatan.reduce((acc, curr) => {
            const kotaKab = curr.kotaKab || "Tanpa Kota/Kab";
            if (!acc[kotaKab]) acc[kotaKab] = [];
            acc[kotaKab].push(curr);
            return acc;
        }, {});

        const dir = sort.dir === "asc" ? 1 : -1;
        const key = sort.key;
        const cmp = (a, b) => {
            if (key === "display_name") {
                return (
                    String(a.display_name || "").localeCompare(
                        String(b.display_name || ""),
                        "id",
                        { sensitivity: "base" },
                    ) * dir
                );
            }
            const av = Number(a[key]) || 0;
            const bv = Number(b[key]) || 0;
            if (av === bv) {
                return String(a.display_name || "").localeCompare(
                    String(b.display_name || ""),
                    "id",
                    { sensitivity: "base" },
                );
            }
            return (av - bv) * dir;
        };

        Object.keys(groups).forEach((kotaKab) => {
            groups[kotaKab].sort(cmp);
        });

        // Urutkan grup kota/kab by aggregate of active sort key (desc default for numbers)
        const groupEntries = Object.entries(groups).sort(([nameA, itemsA], [nameB, itemsB]) => {
            if (key === "display_name") {
                return nameA.localeCompare(nameB, "id") * dir;
            }
            const sum = (items) =>
                items.reduce((s, r) => s + (Number(r[key]) || 0), 0);
            const av = sum(itemsA);
            const bv = sum(itemsB);
            if (av === bv) return nameA.localeCompare(nameB, "id");
            return (av - bv) * dir;
        });

        return Object.fromEntries(groupEntries);
    }, [mergedKecamatan, sort]);

    const toggleKec = (kecName) => {
        setExpandedKec((prev) => {
            const next = prev === kecName ? null : kecName;
            if (next !== jenjangDetail?.kecKey) setJenjangDetail(null);
            return next;
        });
    };

    const handleJenjangClick = (e, kecamatan, jenjang, kecKey) => {
        e.stopPropagation();
        if (typeof openSekolahFromKecamatanJenjang === "function") {
            openSekolahFromKecamatanJenjang(kecamatan, jenjang);
            return;
        }
        const key = String(kecKey || kecamatan || "").trim();
        const j = String(jenjang || "").trim().toUpperCase();
        setJenjangDetail((prev) =>
            prev && prev.kecKey === key && prev.jenjang === j
                ? null
                : { kecKey: key, label: kecamatan || key, jenjang: j },
        );
    };

    const handleSubtotalClick = (e, kecamatan) => {
        e.stopPropagation();
        if (typeof openSekolahFromKecamatanJenjang === "function") {
            openSekolahFromKecamatanJenjang(kecamatan, "");
        }
    };

    const detailSchools = useMemo(() => {
        if (!jenjangDetail) return [];
        return (listSekolah || [])
            .filter((s) => {
                const parsed = parseKecamatanName(s.kecamatan_name || "");
                const key = parsed.base || parsed.full || "";
                const j =
                    String(s.jenjang || "Lainnya").toUpperCase().trim() ||
                    "Lainnya";
                return (
                    key === jenjangDetail.kecKey && j === jenjangDetail.jenjang
                );
            })
            .sort((a, b) =>
                String(a.name || "").localeCompare(String(b.name || ""), "id"),
            );
    }, [jenjangDetail, listSekolah]);

    return (
        <>
            {activeTab === "kecamatan" && isSalesDetail && (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                    }}
                >
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Card
                        title="Daftar Kecamatan"
                        sub="Metrik dari Area Cover · Klik baris kecamatan untuk breakdown · Klik Subtotal untuk buka tab Sekolah (filter kecamatan) · Klik jenjang untuk filter jenjang"
                        style={{ flex: 1, minWidth: 300 }}
                        noPad
                        headerAction={
                            componentFilter ? (
                                <div
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: T.blue,
                                        background: "#eff6ff",
                                        border: "1px solid #bfdbfe",
                                        borderRadius: 6,
                                        padding: "3px 8px",
                                    }}
                                >
                                    Filter: {componentFilter.label}
                                    {typeof onClearComponentFilter ===
                                        "function" && (
                                        <button
                                            type="button"
                                            onClick={onClearComponentFilter}
                                            style={{
                                                border: "none",
                                                background: "transparent",
                                                color: T.blue,
                                                cursor: "pointer",
                                                fontWeight: 800,
                                                padding: 0,
                                                fontSize: 12,
                                            }}
                                            title="Hapus filter"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ) : null
                        }
                    >
                        <div style={stickyTableWrapStyle}>
                            <table
                                style={stickyTableStyle}
                            >
                                <thead>
                                    <tr>
                                        <th
                                            style={{
                                                ...S.th,
                                                width: 40,
                                                textAlign: "center",
                                            }}
                                        >
                                            No
                                        </th>
                                        {sortableTh(
                                            "Nama Kecamatan",
                                            "display_name",
                                            "left",
                                        )}
                                        {sortableTh(
                                            "Jumlah Siswa",
                                            "potensi_siswa",
                                        )}
                                        {sortableTh("Potensi", "potensi")}
                                        {sortableTh(
                                            "Area Cover",
                                            "sekolah_aktif",
                                        )}
                                        {sortableTh(
                                            "Realisasi",
                                            "sekolah_realisasi",
                                        )}
                                        {sortableTh(
                                            `SP ${yearLabel}`,
                                            "sp_exemplar",
                                        )}
                                        {sortableTh(
                                            `Eksemplar ${yearLabel}`,
                                            "real_exemplar",
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {mergedKecamatan.length > 0 ? (
                                        Object.entries(groupedByKotaKab).map(
                                            ([kotaKabName, items]) => (
                                                <React.Fragment key={kotaKabName}>
                                                    <tr
                                                        style={{
                                                            backgroundColor: `${T.blueSoft}10`,
                                                        }}
                                                    >
                                                        <td
                                                            colSpan="8"
                                                            style={{
                                                                ...S.td,
                                                                fontWeight: 700,
                                                                color: T.blue,
                                                                paddingLeft: 16,
                                                            }}
                                                        >
                                                            {kotaKabName}
                                                        </td>
                                                    </tr>
                                                    {items.map((k, i) => {
                                                        const kecKey = k.key;
                                                        const isOpen =
                                                            expandedKec ===
                                                            kecKey;
                                                        const jenjangRows =
                                                            jenjangByKecamatan[
                                                                kecKey
                                                            ] || [];

                                                        return (
                                                            <React.Fragment
                                                                key={kecKey}
                                                            >
                                                                <tr
                                                                    className="table-row-hover"
                                                                    onClick={() =>
                                                                        toggleKec(
                                                                            kecKey,
                                                                        )
                                                                    }
                                                                    style={{
                                                                        cursor: "pointer",
                                                                        background:
                                                                            isOpen
                                                                                ? "#dbeafe"
                                                                                : "transparent",
                                                                        boxShadow:
                                                                            isOpen
                                                                                ? "inset 3px 0 0 #2563eb"
                                                                                : "none",
                                                                    }}
                                                                >
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            textAlign:
                                                                                "center",
                                                                            color: T.slate,
                                                                        }}
                                                                    >
                                                                        {i + 1}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            fontWeight: 700,
                                                                        }}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                display:
                                                                                    "inline-flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                gap: 8,
                                                                            }}
                                                                        >
                                                                            <i
                                                                                className={`bi bi-chevron-${isOpen ? "down" : "right"}`}
                                                                                style={{
                                                                                    fontSize: 11,
                                                                                    color: isOpen
                                                                                        ? "#2563eb"
                                                                                        : T.slate,
                                                                                }}
                                                                            />
                                                                            <span
                                                                                style={{
                                                                                    color: isOpen
                                                                                        ? "#1e40af"
                                                                                        : T.text,
                                                                                }}
                                                                            >
                                                                                {k.display_name ||
                                                                                    "- (Tidak Ada Data Kecamatan)"}
                                                                            </span>
                                                                        </span>
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            textAlign:
                                                                                "right",
                                                                            fontWeight: isOpen
                                                                                ? 400
                                                                                : 800,
                                                                            color: isOpen
                                                                                ? "transparent"
                                                                                : T.text,
                                                                        }}
                                                                    >
                                                                        {isOpen
                                                                            ? ""
                                                                            : formatNumber(
                                                                                  k.potensi_siswa,
                                                                              )}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            textAlign:
                                                                                "right",
                                                                            fontWeight: isOpen
                                                                                ? 400
                                                                                : 700,
                                                                            color: isOpen
                                                                                ? "transparent"
                                                                                : "#059669",
                                                                        }}
                                                                    >
                                                                        {isOpen
                                                                            ? ""
                                                                            : formatNumber(
                                                                                  k.potensi,
                                                                              )}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            textAlign:
                                                                                "right",
                                                                            fontWeight: isOpen
                                                                                ? 400
                                                                                : 600,
                                                                            color: isOpen
                                                                                ? "transparent"
                                                                                : T.green,
                                                                        }}
                                                                    >
                                                                        {isOpen
                                                                            ? ""
                                                                            : formatNumber(
                                                                                  k.sekolah_aktif,
                                                                              )}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            textAlign:
                                                                                "right",
                                                                            fontWeight: isOpen
                                                                                ? 400
                                                                                : 700,
                                                                            color: isOpen
                                                                                ? "transparent"
                                                                                : "#0f172a",
                                                                        }}
                                                                    >
                                                                        {isOpen
                                                                            ? ""
                                                                            : formatNumber(
                                                                                  k.sekolah_realisasi,
                                                                              )}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            textAlign:
                                                                                "right",
                                                                            fontWeight: isOpen
                                                                                ? 400
                                                                                : 700,
                                                                            color: isOpen
                                                                                ? "transparent"
                                                                                : "#7c3aed",
                                                                        }}
                                                                    >
                                                                        {isOpen
                                                                            ? ""
                                                                            : formatNumber(
                                                                                  k.sp_exemplar,
                                                                              )}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            ...S.td,
                                                                            textAlign:
                                                                                "right",
                                                                            fontWeight: isOpen
                                                                                ? 400
                                                                                : 700,
                                                                            color: isOpen
                                                                                ? "transparent"
                                                                                : "#2563eb",
                                                                        }}
                                                                    >
                                                                        {isOpen
                                                                            ? ""
                                                                            : formatNumber(
                                                                                  k.real_exemplar,
                                                                              )}
                                                                    </td>
                                                                </tr>

                                                                {isOpen && (
                                                                    <>
                                                                        <tr
                                                                            onClick={(e) =>
                                                                                handleSubtotalClick(
                                                                                    e,
                                                                                    k.display_name ||
                                                                                        kecKey,
                                                                                )
                                                                            }
                                                                            title={`Buka tab Sekolah: filter kecamatan ${k.display_name || kecKey}`}
                                                                            style={{
                                                                                background:
                                                                                    "#dbeafe",
                                                                                boxShadow:
                                                                                    "inset 3px 0 0 #1d4ed8",
                                                                                cursor: "pointer",
                                                                            }}
                                                                            className="table-row-hover"
                                                                        >
                                                                            <td
                                                                                style={{
                                                                                    ...S.td,
                                                                                    padding:
                                                                                        "7px 8px",
                                                                                    textAlign:
                                                                                        "center",
                                                                                    color: "#1d4ed8",
                                                                                    fontSize: 10,
                                                                                    fontWeight: 700,
                                                                                }}
                                                                            >
                                                                                Σ
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    ...S.td,
                                                                                    padding:
                                                                                        "7px 8px 7px 28px",
                                                                                    fontWeight: 800,
                                                                                    color: "#1e3a8a",
                                                                                    textDecoration:
                                                                                        "underline",
                                                                                    textUnderlineOffset: 2,
                                                                                }}
                                                                            >
                                                                                Subtotal
                                                                                <span
                                                                                    style={{
                                                                                        marginLeft: 6,
                                                                                        fontWeight: 600,
                                                                                        color: T.slate,
                                                                                        textDecoration:
                                                                                            "none",
                                                                                        fontSize: 10,
                                                                                    }}
                                                                                >
                                                                                    (klik → tab Sekolah)
                                                                                </span>
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    ...S.td,
                                                                                    padding:
                                                                                        "7px 8px",
                                                                                    textAlign:
                                                                                        "right",
                                                                                    fontWeight: 800,
                                                                                }}
                                                                            >
                                                                                {formatNumber(
                                                                                    k.potensi_siswa,
                                                                                )}
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    ...S.td,
                                                                                    padding:
                                                                                        "7px 8px",
                                                                                    textAlign:
                                                                                        "right",
                                                                                    fontWeight: 800,
                                                                                    color: "#059669",
                                                                                }}
                                                                            >
                                                                                {formatNumber(
                                                                                    k.potensi,
                                                                                )}
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    ...S.td,
                                                                                    padding:
                                                                                        "7px 8px",
                                                                                    textAlign:
                                                                                        "right",
                                                                                    fontWeight: 800,
                                                                                    color: T.green,
                                                                                }}
                                                                            >
                                                                                {formatNumber(
                                                                                    k.sekolah_aktif,
                                                                                )}
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    ...S.td,
                                                                                    padding:
                                                                                        "7px 8px",
                                                                                    textAlign:
                                                                                        "right",
                                                                                    fontWeight: 800,
                                                                                }}
                                                                            >
                                                                                {formatNumber(
                                                                                    k.sekolah_realisasi,
                                                                                )}
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    ...S.td,
                                                                                    padding:
                                                                                        "7px 8px",
                                                                                    textAlign:
                                                                                        "right",
                                                                                    fontWeight: 800,
                                                                                    color: "#7c3aed",
                                                                                }}
                                                                            >
                                                                                {formatNumber(
                                                                                    k.sp_exemplar,
                                                                                )}
                                                                            </td>
                                                                            <td
                                                                                style={{
                                                                                    ...S.td,
                                                                                    padding:
                                                                                        "7px 8px",
                                                                                    textAlign:
                                                                                        "right",
                                                                                    fontWeight: 800,
                                                                                    color: "#2563eb",
                                                                                }}
                                                                            >
                                                                                {formatNumber(
                                                                                    k.real_exemplar,
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                        {jenjangRows.length >
                                                                        0 ? (
                                                                            jenjangRows.map(
                                                                                (
                                                                                    j,
                                                                                ) => {
                                                                                    const isJenjangOpen =
                                                                                        jenjangDetail?.kecKey ===
                                                                                            kecKey &&
                                                                                        jenjangDetail?.jenjang ===
                                                                                            j.jenjang;
                                                                                    const showInlineSchools =
                                                                                        isJenjangOpen &&
                                                                                        typeof openSekolahFromKecamatanJenjang !==
                                                                                            "function";

                                                                                    return (
                                                                                        <React.Fragment
                                                                                            key={`${kecKey}-${j.jenjang}`}
                                                                                        >
                                                                                            <tr
                                                                                                onClick={(e) =>
                                                                                                    handleJenjangClick(
                                                                                                        e,
                                                                                                        k.display_name ||
                                                                                                            kecKey,
                                                                                                        j.jenjang,
                                                                                                        kecKey,
                                                                                                    )
                                                                                                }
                                                                                                title={`Buka tab Sekolah: ${j.jenjang} di ${k.display_name || kecKey}`}
                                                                                                style={{
                                                                                                    background:
                                                                                                        isJenjangOpen
                                                                                                            ? "#bfdbfe"
                                                                                                            : "#eff6ff",
                                                                                                    boxShadow:
                                                                                                        "inset 3px 0 0 #2563eb",
                                                                                                    cursor: "pointer",
                                                                                                }}
                                                                                                className="table-row-hover"
                                                                                            >
                                                                                                <td
                                                                                                    style={{
                                                                                                        ...S.td,
                                                                                                        padding:
                                                                                                            "6px 8px",
                                                                                                        textAlign:
                                                                                                            "center",
                                                                                                        color: "#1d4ed8",
                                                                                                        fontSize: 10,
                                                                                                    }}
                                                                                                >
                                                                                                    {isJenjangOpen
                                                                                                        ? "▾"
                                                                                                        : "▸"}
                                                                                                </td>
                                                                                                <td
                                                                                                    style={{
                                                                                                        ...S.td,
                                                                                                        padding:
                                                                                                            "6px 8px 6px 28px",
                                                                                                        fontWeight: 700,
                                                                                                        color: "#1d4ed8",
                                                                                                        textDecoration:
                                                                                                            "underline",
                                                                                                        textUnderlineOffset: 2,
                                                                                                    }}
                                                                                                >
                                                                                                    {j.jenjang}
                                                                                                    <span
                                                                                                        style={{
                                                                                                            marginLeft: 6,
                                                                                                            fontWeight: 600,
                                                                                                            color: T.slate,
                                                                                                            textDecoration:
                                                                                                                "none",
                                                                                                            fontSize:
                                                                                                                "inherit",
                                                                                                        }}
                                                                                                    >
                                                                                                        ({formatNumber(
                                                                                                            j.area_cover,
                                                                                                        )}{" "}
                                                                                                        AC)
                                                                                                    </span>
                                                                                                </td>
                                                                                                <td
                                                                                                    style={{
                                                                                                        ...S.td,
                                                                                                        padding:
                                                                                                            "6px 8px",
                                                                                                        textAlign:
                                                                                                            "right",
                                                                                                        fontWeight: 600,
                                                                                                    }}
                                                                                                >
                                                                                                    {formatNumber(
                                                                                                        j.potensi_siswa,
                                                                                                    )}
                                                                                                </td>
                                                                                                <td
                                                                                                    style={{
                                                                                                        ...S.td,
                                                                                                        padding:
                                                                                                            "6px 8px",
                                                                                                        textAlign:
                                                                                                            "right",
                                                                                                        fontWeight: 700,
                                                                                                        color: "#059669",
                                                                                                    }}
                                                                                                >
                                                                                                    {formatNumber(
                                                                                                        j.potensi,
                                                                                                    )}
                                                                                                </td>
                                                                                                <td
                                                                                                    style={{
                                                                                                        ...S.td,
                                                                                                        padding:
                                                                                                            "6px 8px",
                                                                                                        textAlign:
                                                                                                            "right",
                                                                                                        color: T.green,
                                                                                                        fontWeight: 600,
                                                                                                    }}
                                                                                                >
                                                                                                    {formatNumber(
                                                                                                        j.area_cover,
                                                                                                    )}
                                                                                                </td>
                                                                                                <td
                                                                                                    style={{
                                                                                                        ...S.td,
                                                                                                        padding:
                                                                                                            "6px 8px",
                                                                                                        textAlign:
                                                                                                            "right",
                                                                                                        fontWeight: 700,
                                                                                                        color: "#0f172a",
                                                                                                    }}
                                                                                                >
                                                                                                    {formatNumber(
                                                                                                        j.sekolah_realisasi,
                                                                                                    )}
                                                                                                </td>
                                                                                                <td
                                                                                                    style={{
                                                                                                        ...S.td,
                                                                                                        padding:
                                                                                                            "6px 8px",
                                                                                                        textAlign:
                                                                                                            "right",
                                                                                                        fontWeight: 700,
                                                                                                        color: "#7c3aed",
                                                                                                    }}
                                                                                                >
                                                                                                    {formatNumber(
                                                                                                        j.sp_exemplar,
                                                                                                    )}
                                                                                                </td>
                                                                                                <td
                                                                                                    style={{
                                                                                                        ...S.td,
                                                                                                        padding:
                                                                                                            "6px 8px",
                                                                                                        textAlign:
                                                                                                            "right",
                                                                                                        fontWeight: 700,
                                                                                                        color: "#2563eb",
                                                                                                    }}
                                                                                                >
                                                                                                    {formatNumber(
                                                                                                        j.real_exemplar,
                                                                                                    )}
                                                                                                </td>
                                                                                            </tr>
                                                                                            {showInlineSchools && (
                                                                                                <tr
                                                                                                    style={{
                                                                                                        background:
                                                                                                            "#f8fafc",
                                                                                                    }}
                                                                                                >
                                                                                                    <td
                                                                                                        colSpan={8}
                                                                                                        style={{
                                                                                                            padding:
                                                                                                                "8px 12px 12px 36px",
                                                                                                        }}
                                                                                                    >
                                                                                                        <div
                                                                                                            style={{
                                                                                                                fontSize: 10,
                                                                                                                fontWeight: 700,
                                                                                                                color: T.slate,
                                                                                                                marginBottom: 6,
                                                                                                            }}
                                                                                                        >
                                                                                                            {detailSchools.length}{" "}
                                                                                                            sekolah{" "}
                                                                                                            {j.jenjang} di{" "}
                                                                                                            {k.display_name ||
                                                                                                                kecKey}
                                                                                                        </div>
                                                                                                        <div
                                                                                                            style={{
                                                                                                                overflowX:
                                                                                                                    "auto",
                                                                                                                border: `1px solid ${T.border}`,
                                                                                                                borderRadius: 6,
                                                                                                                background:
                                                                                                                    "#fff",
                                                                                                            }}
                                                                                                        >
                                                                                                            <table
                                                                                                                style={{
                                                                                                                    width: "100%",
                                                                                                                    borderCollapse:
                                                                                                                        "collapse",
                                                                                                                }}
                                                                                                            >
                                                                                                                <thead>
                                                                                                                    <tr>
                                                                                                                        <th
                                                                                                                            style={{
                                                                                                                                ...S.th,
                                                                                                                                width: 36,
                                                                                                                                textAlign:
                                                                                                                                    "center",
                                                                                                                            }}
                                                                                                                        >
                                                                                                                            No
                                                                                                                        </th>
                                                                                                                        <th
                                                                                                                            style={{
                                                                                                                                ...S.th,
                                                                                                                                textAlign:
                                                                                                                                    "left",
                                                                                                                            }}
                                                                                                                        >
                                                                                                                            Nama Sekolah
                                                                                                                        </th>
                                                                                                                        <th
                                                                                                                            style={{
                                                                                                                                ...S.th,
                                                                                                                                textAlign:
                                                                                                                                    "right",
                                                                                                                            }}
                                                                                                                        >
                                                                                                                            Siswa
                                                                                                                        </th>
                                                                                                                        <th
                                                                                                                            style={{
                                                                                                                                ...S.th,
                                                                                                                                textAlign:
                                                                                                                                    "right",
                                                                                                                            }}
                                                                                                                        >
                                                                                                                            Potensi
                                                                                                                        </th>
                                                                                                                        <th
                                                                                                                            style={{
                                                                                                                                ...S.th,
                                                                                                                                textAlign:
                                                                                                                                    "right",
                                                                                                                            }}
                                                                                                                        >
                                                                                                                            SP{" "}
                                                                                                                            {yearLabel}
                                                                                                                        </th>
                                                                                                                        <th
                                                                                                                            style={{
                                                                                                                                ...S.th,
                                                                                                                                textAlign:
                                                                                                                                    "right",
                                                                                                                            }}
                                                                                                                        >
                                                                                                                            Realisasi{" "}
                                                                                                                            {yearLabel}
                                                                                                                        </th>
                                                                                                                        <th
                                                                                                                            style={{
                                                                                                                                ...S.th,
                                                                                                                                textAlign:
                                                                                                                                    "center",
                                                                                                                            }}
                                                                                                                        >
                                                                                                                            AC
                                                                                                                        </th>
                                                                                                                    </tr>
                                                                                                                </thead>
                                                                                                                <tbody>
                                                                                                                    {detailSchools.length >
                                                                                                                    0 ? (
                                                                                                                        detailSchools.map(
                                                                                                                            (
                                                                                                                                s,
                                                                                                                                idx,
                                                                                                                            ) => (
                                                                                                                                <tr
                                                                                                                                    key={
                                                                                                                                        s.id ||
                                                                                                                                        `${s.name}-${idx}`
                                                                                                                                    }
                                                                                                                                >
                                                                                                                                    <td
                                                                                                                                        style={{
                                                                                                                                            ...S.td,
                                                                                                                                            textAlign:
                                                                                                                                                "center",
                                                                                                                                            color: T.slate,
                                                                                                                                        }}
                                                                                                                                    >
                                                                                                                                        {idx +
                                                                                                                                            1}
                                                                                                                                    </td>
                                                                                                                                    <td
                                                                                                                                        style={{
                                                                                                                                            ...S.td,
                                                                                                                                            fontWeight: 700,
                                                                                                                                        }}
                                                                                                                                    >
                                                                                                                                        {
                                                                                                                                            s.name
                                                                                                                                        }
                                                                                                                                    </td>
                                                                                                                                    <td
                                                                                                                                        style={{
                                                                                                                                            ...S.td,
                                                                                                                                            textAlign:
                                                                                                                                                "right",
                                                                                                                                        }}
                                                                                                                                    >
                                                                                                                                        {formatNumber(
                                                                                                                                            schoolSiswa(
                                                                                                                                                s,
                                                                                                                                            ),
                                                                                                                                        )}
                                                                                                                                    </td>
                                                                                                                                    <td
                                                                                                                                        style={{
                                                                                                                                            ...S.td,
                                                                                                                                            textAlign:
                                                                                                                                                "right",
                                                                                                                                            fontWeight: 700,
                                                                                                                                            color: "#059669",
                                                                                                                                        }}
                                                                                                                                    >
                                                                                                                                        {formatNumber(
                                                                                                                                            s.potential_exemplar_current ||
                                                                                                                                                0,
                                                                                                                                        )}
                                                                                                                                    </td>
                                                                                                                                    <td
                                                                                                                                        style={{
                                                                                                                                            ...S.td,
                                                                                                                                            textAlign:
                                                                                                                                                "right",
                                                                                                                                            fontWeight: 700,
                                                                                                                                            color: "#7c3aed",
                                                                                                                                        }}
                                                                                                                                    >
                                                                                                                                        {formatNumber(
                                                                                                                                            s.sp_exemplar_current ||
                                                                                                                                                0,
                                                                                                                                        )}
                                                                                                                                    </td>
                                                                                                                                    <td
                                                                                                                                        style={{
                                                                                                                                            ...S.td,
                                                                                                                                            textAlign:
                                                                                                                                                "right",
                                                                                                                                            fontWeight: 700,
                                                                                                                                            color: T.blue,
                                                                                                                                        }}
                                                                                                                                    >
                                                                                                                                        {formatNumber(
                                                                                                                                            s.real_exemplar_current ||
                                                                                                                                                0,
                                                                                                                                        )}
                                                                                                                                    </td>
                                                                                                                                    <td
                                                                                                                                        style={{
                                                                                                                                            ...S.td,
                                                                                                                                            textAlign:
                                                                                                                                                "center",
                                                                                                                                        }}
                                                                                                                                    >
                                                                                                                                        <span
                                                                                                                                            style={{
                                                                                                                                                fontSize: 10,
                                                                                                                                                fontWeight: 700,
                                                                                                                                                color: s.is_active
                                                                                                                                                    ? "#059669"
                                                                                                                                                    : T.slate,
                                                                                                                                                background:
                                                                                                                                                    s.is_active
                                                                                                                                                        ? "#dcfce7"
                                                                                                                                                        : "#f1f5f9",
                                                                                                                                                borderRadius: 4,
                                                                                                                                                padding:
                                                                                                                                                    "2px 6px",
                                                                                                                                            }}
                                                                                                                                        >
                                                                                                                                            {s.is_active
                                                                                                                                                ? "Ya"
                                                                                                                                                : "Tidak"}
                                                                                                                                        </span>
                                                                                                                                    </td>
                                                                                                                                </tr>
                                                                                                                            ),
                                                                                                                        )
                                                                                                                    ) : (
                                                                                                                        <tr>
                                                                                                                            <td
                                                                                                                                colSpan={7}
                                                                                                                                style={{
                                                                                                                                    ...S.td,
                                                                                                                                    textAlign:
                                                                                                                                        "center",
                                                                                                                                    color: T.slate,
                                                                                                                                    padding:
                                                                                                                                        "12px 0",
                                                                                                                                }}
                                                                                                                            >
                                                                                                                                Tidak
                                                                                                                                ada
                                                                                                                                sekolah
                                                                                                                                untuk
                                                                                                                                jenjang
                                                                                                                                ini
                                                                                                                            </td>
                                                                                                                        </tr>
                                                                                                                    )}
                                                                                                                </tbody>
                                                                                                            </table>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            )}
                                                                                        </React.Fragment>
                                                                                    );
                                                                                },
                                                                            )
                                                                        ) : (
                                                                            <tr
                                                                                style={{
                                                                                    background:
                                                                                        "#eff6ff",
                                                                                }}
                                                                            >
                                                                                <td
                                                                                    colSpan="8"
                                                                                    style={{
                                                                                        ...S.td,
                                                                                        padding:
                                                                                            "8px 28px",
                                                                                        color: T.slate,
                                                                                        fontStyle:
                                                                                            "italic",
                                                                                        fontSize: 11,
                                                                                    }}
                                                                                >
                                                                                    Belum
                                                                                    ada
                                                                                    data
                                                                                    jenjang
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ),
                                        )
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="8"
                                                style={{
                                                    ...S.td,
                                                    textAlign: "center",
                                                    color: T.slate,
                                                    padding: "20px 0",
                                                }}
                                            >
                                                Tidak ada data kecamatan
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                </div>
            )}
        </>
    );
}
