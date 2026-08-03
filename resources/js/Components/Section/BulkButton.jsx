import { router } from "@inertiajs/react";
import {
    confirmAction,
    showLoading,
} from "@/Utils/swal";
import { can } from "@/Utils/permission";
import { usePage } from "@inertiajs/react";

export default function BulkButton({ selected, status, url, title, msg_permanent = '', withtrash = '' }) {

    const { auth } = usePage().props;

    const permissions = auth?.user?.role?.permissions;

    const handleBulkDelete = (_status = "permanent") => {
        confirmAction({
            text: `This ${title} will be deleted ${_status === "permanent" ? `permanently${msg_permanent}` : "to the trash"}.`,
            confirmText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading(_status === "permanent" ? "Deleting permanently..." : "Moving to trash...");

                router.post(route(`${url}.bulk-delete`), {
                    ids: selected,
                    status: _status
                });
            }
        });
    };

    const handleBulkRestore = () => {
        confirmAction({
            text: `This ${title} will be restored.`,
            confirmText: "Yes, restore it!",
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading("Restoring...");

                router.post(route(`${url}.bulk-restore`), {
                    ids: selected,
                });
            }
        });
    };

    return (
        <>
            {
                selected.length > 0 && (
                    <>
                        {status === "trash" ? (
                            <button
                                className={`w--200 btn btn-success ${can(permissions, url, "delete") ? '' : 'd-none'}`}
                                onClick={handleBulkRestore}
                            >
                                <i className="bi bi-arrow-counterclockwise mr-1"></i>
                                Restore
                            </button>
                        ) : (
                            <>
                                <button
                                    className={`w--200 btn btn-sm btn-danger ${can(permissions, url, "delete") ? '' : 'd-none'}`}
                                    onClick={() => handleBulkDelete()}
                                >
                                    <i className="bi bi-trash-fill mr-1"></i>
                                    Delete
                                </button>

                                {withtrash ? (
                                    <button
                                        className={`w--200 btn btn-sm btn-warning ${can(permissions, url, "delete") ? '' : 'd-none'}`}
                                        onClick={() => handleBulkDelete("trash")}
                                    >
                                        <i className="bi bi-archive mr-1"></i>
                                        Move to Trash
                                    </button>
                                ) : (null)}

                            </>
                        )}
                    </>
                )
            }
        </>
    )
}
