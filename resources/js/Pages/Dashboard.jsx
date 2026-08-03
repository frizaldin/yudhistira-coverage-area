import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Pagination from "@/Components/Element/Pagination";

export default function Dashboard({ logs, title, code, widgets }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const hour = new Date().getHours();

    let greeting = "Welcome";
    let subGreeting = "Good to see you back";

    if (hour >= 5 && hour < 12) {
        greeting = "Good morning";
        subGreeting = "Hope you have a productive morning";
    } else if (hour >= 12 && hour < 15) {
        greeting = "Good afternoon";
        subGreeting = "Hope your day is going well";
    } else if (hour >= 15 && hour < 18) {
        greeting = "Good afternoon";
        subGreeting = "Almost evening already";
    } else {
        greeting = "Good evening";
        subGreeting = "Hope you had a great day";
    }

    const methodBadge = (method) => {
        const base = "badge";

        switch (method) {
            case "GET":
                return `${base} bg-primary`;
            case "POST":
                return `${base} bg-success`;
            case "PUT":
            case "PATCH":
                return `${base} bg-warning text-dark`;
            case "DELETE":
                return `${base} bg-danger`;
            default:
                return `${base} bg-secondary`;
        }
    };

    return (
        <AuthenticatedLayout
            breadcrumb={{
                title: title,
                items: [{ label: title, active: true }],
            }}
            title={title}
        >
            <div className="row">
                <div className="col-md-6">
                    <div className="welcome-card shadow-sm sm:rounded-lg overflow-hidden mb-4">
                        <div className="p-6">
                            {/* Greeting Section */}
                            <div className="mb-0">
                                <h2 className="text-2xl font-bold text-main">
                                    {greeting}, {user.name} 👋
                                </h2>

                                <p className="mt-1 text-muted">
                                    {subGreeting}. Welcome back to your {code}.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        {widgets.map((item) => (
                            <div
                                className="col-md-6 col-sm-6 mb-3"
                                key={item.code}
                            >
                                <div className="card shadow-sm h-100 border-0">
                                    <div className="card-body d-flex align-items-center">
                                        <div className="rounded-circle d-flex align-items-center justify-content-center me-3 widget-box-icon">
                                            <i
                                                className={`bi ${item.icon}`}
                                                style={{
                                                    fontSize: "22px",
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <div className="text-muted small">
                                                {item.name}
                                            </div>

                                            <div className="fw-bold fs-4">
                                                {item.count}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Backend Access Log</h3>
                        </div>

                        <div className="card-body p-0">
                            <table className="table table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>IP</th>
                                        <th>URL</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {logs.data.map((v) => (
                                        <tr key={v.id}>
                                            <td>{v.ip}</td>
                                            <td
                                                className="text-truncate"
                                                style={{ maxWidth: 300 }}
                                            >
                                                <span
                                                    className={`badge ${methodBadge(v.method)} mr-2`}
                                                >
                                                    {v.method}
                                                </span>
                                                {v.url.replace(
                                                    "core-system",
                                                    "...",
                                                )}
                                            </td>
                                            <td>
                                                {new Date(
                                                    v.created_at,
                                                ).toLocaleString("id-ID")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <Pagination collection={logs} />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
