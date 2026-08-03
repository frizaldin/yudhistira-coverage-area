import { usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useEffect, useState } from "react";
import {
    showSuccess,
    showError,
} from "@/Utils/swal";
import Search from "@/Components/Section/Search";
import HeaderButton from "@/Components/Section/HeaderButton";
import TableEmpty from "@/Components/Element/TableEmpty";
import BulkButton from "@/Components/Section/BulkButton";
import DeleteButton from "@/Components/Element/DeleteButton";
import EditButton from "@/Components/Element/EditButton";
import RestoreButton from "@/Components/Element/RestoreButton";

export default function Index({ users, status, filters, title, subtitle, code }) {
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

    let breadcrumb;

    if (status === "trash") {
        breadcrumb = [
            { label: "Dashboard", href: "dashboard" },
            { label: title, href: `${code}.index` },
            { label: "Trash", active: true },
        ];
    } else {
        breadcrumb = [
            { label: "Dashboard", href: "dashboard" },
            { label: title, active: true },
        ];
    }

    return (
        <AuthenticatedLayout
            breadcrumb={{
                title: title,
                items: breadcrumb,
            }}
            title={title}
        >
            <div className="card mb-4">
                <div className="card-header">
                    <h3 className="card-title">{subtitle} List</h3>
                    <HeaderButton status={status} url={code} title={subtitle} withtrash={1}>
                        <BulkButton selected={selected} status={status} url={code} title={code} withtrash={1} />
                    </HeaderButton>
                </div>
                <div className="card-body p-0">

                    <Search filters={filters} url={code} />

                    <table className="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th style={{ width: "40px" }}>
                                    <input
                                        type="checkbox"
                                        className="br-3"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelected(users.map(u => u.id));
                                            } else {
                                                setSelected([]);
                                            }
                                        }}
                                        checked={selected.length === users.length}
                                    />
                                </th>
                                <th style={{ width: "30%" }}>User Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th
                                    style={{ width: "350px" }}
                                    className="text-center"
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.length === 0 ? (
                                <TableEmpty colSpan={5} />
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="br-3"
                                                checked={selected.includes(user.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelected([...selected, user.id]);
                                                    } else {
                                                        setSelected(selected.filter(id => id !== user.id));
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td className="fw-semibold">
                                            {user.name}
                                        </td>

                                        <td>{user.email}</td>

                                        <td>
                                            {user.role?.name || "No role assigned"}
                                        </td>

                                        <td className="text-center">
                                            {status == "trash" ? (
                                                <RestoreButton id={user.id} title={subtitle} url={code} />
                                            ) : (
                                                <>
                                                    <DeleteButton id={user.id} title={subtitle} url={code} />
                                                    <DeleteButton id={user.id} title={subtitle} status="trash" url={code} />
                                                    <EditButton id={user.id} url={code} />
                                                    &nbsp;
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
