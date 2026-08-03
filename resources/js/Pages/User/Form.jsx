import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Users from "@/Components/Section/Form/Users";

export default function Edit({ user, roles, areas, cabangs, sales, title, subtitle, code }) {

    return (
        <AuthenticatedLayout
            breadcrumb={{
                title: title,
                items: [
                    { label: "Dashboard", href: "dashboard" },
                    { label: title, href: `${code}.index` },
                    { label: user ? "Edit" : "Create", active: true },
                ],
            }}
            title={title}
        >
            <div className="card mb-4">
                <div className="card-header">
                    <h3 className="card-title">{subtitle} Form</h3>
                </div>
                <Users title={title} code={code} item={user} roles={roles} areas={areas} cabangs={cabangs} sales={sales} />
            </div>
        </AuthenticatedLayout>
    );
}
