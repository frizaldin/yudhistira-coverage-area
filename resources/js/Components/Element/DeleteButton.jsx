import { router } from "@inertiajs/react";
import {
    confirmAction,
    showLoading
} from "@/Utils/swal";
import { usePage } from "@inertiajs/react";
import { can } from "@/Utils/permission";

export default function DeleteButton({ id, status = "permanent", url, title, msg_permanent = '', ...props }) {
    const { auth } = usePage().props;

    const permissions = auth?.user?.role?.permissions;

    const handleDelete = () => {
        confirmAction({
            text: `This ${title} will be deleted ${status === "permanent" ? `permanently${msg_permanent}` : "to the trash"}.`,
            confirmText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading(status === "permanent" ? "Deleting permanently..." : "Moving to trash...");

                router.delete(
                    route(`${url}.destroy`, id),
                    {
                        data: {
                            status: status
                        }
                    }
                );
            }
        });
    };

    return (
        <button
            {...props}
            className={`btn btn-sm ${status === "permanent" ? "btn-danger" : "btn-warning"} ${can(permissions, url, "delete") ? '' : 'd-none'} mr-2`}
            onClick={() =>
                handleDelete()
            }
        >
            <i className={`bi ${status === "permanent" ? "bi-trash-fill" : "bi-archive"} mr-2`}></i>
            { status == 'permanent' ? 'Delete' : 'Move to Trash' }
        </button>
    )
}
