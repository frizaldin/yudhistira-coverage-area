import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import { showSuccess, showError } from "@/Utils/swal";
import TableEmpty from "@/Components/Element/TableEmpty";
import HeaderButton from "@/Components/Section/HeaderButton";
import EditButton from "@/Components/Element/EditButton";
import DeleteButton from "@/Components/Element/DeleteButton";
import BulkButton from "@/Components/Section/BulkButton";

export default function Index({ roles, title, subtitle, code }) {
    const { flash } = usePage().props;

    const [selected, setSelected] = useState([]);

    useEffect(() => {
        if (flash.success) {
            showSuccess(flash.success);
        }
        if (flash.error) {
            showError(flash.error);
        }
    }, [flash]);

    let allowed;
    if (code == 'accounts-roles') {
        allowed = roles
            .filter(role => role.front_user_count === 0)
            .map(role => role.id);
    } else {
        allowed = roles
            .filter(role => role.users_count === 0)
            .map(role => role.id);
    }

    return (
        <AuthenticatedLayout
            breadcrumb={{
                title: title,
                items: [
                    { label: "Dashboard", href: "dashboard" },
                    { label: title, active: true },
                ],
            }}
            title={title}
        >
            <div className="card mb-4">
                <div className="card-header">
                    <h3 className="card-title">{subtitle} List</h3>
                    <HeaderButton url={code} title={subtitle}>
                        <BulkButton selected={selected} url={code} title={title} />
                    </HeaderButton>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-striped align-middle">
                            <thead>
                                <tr>
                                    <th className="w--50">
                                        <input
                                            type="checkbox"
                                            className="br-3"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    if (code == 'accounts-roles') {
                                                        setSelected(allowed);
                                                    } else {
                                                        setSelected(allowed);
                                                    }
                                                } else {
                                                    setSelected([]);
                                                }
                                            }}
                                            checked={selected.length === allowed.length}
                                        />
                                    </th>
                                    <th className="w--200">Role Name</th>
                                    <th className="w--100">Permissions</th>
                                    <th className="w--100">Users</th>
                                    <th className="text-center w--250">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {roles.length === 0 ? (
                                    <TableEmpty colSpan={4} />
                                ) : (
                                    roles.map((role) => (
                                        <tr key={role.id}>
                                            <td>

                                                {(role.type == 'office' ? role.users_count : role.front_user_count) < 1 ? (
                                                    <input
                                                        type="checkbox"
                                                        className="br-3"
                                                        checked={selected.includes(role.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelected([...selected, role.id]);
                                                            } else {
                                                                setSelected(selected.filter(id => id !== role.id));
                                                            }
                                                        }}
                                                    />
                                                ) : (null)}
                                            </td>
                                            <td className="fw-semibold">
                                                {role.name}
                                            </td>

                                            <td>
                                                {role.permissions?.length ? (
                                                    <span className="badge bg-primary">
                                                        {role.permissions.length} permissions
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">
                                                        No permissions
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                {role.type == 'front' ? (
                                                    <>
                                                        {role.front_user_count > 0 ? role.front_user_count : (
                                                            <span className="text-muted">
                                                                No users
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        {role.users_count > 0 ? role.users_count : (
                                                            <span className="text-muted">
                                                                No users
                                                            </span>
                                                        )}
                                                    </>
                                                )}

                                            </td>

                                            <td className="text-center">
                                                <div className="d-flex">
                                                    <div
                                                        title={
                                                            (role.type == 'office' && role.users_count || role.type == 'front' && role.front_user_count)
                                                                ? "Cannot delete: role is assigned to users"
                                                                : ""
                                                        }
                                                    >
                                                        <DeleteButton id={role.id} title={subtitle} url={code} disabled={role.type == 'office' ? role.users_count : role.front_user_count} />
                                                    </div>

                                                    <EditButton id={role.id} url={code} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
