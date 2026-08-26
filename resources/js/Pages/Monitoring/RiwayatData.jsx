import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import MonitoringLayout from "@/Layouts/MonitoringLayout";

const T = {
    blue: "#1d4ed8",
    green: "#16a34a",
    red: "#dc2626",
    amber: "#d97706",
    slate: "#64748b",
    text: "#0f172a",
    border: "#e2e8f0",
    card: "#ffffff",
};

function statusBadge(status) {
    const s = String(status || "success").toLowerCase();
    const map = {
        success: { bg: "#ecfdf5", color: "#047857", label: "Berhasil" },
        pending: { bg: "#fffbeb", color: "#b45309", label: "Proses" },
        failed: { bg: "#fef2f2", color: "#b91c1c", label: "Gagal" },
    };
    const m = map[s] || map.success;
    return (
        <span
            style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 700,
                background: m.bg,
                color: m.color,
            }}
        >
            {m.label}
        </span>
    );
}

export default function RiwayatData({
    activeNav = "riwayat-data",
    imports,
    lastImport = null,
}) {
    const rows = imports?.data || [];
    const links = imports?.links || [];

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title="Riwayat Data" />

            <div
                style={{
                    background: "white",
                    padding: "14px 20px",
                    borderBottom: `1px solid ${T.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                }}
            >
                <div>
                    <div
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: T.slate,
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                        }}
                    >
                        Data
                    </div>
                    <div
                        style={{
                            fontSize: 22,
                            fontWeight: 900,
                            color: T.text,
                            letterSpacing: "-0.5px",
                            lineHeight: 1.15,
                        }}
                    >
                        Riwayat Data
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: T.slate,
                            marginTop: 4,
                        }}
                    >
                        Catatan tanggal import dan nama file yang diunggah.
                    </div>
                </div>
                <Link
                    href={route("monitoring.import")}
                    style={{
                        padding: "8px 14px",
                        background: T.blue,
                        color: "#fff",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <i className="bi bi-cloud-arrow-up-fill" />
                    Ke Import
                </Link>
            </div>

            <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
                {lastImport && (
                    <div
                        style={{
                            marginBottom: 12,
                            padding: "12px 14px",
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            borderRadius: 10,
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-start",
                        }}
                    >
                        <i
                            className="bi bi-clock-history"
                            style={{ color: T.blue, fontSize: 16, marginTop: 2 }}
                        />
                        <div style={{ fontSize: 12, color: "#1e3a8a" }}>
                            <strong>Data terbaru:</strong>{" "}
                            {lastImport.imported_at_label || "-"}
                            <span style={{ color: "#64748b" }}>
                                {" "}
                                · {lastImport.file_type_label} ·{" "}
                                {lastImport.filename}
                            </span>
                        </div>
                    </div>
                )}

                <div
                    style={{
                        background: T.card,
                        border: `1px solid ${T.border}`,
                        borderRadius: 12,
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(15,23,42,0.05)",
                    }}
                >
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: 12,
                            }}
                        >
                            <thead>
                                <tr style={{ background: "#f8fafc" }}>
                                    <th style={th}>No</th>
                                    <th style={{ ...th, textAlign: "left" }}>
                                        Tanggal Import
                                    </th>
                                    <th style={{ ...th, textAlign: "left" }}>
                                        Jenis Data
                                    </th>
                                    <th style={{ ...th, textAlign: "left" }}>
                                        Nama File
                                    </th>
                                    <th style={th}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            style={{
                                                padding: 24,
                                                textAlign: "center",
                                                color: T.slate,
                                            }}
                                        >
                                            Belum ada riwayat import.
                                        </td>
                                    </tr>
                                )}
                                {rows.map((row, idx) => (
                                    <tr
                                        key={row.id}
                                        style={{
                                            borderTop: `1px solid ${T.border}`,
                                        }}
                                    >
                                        <td
                                            style={{
                                                ...td,
                                                textAlign: "center",
                                                color: T.slate,
                                            }}
                                        >
                                            {(imports.from || 1) + idx}
                                        </td>
                                        <td style={{ ...td, fontWeight: 700 }}>
                                            {row.imported_at_label || "-"}
                                        </td>
                                        <td style={td}>
                                            {row.file_type_label}
                                        </td>
                                        <td
                                            style={{
                                                ...td,
                                                fontFamily:
                                                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                                fontSize: 11,
                                                color: "#334155",
                                            }}
                                        >
                                            {row.filename || "-"}
                                        </td>
                                        <td
                                            style={{
                                                ...td,
                                                textAlign: "center",
                                            }}
                                        >
                                            {statusBadge(row.batch_status)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {imports?.last_page > 1 && (
                        <div
                            style={{
                                padding: "10px 12px",
                                borderTop: `1px solid ${T.border}`,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                                background: "#fff",
                            }}
                        >
                            <div style={{ fontSize: 11, color: T.slate }}>
                                Halaman {imports.current_page} dari{" "}
                                {imports.last_page} · {imports.total} file
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 4,
                                    flexWrap: "wrap",
                                }}
                            >
                                {links.map((link, i) => {
                                    const label = String(link.label || "")
                                        .replace(/&laquo;/g, "‹")
                                        .replace(/&raquo;/g, "›")
                                        .replace(/Previous/gi, "‹")
                                        .replace(/Next/gi, "›");
                                    const disabled = !link.url;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => {
                                                if (link.url)
                                                    router.get(
                                                        link.url,
                                                        {},
                                                        {
                                                            preserveState: true,
                                                            preserveScroll: true,
                                                        },
                                                    );
                                            }}
                                            style={{
                                                minWidth: 32,
                                                height: 28,
                                                padding: "0 8px",
                                                fontSize: 11,
                                                fontWeight: link.active
                                                    ? 800
                                                    : 600,
                                                border: `1px solid ${
                                                    link.active
                                                        ? T.blue
                                                        : T.border
                                                }`,
                                                borderRadius: 6,
                                                background: link.active
                                                    ? "#eff6ff"
                                                    : disabled
                                                      ? "#f8fafc"
                                                      : "#fff",
                                                color: link.active
                                                    ? T.blue
                                                    : disabled
                                                      ? "#94a3b8"
                                                      : T.text,
                                                cursor: disabled
                                                    ? "not-allowed"
                                                    : "pointer",
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: label,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MonitoringLayout>
    );
}

const th = {
    padding: "10px 12px",
    fontSize: 10,
    fontWeight: 700,
    color: T.slate,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    textAlign: "center",
    borderBottom: `1px solid ${T.border}`,
};

const td = {
    padding: "10px 12px",
    color: T.text,
    verticalAlign: "middle",
};
