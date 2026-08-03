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
    th:{ fontSize:10.5, fontWeight:700, color:T.slate, padding:'9px 12px', background:'#f8fafc', borderBottom:`1px solid ${T.border}`, textTransform:'uppercase', letterSpacing:'.3px' },
    td:{ fontSize:12, color:T.text, padding:'8px 12px', borderBottom:`1px solid #f4f6f8` },
};
const jenjangColor = { SD:'#3b82f6', SMP:'#8b5cf6', SMA:'#eab308', SMK:'#f97316', DLL:'#10b981' };

function Badge({ label, color, bg }) {
    return <span style={{ background:bg, color, borderRadius:6, padding:'2px 8px', fontSize:10.5, fontWeight:700 }}>{label}</span>;
}

function FilterBar({ kecamatanList, jenjangList, filters, onChange }) {
    return (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <select value={filters.kecamatan||''} onChange={e=>onChange('kecamatan',e.target.value)}
                style={{ fontSize:11.5, padding:'6px 12px', borderRadius:8, border:`1px solid ${T.border}`, background:'white', color:T.text }}>
                <option value="">Semua Kecamatan</option>
                {kecamatanList.map(k=><option key={k} value={k}>{k}</option>)}
            </select>
            <select value={filters.jenjang||''} onChange={e=>onChange('jenjang',e.target.value)}
                style={{ fontSize:11.5, padding:'6px 12px', borderRadius:8, border:`1px solid ${T.border}`, background:'white', color:T.text }}>
                <option value="">Semua Jenjang</option>
                {jenjangList.map(j=><option key={j} value={j}>{j}</option>)}
            </select>
            {(filters.kecamatan||filters.jenjang) && (
                <button onClick={()=>{onChange('kecamatan','');onChange('jenjang','');}}
                    style={{ fontSize:11, padding:'6px 12px', borderRadius:8, border:'none', background:'#fee2e2', color:T.red, cursor:'pointer', fontWeight:600 }}>
                    Reset Filter
                </button>
            )}
        </div>
    );
}

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
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: '12px 0', flexWrap: 'wrap' }}>
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

export default function SiswaDetail({ activeNav, scopeName, backUrl, siswa, filters, kecamatanList, jenjangList, totalSiswa }) {
    const fmt = n => new Intl.NumberFormat('id-ID').format(n||0);

    const applyFilter = (key, val) => {
        const newFilters = { ...filters, [key]: val || undefined };
        router.get(window.location.pathname, newFilters, { preserveState:true, preserveScroll:true });
    };

    const goPage = p => {
        router.get(window.location.pathname, { ...filters, page:p }, { preserveState:true, preserveScroll:true });
    };

    // Max student for visual bar
    const maxStudent = Math.max(...(siswa.data||[]).map(s=>s.total_student||0), 1);

    return (
        <MonitoringLayout activeNav={activeNav}>
            <Head title={`Total Siswa - ${scopeName}`} />
            <div style={{ padding:'20px 24px', maxWidth:1200, margin:'0 auto' }}>

                <div style={{ marginBottom:20 }}>
                    <button onClick={()=>router.visit(backUrl || route('monitoring.area.select'))}
                        style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:T.blueSoft, fontSize:12, fontWeight:600, padding:0 }}>
                        <i className="bi bi-arrow-left" /> Kembali ke Dashboard
                    </button>
                    <h1 style={{ fontSize:22, fontWeight:800, color:T.text, margin:'8px 0 4px' }}>
                        Total Siswa — {scopeName}
                    </h1>
                    <p style={{ fontSize:12, color:T.slate, margin:0 }}>Diurutkan dari sekolah dengan siswa terbanyak (potensi penjualan)</p>
                </div>

                {/* Stats */}
                <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
                    {[
                        { label:'Total Siswa (Area)', value:fmt(totalSiswa), color:T.blue, icon:'bi-person-lines-fill' },
                        { label:'Jumlah Sekolah', value:fmt(siswa.total), color:T.purple, icon:'bi-buildings-fill' },
                        { label:'Halaman', value:`${siswa.current_page}/${siswa.last_page}`, color:T.slate, icon:'bi-file-earmark-text' },
                    ].map((s,i)=>(
                        <div key={i} style={{ ...S.card, padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
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

                <div style={{ ...S.card, padding:'12px 16px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <FilterBar kecamatanList={kecamatanList} jenjangList={jenjangList} filters={filters} onChange={applyFilter} />
                    <div style={{ fontSize:11, color:T.slate }}>
                        Menampilkan {siswa.from}–{siswa.to} dari {fmt(siswa.total)} sekolah
                    </div>
                </div>

                <div style={{ ...S.card, overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                            <tr>
                                {['No','Nama Sekolah','Kecamatan','Jenjang','Status','Total Siswa'].map(h=>(
                                    <th key={h} style={{ ...S.th, textAlign:h==='Total Siswa'?'right':'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {siswa.data?.map((s,i)=>(
                                <tr key={s.id} style={{ background:i%2===0?'white':'#fafbfc' }}>
                                    <td style={{ ...S.td, width:44, color:T.slate }}>{(siswa.from||1)+i}</td>
                                    <td style={{ ...S.td, fontWeight:600 }}>{s.name}</td>
                                    <td style={{ ...S.td, color:T.slate }}>{s.kecamatan_name||'-'}</td>
                                    <td style={{ ...S.td }}>
                                        <Badge label={s.jenjang||'-'} color={jenjangColor[s.jenjang]||T.slate} bg={`${jenjangColor[s.jenjang]||T.slate}18`} />
                                    </td>
                                    <td style={{ ...S.td }}>
                                        {s.is_active
                                            ? <Badge label="Customer" color={T.green} bg="#dcfce7" />
                                            : <Badge label="Non-Customer" color={T.slate} bg="#f1f5f9" />}
                                    </td>
                                    <td style={{ ...S.td }}>
                                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                            <div style={{ flex:1, height:6, background:'#e2e8f0', borderRadius:4, overflow:'hidden', minWidth:80 }}>
                                                <div style={{ width:`${Math.min((s.total_student/maxStudent)*100,100)}%`, height:'100%',
                                                    background:jenjangColor[s.jenjang]||T.blue, borderRadius:4 }} />
                                            </div>
                                            <span style={{ fontWeight:700, minWidth:50, textAlign:'right' }}>{fmt(s.total_student)}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination meta={siswa} onPage={goPage} />
                </div>
            </div>
        </MonitoringLayout>
    );
}
