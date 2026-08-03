import { Link } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import { can } from "@/Utils/permission";

export default function EditButton({ id, url, title = 'Edit', icon = 'bi-pencil' }) {
    const { auth } = usePage().props;

    const permissions = auth?.user?.role?.permissions;

    return (
        <Link
            href={route(`${url}.edit`, id)}
            className={`btn btn-sm btn-primary ${can(permissions, url, "update") ? '' : 'd-none'}`}
        >
            <i className={`bi ${icon} mr-2`}></i>
            {title}
        </Link>
    )
}
