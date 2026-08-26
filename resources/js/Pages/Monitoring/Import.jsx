import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import MonitoringLayout from '@/Layouts/MonitoringLayout';
import Swal from 'sweetalert2';

const T = {
    blue:    '#1d4ed8',
    blueSoft:'#3b82f6',
    green:   '#16a34a',
    red:     '#dc2626',
    slate:   '#64748b',
    text:    '#0f172a',
    border:  '#e2e8f0',
    bg:      '#f1f5f9',
    card:    '#ffffff',
};

function ImportCard({ title, type, description, columns, routeStore = null, accept = ".csv, .txt" }) {
    const { data, setData, post, processing, progress, reset } = useForm({
        type: type,
        file: null,
    });

    const [fileName, setFileName] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('file', file);
            setFileName(file.name);
        } else {
            setData('file', null);
            setFileName(null);
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            setData('file', file);
            setFileName(file.name);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        
        if (!data.file) {
            Swal.fire({ icon: 'warning', title: 'File Kosong', text: 'Pilih file terlebih dahulu.' });
            return;
        }

        const targetRoute = routeStore || route('monitoring.import.store');

        post(targetRoute, {
            preserveScroll: true,
            onSuccess: (page) => {
                const flash = page.props.flash || {};
                if (flash.success) {
                    Swal.fire({ icon: 'success', title: 'Berhasil', text: flash.success });
                } else if (flash.error) {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: flash.error });
                }
                reset('file');
                setFileName(null);
                document.getElementById(`file-${type}`).value = null;
            },
            onError: (errors) => {
                Swal.fire({ icon: 'error', title: 'Error Validation', text: Object.values(errors).join(', ') });
            }
        });
    };

    return (
        <div style={{
            background: T.card,
            borderRadius: 12,
            border: `1px solid ${T.border}`,
            boxShadow: '0 1px 6px rgba(15,23,42,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8, background: '#eff6ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.blue
                    }}>
                        <i className={accept.includes('xls') ? "bi bi-file-earmark-excel-fill" : "bi bi-filetype-csv"} style={{ fontSize: 16 }}></i>
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{title}</div>
                        <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>{description}</div>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 16, flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 8 }}>
                        Info: <span style={{ color: T.blueSoft, fontWeight: 700 }}>{columns}</span>
                    </div>

                    <label
                        htmlFor={`file-${type}`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            border: `2px dashed ${isDragging ? T.blueSoft : T.border}`,
                            borderRadius: 8,
                            padding: '24px 16px',
                            cursor: 'pointer',
                            background: isDragging ? '#eff6ff' : (fileName ? '#f0fdf4' : 'transparent'),
                            borderColor: isDragging ? T.blueSoft : (fileName ? '#86efac' : T.border),
                            transition: 'all 0.2s',
                            textAlign: 'center'
                        }}
                        onMouseEnter={(e) => !isDragging && !fileName && (e.currentTarget.style.borderColor = T.blueSoft)}
                        onMouseLeave={(e) => !isDragging && !fileName && (e.currentTarget.style.borderColor = T.border)}
                    >
                        <i className={fileName ? "bi bi-check-circle-fill" : "bi bi-cloud-arrow-up"} 
                           style={{ fontSize: 24, color: fileName ? T.green : T.slate, marginBottom: 8 }}></i>
                        <span style={{ fontSize: 12, fontWeight: 600, color: fileName ? T.green : T.text }}>
                            {fileName ? fileName : (isDragging ? 'Lepaskan file ke sini...' : 'Tarik & Lepas (Drag & Drop) file, atau Klik untuk memilih')}
                        </span>
                        <input
                            id={`file-${type}`}
                            type="file"
                            accept={accept}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </label>
                    {progress && (
                        <div style={{ marginTop: 10, height: 6, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${progress.percentage}%`, height: '100%', background: T.blue, transition: 'width 0.2s' }}></div>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing || !data.file}
                    style={{
                        width: '100%', padding: '10px',
                        background: processing || !data.file ? T.slate : T.blue,
                        color: 'white', border: 'none', borderRadius: 8,
                        fontSize: 12, fontWeight: 700, cursor: processing || !data.file ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'background 0.2s'
                    }}
                >
                    {processing ? (
                        <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Mengunggah...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-upload"></i> Proses Import
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

function ImportFolderCard() {
    const { data, setData, post, processing, progress, reset } = useForm({
        files: [],
    });

    const [fileCount, setFileCount] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const handleFolderChange = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setData('files', files);
            setFileCount(files.length);
        } else {
            setData('files', []);
            setFileCount(0);
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.items) {
            // Using DataTransferItemList to get files from dropped folder
            let dtFiles = [];
            for (let i = 0; i < e.dataTransfer.items.length; i++) {
                if (e.dataTransfer.items[i].kind === 'file') {
                    let file = e.dataTransfer.items[i].getAsFile();
                    if (file) dtFiles.push(file);
                }
            }
            if (dtFiles.length > 0) {
                setData('files', dtFiles);
                setFileCount(dtFiles.length);
                return;
            }
        }
        
        // Fallback for older browsers
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            setData('files', files);
            setFileCount(files.length);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        
        if (!data.files || data.files.length === 0) {
            Swal.fire({ icon: 'warning', title: 'Folder Kosong', text: 'Pilih folder yang berisi file laporan terlebih dahulu.' });
            return;
        }

        Swal.fire({
            title: 'Mulai Import?',
            text: `Anda akan mengimport ${data.files.length} file ke antrean latar belakang (Background Process). Ini tidak akan memblokir layar Anda.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Proses Sekarang',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                // Show loading indicator
                Swal.fire({
                    title: 'Mengirim Data...',
                    text: 'Mohon tunggu sementara sistem mengunggah dan memasukkan data ke antrean.',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                post(route('monitoring.import.report.bulk'), {
                    preserveScroll: true,
                    onSuccess: (page) => {
                        const flash = page.props.flash || {};
                        if (flash.success) {
                            Swal.fire({ icon: 'success', title: 'Berhasil Diantrekan', text: flash.success });
                        } else if (flash.error) {
                            Swal.fire({ icon: 'error', title: 'Gagal', text: flash.error });
                        }
                        reset('files');
                        setFileCount(0);
                        document.getElementById('folder-upload').value = null;
                    },
                    onError: (errors) => {
                        Swal.fire({ icon: 'error', title: 'Error Validation', text: Object.values(errors).join(', ') });
                    }
                });
            }
        });
    };

    const handleReset = () => {
        Swal.fire({
            title: 'Reset Semua Data Laporan?',
            text: 'Tindakan ini akan menghapus seluruh data yang berasal dari file Excel (Target, Realisasi, Cabang, Customer, dll). Data Master dari CSV tidak akan dihapus. Anda yakin?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Reset Data!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                // Using Inertia router.delete
                router.delete(route('monitoring.import.report.reset'), {
                    preserveScroll: true,
                    onSuccess: (page) => {
                        const flash = page.props.flash || {};
                        if (flash.success) {
                            Swal.fire('Berhasil!', flash.success, 'success');
                        } else if (flash.error) {
                            Swal.fire('Gagal!', flash.error, 'error');
                        }
                    }
                });
            }
        });
    };

    return (
        <div style={{
            background: T.card,
            borderRadius: 12,
            border: `1px solid ${T.border}`,
            boxShadow: '0 1px 6px rgba(15,23,42,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            gridColumn: '1 / -1',
            marginBottom: '20px'
        }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, background: '#f0fdfa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8, background: '#ccfbf1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f766e'
                    }}>
                        <i className="bi bi-folder2-open" style={{ fontSize: 16 }}></i>
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Import Sekaligus (Satu Folder)</div>
                        <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>Pilih folder yang berisi seluruh file laporan Excel (Otomatis mendeteksi jenis laporan dari nama file)</div>
                    </div>
                </div>
                
                <button
                    type="button"
                    onClick={handleReset}
                    style={{
                        padding: '8px 16px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #f87171',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'background 0.2s'
                    }}
                >
                    <i className="bi bi-trash3-fill"></i> Reset Data Laporan
                </button>
            </div>

            <form onSubmit={submit} style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 16 }}>
                    <label
                        htmlFor="folder-upload"
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            border: `2px dashed ${isDragging ? '#0d9488' : T.border}`,
                            borderRadius: 8,
                            padding: '32px 16px',
                            cursor: 'pointer',
                            background: isDragging ? '#f0fdfa' : (fileCount > 0 ? '#f0fdf4' : 'transparent'),
                            borderColor: isDragging ? '#0d9488' : (fileCount > 0 ? '#86efac' : T.border),
                            transition: 'all 0.2s',
                            textAlign: 'center'
                        }}
                        onMouseEnter={(e) => !isDragging && fileCount === 0 && (e.currentTarget.style.borderColor = '#0d9488')}
                        onMouseLeave={(e) => !isDragging && fileCount === 0 && (e.currentTarget.style.borderColor = T.border)}
                    >
                        <i className={fileCount > 0 ? "bi bi-check-circle-fill" : "bi bi-cloud-arrow-up"} 
                           style={{ fontSize: 32, color: fileCount > 0 ? T.green : T.slate, marginBottom: 8 }}></i>
                        <span style={{ fontSize: 14, fontWeight: 600, color: fileCount > 0 ? T.green : T.text }}>
                            {fileCount > 0 ? `${fileCount} File Terpilih` : (isDragging ? 'Lepaskan folder ke sini...' : 'Tarik & Lepas (Drag & Drop) folder ke sini, atau Klik untuk memilih')}
                        </span>
                        <input
                            id="folder-upload"
                            type="file"
                            webkitdirectory="true"
                            directory="true"
                            multiple
                            onChange={handleFolderChange}
                            style={{ display: 'none' }}
                        />
                    </label>
                    {progress && (
                        <div style={{ marginTop: 10, height: 6, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${progress.percentage}%`, height: '100%', background: '#0d9488', transition: 'width 0.2s' }}></div>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing || fileCount === 0}
                    style={{
                        width: '100%', padding: '12px',
                        background: processing || fileCount === 0 ? T.slate : '#0d9488',
                        color: 'white', border: 'none', borderRadius: 8,
                        fontSize: 13, fontWeight: 700, cursor: processing || fileCount === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'background 0.2s'
                    }}
                >
                    {processing ? (
                        <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            Mengunggah {fileCount} File...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-upload"></i> Proses Import Semua File
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

export default function Import() {
    return (
        <MonitoringLayout activeNav="import">
            <Head title="Import Data Master" />

            {/* HEADER */}
            <div style={{
                background: 'white', padding: '14px 20px',
                borderBottom: `1px solid ${T.border}`,
            }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.slate, letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Dashboard Area
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: '-0.5px', lineHeight: 1.15 }}>
                    IMPORT DATA MASTER
                </div>
                <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>
                    Unggah file CSV untuk mengupdate master data geografis sistem.
                </div>
            </div>

            {/* CONTENT */}
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                    <ImportCard 
                        title="Provinsi" 
                        type="province" 
                        description="Data master provinsi (Export_m_province.csv)" 
                        columns="province_code, province_name"
                    />
                    <ImportCard 
                        title="Kota / Kabupaten" 
                        type="city" 
                        description="Data master kota (Export_m_city.csv)" 
                        columns="city_code, city_name, province_code"
                    />
                    <ImportCard 
                        title="Kecamatan" 
                        type="kecamatan" 
                        description="Data master kecamatan (Export_m_kecamatan.csv)" 
                        columns="camat_code, city_code, camat_name"
                    />
                </div>

                {/* HELP CARD */}
                <div style={{ marginTop: 20, padding: '16px', background: '#eff6ff', border: `1px solid #bfdbfe`, borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <i className="bi bi-info-circle-fill" style={{ color: T.blue, fontSize: 18, marginTop: 2 }}></i>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.blue }}>Informasi Format CSV</div>
                            <ul style={{ margin: 0, paddingLeft: 16, marginTop: 8, fontSize: 11.5, color: T.text, lineHeight: 1.6 }}>
                                <li>Pastikan file memiliki <strong>Header Kolom</strong> pada baris pertama sesuai dengan nama yang diharapkan sistem.</li>
                                <li>Pemisah kolom harus menggunakan koma (<code>,</code>).</li>
                                <li>Data akan di <strong>Update atau Insert (Upsert)</strong> berdasarkan Kode. Data yang sudah ada akan ditimpa, data baru akan ditambahkan.</li>
                                <li>Lakukan import secara berurutan: <strong>Provinsi ➔ Kota ➔ Kecamatan</strong> untuk menjaga integritas relasi antar data.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* NEW SECTION FOR EXCEL REPORT IMPORT */}
                <div style={{ marginTop: 40, borderTop: `1px solid ${T.border}`, paddingTop: 24 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 16 }}>Import Laporan Excel</div>
                    <ImportFolderCard />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                        <ImportCard 
                            title="Rekap Kota (Tahunan)" 
                            type="rekap_kota" 
                            description="File: Rekap Kota & Kab Renc Jual (.xls)" 
                            columns="Membentuk Area & Sales Plan"
                            routeStore={route('monitoring.import.report.store')}
                            accept=".xls, .xlsx"
                        />
                        <ImportCard 
                            title="Rekap Area Cover (Tahunan)" 
                            type="rekap_ac" 
                            description="File: Rekap Area Cover & Renc Jual (.xls)" 
                            columns="Mengupdate AC Sales Plan"
                            routeStore={route('monitoring.import.report.store')}
                            accept=".xls, .xlsx"
                        />
                        <ImportCard 
                            title="RJS (Bulanan)" 
                            type="rjs" 
                            description="File: RJS - Rencana Jual Sales (.xls)" 
                            columns="Membentuk Customer & Customer Plan"
                            routeStore={route('monitoring.import.report.store')}
                            accept=".xls, .xlsx"
                        />
                        <ImportCard 
                            title="RJS 2 (Bulanan)" 
                            type="rjs2" 
                            description="File: RJS 2 - Rencana Jual Sales (.xls)" 
                            columns="Format RJS Baru (Membentuk Customer & Plan 2026)"
                            routeStore={route('monitoring.import.report.store')}
                            accept=".xls, .xlsx"
                        />
                        <ImportCard 
                            title="TAR (Bulanan)" 
                            type="tar" 
                            description="File: TAR - Rekap AC Sales (.xls)" 
                            columns="Mengupdate Progress & SP"
                            routeStore={route('monitoring.import.report.store')}
                            accept=".xls, .xlsx"
                        />
                        <ImportCard 
                            title="Marketshare Kota" 
                            type="marketshare_kota" 
                            description="File: Marketshare Kota & Kab (.xls)" 
                            columns="Data dapodik & share tingkat kota"
                            routeStore={route('monitoring.import.report.store')}
                            accept=".xls, .xlsx"
                        />
                        <ImportCard 
                            title="Marketshare Kecamatan" 
                            type="marketshare_kec" 
                            description="File: Marketshare Kecamatan (.xls)" 
                            columns="Data dapodik & share tingkat kecamatan"
                            routeStore={route('monitoring.import.report.store')}
                            accept=".xls, .xlsx"
                        />
                        <ImportCard 
                            title="Data Cabang" 
                            type="data_cabang" 
                            description="File: Data Cabang (.xls, .xlsx)" 
                            columns="Membentuk Struktur Cabang"
                            routeStore={route('monitoring.import.report.store')}
                            accept=".xls, .xlsx"
                        />
                        <ImportCard 
                            title="Aktivitas Sales Per Customer" 
                            type="aktivitas_sales" 
                            description="File: Aktivitas Sales (.xls, .xlsx)" 
                            columns="Mengupdate data aktivitas sales"
                            routeStore={route('monitoring.import.report.store')}
                            accept=".xls, .xlsx"
                        />
                        <ImportCard 
                            title="Data Customer Cabang" 
                            type="data_customer_cabang" 
                            description="File: Data Customer Cabang (.xls, .xlsx)" 
                            columns="Mengupdate data customer per cabang"
                            routeStore={route('monitoring.import.report.store')}
                            accept=".xls, .xlsx"
                        />
                        <ImportCard 
                            title="Master Dapodik (Semua Sekolah)" 
                            type="master_dapodik" 
                            description="File: m_dapodik.xlsx — master seluruh sekolah" 
                            columns="Import ke customers (is_active=0 untuk sekolah baru)"
                            routeStore={route('monitoring.import.report.store')}
                            accept=".xls, .xlsx"
                        />
                    </div>
                </div>
            </div>
        </MonitoringLayout>
    );
}
