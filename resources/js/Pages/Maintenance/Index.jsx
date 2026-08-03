import MetaTags from '@/Components/MetaTags';

export default function Maintenance() {
    return (
        <>
            <MetaTags title="Maintenance" />
            <div
                className="min-vh-100 d-flex align-items-center justify-content-center"
                style={{
                    background: "#f8fafc",
                }}
            >
                <div className="text-center">
                    <h1
                        style={{
                            fontSize: "4rem",
                            fontWeight: "bold",
                        }}
                    >
                        🚧
                    </h1>

                    <h2 className="fw-bold">
                        Website Sedang Maintenance
                    </h2>

                    <p className="text-muted mt-3">
                        Kami sedang melakukan perbaikan sistem.
                        Silakan kembali beberapa saat lagi.
                    </p>
                </div>
            </div>
        </>
    );
}
