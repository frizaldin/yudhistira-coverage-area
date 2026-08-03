import { Link, usePage } from "@inertiajs/react";
import { can } from "@/Utils/permission";

export default function HeaderButton({ status = '', url, title, children, withtrash='' }) {
    const { auth } = usePage().props;

    const permissions = auth?.user?.role?.permissions;

    return (
        <div className="card-tools">
            <div className="d-flex" style={{ gap: "0.5rem",     flexWrap: "wrap" }}>
                {children}

                {status == "trash" ? (
                    <Link
                        href={route(`${url}.index`)}
                        className="w--200 btn btn-secondary"
                    >
                        <i className="bi bi-chevron-left"></i> Back
                    </Link>
                ) : (
                    <>
                        <Link
                            href={route(`${url}.create`)}
                            className={`w--200 btn btn-primary ${can(permissions, url, "create") ? '' : 'd-none'}`}
                        >
                            <i className="bi bi-plus mr-1"></i> Add {title}
                        </Link>
                        {withtrash ? (
                            <Link
                                href={route(`${url}.index`, { status: 'trash' })}
                                className={`w--200 btn btn-info ${can(permissions, url, "delete") ? '' : 'd-none'}`}
                            >
                                <i className="bi bi-recycle mr-2"></i>
                                View Trash
                            </Link>
                        ) : (null)}
                    </>
                )}
            </div>
        </div>
    )
}
