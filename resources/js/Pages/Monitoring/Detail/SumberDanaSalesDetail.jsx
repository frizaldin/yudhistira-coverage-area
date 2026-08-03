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

function Donut({ segments, size = 120, ring = 26, label, sub }) {
    const r    = (size - ring) / 2;
    const cx   = size / 2;
    const cy   = size / 2;
    const circ = 2 * Math.PI * r;
    const tot  = segments.reduce((a, s) => a + s.value, 0);
    let cum = 0;
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={ring} />
                {segments.map((seg, i) => {
                    const len    = (seg.value / tot) * circ;
                    const offset = circ / 4 - cum;
                    cum += len;
                    return <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                        stroke={seg.color} strokeWidth={ring}
                        strokeDasharray={`${len} ${circ}`} strokeDashoffset={offset} />;
                })}
            </svg>
            {label && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none',
                }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text, lineHeight: 1 }}>{label}</div>
                    {sub && <div style={{ fontSize: 9, color: T.slate, marginTop: 2 }}>{sub}</div>}
                </div>
            )}
        </div>
    );
}

export default function SumberDanaSalesDetail({ activeNav, scopeName, backUrl, salesName, sekolah, summaryDana, summaryJenjang }) {
    const danaData = [
        { label: 'BOS', value: summaryDana?.['BOS'] || 0, color: '#1d4ed8' },
        { label: 'SWA', value: summaryDana?.['SWA'] || 0, color: '#16a34a' },
        { label: 'SWA-BOS', value: summaryDana?.['SWA-BOS'] || 0, color: '#d97706' },
    ].filter(d => d.value > 0);

    const jenjangColors = { SD:'#ef4444', SMP:'#3b82f6', SMA:'#10b981', SMK:'#f59e0b', DLL:'#8b5cf6' };
    const jenjangData = Object.entries(summaryJenjang || {})
        .map(([label, value]) => ({ label: label || 'Tidak Diketahui', value, color: jenjangColors[label] || '#94a3b8' }))
        .filter(d => d.value > 0)
        .sort((a,b) => b.value - a.value);

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title={`Sekolah per Sales - ${salesName}`} />
            <div style={{ padding:'20px 24px', maxWidth:1000, margin:'0 auto' }}>

                <div style={{ marginBottom:20 }}>
                    <button onClick={() => window.history.back()}
                        style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:T.blueSoft, fontSize:12, fontWeight:600, padding:0 }}>
                        <i className="bi bi-arrow-left" /> Kembali
                    </button>
                    <h1 style={{ fontSize:22, fontWeight:800, color:T.text, margin:'8px 0 4px' }}>
                        Daftar Sekolah — {salesName}
                    </h1>
                    <p style={{ fontSize:12, color:T.slate, margin:0 }}>
                        Rincian target sekolah untuk scope {scopeName}
                    </p>
                </div>

                <div style={{ display:'flex', gap:20, marginBottom:20, flexWrap:'wrap' }}>
                    <div style={{ ...S.card, padding:'16px 20px', flex:1, minWidth:300 }}>
                        <div style={{ fontSize:13, fontWeight:800, color:T.text, marginBottom:16 }}>Komposisi Sumber Dana</div>
                        {danaData.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <Donut segments={danaData} size={100} ring={24} 
                                    label={danaData.reduce((s,d)=>s+d.value,0)} sub="Sekolah" />
                                <div style={{ flex: 1 }}>
                                    {danaData.map((d, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                                                <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{d.label}</span>
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: d.color }}>{d.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize:12, color:T.slate }}>Tidak ada data sumber dana.</div>
                        )}
                    </div>

                    <div style={{ ...S.card, padding:'16px 20px', flex:1, minWidth:300 }}>
                        <div style={{ fontSize:13, fontWeight:800, color:T.text, marginBottom:16 }}>Komposisi Jenjang</div>
                        {jenjangData.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                                <Donut segments={jenjangData} size={100} ring={24} 
                                    label={jenjangData.reduce((s,d)=>s+d.value,0)} sub="Sekolah" />
                                <div style={{ flex: 1 }}>
                                    {jenjangData.map((d, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                                                <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{d.label}</span>
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: d.color }}>{d.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize:12, color:T.slate }}>Tidak ada data jenjang.</div>
                        )}
                    </div>
                </div>

                <div style={{ ...S.card, overflow:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
                        <thead>
                            <tr>
                                <th style={{ ...S.th, textAlign:'center', width: 40 }}>No</th>
                                <th style={{ ...S.th, textAlign:'left' }}>Nama Sekolah</th>
                                <th style={{ ...S.th, textAlign:'left' }}>Kecamatan</th>
                                <th style={{ ...S.th, textAlign:'center' }}>Jenjang</th>
                                <th style={{ ...S.th, textAlign:'center' }}>Sumber Dana</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sekolah.data.map((r, i) => (
                                <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                                    <td style={{ ...S.td, textAlign:'center', color:T.slate }}>
                                        {sekolah.from + i}
                                    </td>
                                    <td style={{ ...S.td, fontWeight:700 }}>{r.name}</td>
                                    <td style={{ ...S.td }}>{r.kecamatan_name || '-'}</td>
                                    <td style={{ ...S.td, textAlign:'center' }}>{r.jenjang}</td>
                                    <td style={{ ...S.td, textAlign:'center' }}>
                                        <span style={{ 
                                            padding:'2px 8px', borderRadius:12, fontSize:11, fontWeight:600,
                                            background: r.sumber_dana === 'BOS' ? '#dbeafe' : (r.sumber_dana === 'SWA' ? '#dcfce7' : '#fef3c7'),
                                            color: r.sumber_dana === 'BOS' ? '#1e40af' : (r.sumber_dana === 'SWA' ? '#166534' : '#b45309')
                                        }}>
                                            {r.sumber_dana}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {sekolah.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ ...S.td, textAlign: 'center', color: T.slate, padding: '20px' }}>
                                        Tidak ada data sekolah.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {sekolah.last_page > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '5px' }}>
                        {sekolah.links.map((link, i) => {
                            const isNull = !link.url;
                            const Tag = isNull ? 'span' : Link;
                            return (
                                <Tag
                                    key={i}
                                    href={isNull ? undefined : link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    style={{
                                        padding: '5px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        textDecoration: 'none',
                                        backgroundColor: link.active ? T.blue : 'white',
                                        color: link.active ? 'white' : T.slate,
                                        pointerEvents: isNull ? 'none' : 'auto',
                                        opacity: isNull ? 0.5 : 1,
                                    }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </MonitoringLayout>
    );
}
