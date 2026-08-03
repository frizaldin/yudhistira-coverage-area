import React from 'react';
import { Head, router, Link } from '@inertiajs/react';
import MonitoringLayout from '@/Layouts/MonitoringLayout';

const T = {
    blue:'#1d4ed8', blueSoft:'#3b82f6', green:'#16a34a',
    orange:'#d97706', red:'#dc2626', purple:'#7c3aed',
    slate:'#64748b', text:'#0f172a', border:'#e2e8f0', card:'#ffffff',
};

const S = {
    card: { background:'#fff', borderRadius:12, boxShadow:'0 1px 6px rgba(15,23,42,.06)', border:`1px solid ${T.border}` },
    th: { fontSize:10.5, fontWeight:700, color:T.slate, padding:'9px 12px', background:'#f8fafc', borderBottom:`1px solid ${T.border}`, textTransform:'uppercase', letterSpacing:'.3px' },
    td: { fontSize:12, color:T.text, padding:'8px 12px', borderBottom:`1px solid #f4f6f8` },
};

export default function SumberDanaDetail({ activeNav, scopeName, backUrl, rows }) {
    const fmt = n => new Intl.NumberFormat('id-ID').format(n || 0);

    const totalBos = rows.reduce((s, r) => s + (Number(r.bos) || 0), 0);
    const totalSwadana = rows.reduce((s, r) => s + (Number(r.swadana) || 0), 0);
    const totalAll = totalBos + totalSwadana;

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title={`Sumber Dana - ${scopeName}`} />
            <div style={{ padding:'20px 24px', maxWidth:1000, margin:'0 auto' }}>

                <div style={{ marginBottom:20 }}>
                    <button onClick={() => router.visit(backUrl || route('monitoring.area.select'))}
                        style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:T.blueSoft, fontSize:12, fontWeight:600, padding:0 }}>
                        <i className="bi bi-arrow-left" /> Kembali ke Dashboard
                    </button>
                    <h1 style={{ fontSize:22, fontWeight:800, color:T.text, margin:'8px 0 4px' }}>
                        Detail Sumber Dana — {scopeName}
                    </h1>
                    <p style={{ fontSize:12, color:T.slate, margin:0 }}>Rincian target sekolah berdasarkan sumber dana (BOS vs Swadana) per Sales</p>
                </div>

                <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                    <div style={{ ...S.card, padding:'14px 18px', flex:1, minWidth:140 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                            <div style={{ width:8, height:8, borderRadius:2, background:T.blue }} />
                            <span style={{ fontSize:11, fontWeight:700, color:T.blue }}>BOS</span>
                        </div>
                        <div style={{ fontSize:18, fontWeight:800, color:T.text }}>{fmt(totalBos)}</div>
                        <div style={{ fontSize:10, color:T.slate }}>Sekolah (Target)</div>
                    </div>
                    <div style={{ ...S.card, padding:'14px 18px', flex:1, minWidth:140 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                            <div style={{ width:8, height:8, borderRadius:2, background:'#93c5fd' }} />
                            <span style={{ fontSize:11, fontWeight:700, color:'#3b82f6' }}>SWADANA</span>
                        </div>
                        <div style={{ fontSize:18, fontWeight:800, color:T.text }}>{fmt(totalSwadana)}</div>
                        <div style={{ fontSize:10, color:T.slate }}>Sekolah (Target)</div>
                    </div>
                    <div style={{ ...S.card, padding:'14px 18px', flex:1, minWidth:140, borderLeft:`3px solid ${T.green}` }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.green, marginBottom:6 }}>GRAND TOTAL</div>
                        <div style={{ fontSize:18, fontWeight:800, color:T.text }}>{fmt(totalAll)}</div>
                        <div style={{ fontSize:10, color:T.slate }}>Total Sekolah (Target)</div>
                    </div>
                </div>

                <div style={{ ...S.card, overflow:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
                        <thead>
                            <tr>
                                <th style={{ ...S.th, textAlign:'center', width: 40 }}>No</th>
                                <th style={{ ...S.th, textAlign:'left' }}>Sales</th>
                                <th style={{ ...S.th, textAlign:'right' }}>Negeri (BOS)</th>
                                <th style={{ ...S.th, textAlign:'right' }}>Swasta (Swadana)</th>
                                <th style={{ ...S.th, textAlign:'right', color:T.blue }}>Total Target</th>
                                <th style={{ ...S.th, textAlign:'center', width: 80 }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                                    <td style={{ ...S.td, textAlign:'center', color:T.slate }}>{i + 1}</td>
                                    <td style={{ ...S.td, fontWeight:700 }}>{r.sales}</td>
                                    <td style={{ ...S.td, textAlign:'right', fontWeight:600 }}>
                                        {fmt(r.bos)}
                                    </td>
                                    <td style={{ ...S.td, textAlign:'right', fontWeight:600 }}>
                                        {fmt(r.swadana)}
                                    </td>
                                    <td style={{ ...S.td, textAlign:'right', fontWeight:800, color:T.blue }}>
                                        {fmt(r.total)}
                                    </td>
                                    <td style={{ ...S.td, textAlign:'center' }}>
                                        <Link href={`${window.location.pathname}/${r.sales_id}`} style={{ padding:'4px 10px', background:T.blueSoft, color:'white', borderRadius:6, textDecoration:'none', fontSize:11, fontWeight:600 }}>
                                            Detail
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ ...S.td, textAlign: 'center', color: T.slate, padding: '20px' }}>
                                        Tidak ada data.
                                    </td>
                                </tr>
                            )}
                            <tr style={{ background:'#f0f7ff', borderTop:`2px solid ${T.blue}` }}>
                                <td colSpan={2} style={{ ...S.td, fontWeight:800, color:T.blue, textAlign: 'right' }}>GRAND TOTAL</td>
                                <td style={{ ...S.td, textAlign:'right', fontWeight:800, color:T.blue }}>
                                    {fmt(totalBos)}
                                </td>
                                <td style={{ ...S.td, textAlign:'right', fontWeight:800, color:T.blue }}>
                                    {fmt(totalSwadana)}
                                </td>
                                <td style={{ ...S.td, textAlign:'right', fontWeight:800, color:T.blue }}>
                                    {fmt(totalAll)}
                                </td>
                                <td style={{ ...S.td }}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </MonitoringLayout>
    );
}
