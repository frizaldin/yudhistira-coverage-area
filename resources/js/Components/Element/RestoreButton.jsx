import {
    confirmAction,
    showLoading
} from "@/Utils/swal";
import { router } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import { can } from "@/Utils/permission";

export default function RestoreButton({ url, id, title }) {
    const { auth } = usePage().props;

    const permissions = auth?.user?.role?.permissions;

    const handleRestore = () => {
        confirmAction({
            text: `This ${title} will be restored.`,
            confirmText: "Yes, restore it!",
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading("Restoring...");

                router.post(route(`${url}.restore`, id));
            }
        });
    };

    return(
        <button
            className={`btn btn-sm btn-success mr-2 ${can(permissions, url, "delete") ? '' : 'd-none'}`}
            onClick={() =>
                handleRestore()
            }
        >
            <i className="bi bi-arrow-counterclockwise me-1"></i>
            Restore
        </button>
    )
}
