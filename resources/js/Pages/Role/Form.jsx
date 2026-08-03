import { useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { confirmAction, showLoading, hideLoading, showError } from "@/Utils/swal";
import FooterButton from "@/Components/Section/FooterButton";
import RequiredStar from "@/Components/Element/RequiredStar";

export default function Store({ role, menus, title, subtitle, code }) {
    const { data, setData, post } = useForm({
        id: role?.id ?? '',
        name: role?.name ?? '',
        permissions: role?.permissions.reduce((acc, perm) => {
            if (!acc[perm.menu_id]) {
                acc[perm.menu_id] = {};
            }

            if (perm.action) {
                const actions = perm.action.split(",");

                actions.forEach((action) => {
                    acc[perm.menu_id][action] = true;
                });
            }

            return acc;
        }, {}),
    });

    const toggle = (menuId, action) => {
        setData("permissions", {
            ...data.permissions,
            [menuId]: {
                ...data.permissions[menuId],
                [action]: !data.permissions?.[menuId]?.[action],
            },
        });
    };

    const submit = (e) => {
        e.preventDefault();

        confirmAction({
            text: `The ${title} data will be saved.`,
            confirmText: "Yes, save it!",
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading("Saving...");

                post(
                    role
                        ? route(`${code}.update`, role.id)
                        : route(`${code}.store`),
                    {
                        forceFormData: true,
                        onSuccess: () => {},
                        onError: (errors) => {
                            hideLoading();
                            showError(errors.error);
                        },
                    }
                );

            }
        });
    };

    const setting_action = {
        crud: [
            "show",
            "create",
            "update",
            "delete",
        ],
        update: [
            "show",
            "update",
        ],
        show: [
            "show",
        ]
    };

    return (
        <AuthenticatedLayout
            breadcrumb={{
                title: title,
                items: [
                    { label: "Dashboard", href: "dashboard" },
                    { label: title, href: `${code}.index` },
                    { label: `${role ? 'Edit' : 'Create'}`, active: true },
                ],
            }}
            title={title}
        >
            <div className="card mb-4">
                <div className="card-header">
                    <h3 className="card-title">{subtitle} Form</h3>
                </div>
                <form onSubmit={submit}>
                    <div className="card-body">
                        <label htmlFor="roleName" className="form-label">
                            Role Name <RequiredStar />
                        </label>
                        <input
                            type="text"
                            className="form-control mb-4"
                            id="roleName"
                            required
                            placeholder="Enter role name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            disabled={role?.name.toLowerCase() === "admin"}
                        />

                        <div className="row">
                            {menus.map((menu) => {
                                const perms = data.permissions?.[menu.id] || {};

                                const actions = setting_action[menu.action] || [];

                                const isAllChecked = actions.every((act) => perms?.[act]);

                                const toggleAll = () => {
                                    const newPerms = {};

                                    actions.forEach((act) => {
                                        newPerms[act] = !isAllChecked;
                                    });

                                    setData("permissions", {
                                        ...data.permissions,
                                        [menu.id]: newPerms,
                                    });
                                };

                                return (
                                    <div className="col-md-6" key={menu.id}>
                                        <div className="border rounded-2xl p-4 mb-4 bg-inside-card">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-semibold text-lg">
                                                    {menu.name}
                                                </h4>

                                                <label className="flex items-center gap-2 cursor-pointer text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            isAllChecked ||
                                                            false
                                                        }
                                                        className="br-3"
                                                        onChange={toggleAll}
                                                    />
                                                    <span className="font-medium">
                                                        Allow All
                                                    </span>
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {setting_action[menu.action].map((action) => (
                                                    <label
                                                        key={action}
                                                        className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer"
                                                    >
                                                        <input
                                                            className="br-3"
                                                            type="checkbox"
                                                            checked={
                                                                perms?.[
                                                                    action
                                                                ] || false
                                                            }
                                                            onChange={() =>
                                                                toggle(
                                                                    menu.id,
                                                                    action,
                                                                )
                                                            }
                                                        />

                                                        <span className="capitalize text-sm">
                                                            {action}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="card-footer d-flex justify-content-end gap-2">
                        <FooterButton url={`${code}.index`} />
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
