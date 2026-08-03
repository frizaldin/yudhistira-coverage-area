import React from 'react';
import { Head, router } from '@inertiajs/react';
import MonitoringLayout from '@/Layouts/MonitoringLayout';

const T = {
    blue:'#1d4ed8', blueSoft:'#3b82f6', green:'#16a34a',
    orange:'#d97706', red:'#dc2626', purple:'#7c3aed',
    slate:'#64748b', text:'#0f172a', border:'#e2e8f0', card:'#ffffff',
};
const S = {
    card:{ background:'#fff', borderRadius:12, boxShadow:'0 1px 6px rgba(15,23,42,.06)', border:`1px solid ${T.border}` },
    th:{ fontSize:10.5, fontWeight:700, color:T.slate, padding:'9px 12px', background:'#f8fafc', borderBottom:`1px solid ${T.border}`, textTransform:'uppercase', letterSpacing:'.3px', textAlign:'left' },
    td:{ fontSize:12, color:T.text, padding:'10px 12px', borderBottom:`1px solid #f4f6f8` },
};

function Pagination({ meta, onPage }) {
    if (!meta || meta.last_page <= 1) return null;

    const current = meta.current_page;
    const last = meta.last_page;
    let pages = [];

    if (last <= 7) {
        pages = Array.from({ length: last }, (_, i) => i + 1);
    } else {
        if (current <= 4) {
            pages = [1, 2, 3, 4, 5, '...', last];
        } else if (current >= last - 3) {
            pages = [1, '...', last - 4, last - 3, last - 2, last - 1, last];
        } else {
            pages = [1, '...', current - 1, current, current + 1, '...', last];
        }
    }

    return (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: '16px 0', flexWrap: 'wrap' }}>
            <button onClick={() => onPage(current - 1)} disabled={current === 1}
                style={{ padding: '5px 11px', borderRadius: 7, border: `1px solid ${T.border}`, background: 'white', color: current === 1 ? '#cbd5e1' : T.text, cursor: current === 1 ? 'not-allowed' : 'pointer', fontSize: 11.5 }}>
                &laquo;
            </button>
            {pages.map((p, idx) => (
                <button key={idx} onClick={() => p !== '...' && onPage(p)} disabled={p === '...'}
                    style={{
                        padding: '5px 11px', borderRadius: 7, border: p === '...' ? 'none' : `1px solid ${p === current ? T.blue : T.border}`,
                        background: p === current ? T.blue : 'white', color: p === current ? 'white' : T.text,
                        cursor: p === '...' ? 'default' : 'pointer', fontSize: 11.5, fontWeight: p === current ? 700 : 400
                    }}>
                    {p}
                </button>
            ))}
            <button onClick={() => onPage(current + 1)} disabled={current === last}
                style={{ padding: '5px 11px', borderRadius: 7, border: `1px solid ${T.border}`, background: 'white', color: current === last ? '#cbd5e1' : T.text, cursor: current === last ? 'not-allowed' : 'pointer', fontSize: 11.5 }}>
                &raquo;
            </button>
        </div>
    );
}

export default function KompetitorDetail({ activeNav, scopeName, backUrl, kompetitorData, totalKompetitor }) {
    const fmt = n => new Intl.NumberFormat('id-ID').format(n||0);
    
    const goPage = p => {
        router.get(window.location.pathname, { page: p }, { preserveState: true, preserveScroll: true });
    };

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title={`Kompetitor - ${scopeName}`} />
            <div style={{ padding:'20px 24px', maxWidth:1200, margin:'0 auto' }}>

                <div style={{ marginBottom:20 }}>
                    <button onClick={()=>router.visit(backUrl || route('monitoring.area.select'))}
                        style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:T.blueSoft, fontSize:12, fontWeight:600, padding:0 }}>
                        <i className="bi bi-arrow-left" /> Kembali ke Dashboard
                    </button>
                    <h1 style={{ fontSize:22, fontWeight:800, color:T.text, margin:'8px 0 4px' }}>
                        Kompetitor & Market Share — {scopeName}
                    </h1>
                    <p style={{ fontSize:12, color:T.slate, margin:0 }}>Rincian sebaran kompetitor berdasarkan data pelanggan</p>
                </div>

                {/* Overall stats */}
                <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                    {[
                        { label:'Total Kompetitor', value:fmt(totalKompetitor), color:T.blue, icon:'bi-pie-chart-fill' },
                        { label:'Dominan Area', value:kompetitorData.data.length > 0 ? kompetitorData.data[0].kompetitor : '-', color:T.orange, icon:'bi-star-fill' },
                    ].map((s,i)=>(
                        <div key={i} style={{ ...S.card, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, flex:1, minWidth:200 }}>
                            <div style={{ width:38, height:38, borderRadius:9, background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <i className={`bi ${s.icon}`} style={{ fontSize:17, color:s.color }} />
                            </div>
                            <div>
                                <div style={{ fontSize:11, color:T.slate, fontWeight:600 }}>{s.label}</div>
                                <div style={{ fontSize:18, fontWeight:800, color:T.text }}>{s.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ ...S.card, overflow:'hidden' }}>
                    <div style={{ padding:'12px 16px', borderBottom:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Rincian Market Share Kompetitor</div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
                            <thead>
                                <tr>
                                    <th style={S.th}>Kompetitor</th>
                                    <th style={{...S.th, textAlign:'right'}}>Total Sekolah</th>
                                    <th style={{...S.th, textAlign:'right'}}>Potensi Siswa</th>
                                    <th style={S.th}>Sebaran Wilayah</th>
                                    <th style={S.th}>Detail Wilayah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kompetitorData.data.map((r,i)=>(
                                    <tr key={i} style={{ background:i%2===0?'white':'#fafbfc' }}>
                                        <td style={{ ...S.td, fontWeight:700, color:T.blueSoft }}>{r.kompetitor}</td>
                                        <td style={{ ...S.td, textAlign:'right', fontWeight:600 }}>{fmt(r.total_sekolah)}</td>
                                        <td style={{ ...S.td, textAlign:'right', color:T.green, fontWeight:600 }}>{fmt(r.potensi_siswa)}</td>
                                        <td style={{ ...S.td }}>
                                            <span style={{ padding:'3px 8px', background:'#f1f5f9', borderRadius:12, fontSize:10, fontWeight:600, color:T.slate }}>
                                                {r.jumlah_area}
                                            </span>
                                        </td>
                                        <td style={{ ...S.td, fontSize:11, color:T.slate }}>{r.area_list}</td>
                                    </tr>
                                ))}
                                {kompetitorData.data.length === 0 && (
                                    <tr><td colSpan="5" style={{...S.td, textAlign:'center', color:T.slate, padding:'30px'}}>Tidak ada data kompetitor ditemukan</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination meta={kompetitorData} onPage={goPage} />
                </div>
            </div>
        </MonitoringLayout>
    );
}
