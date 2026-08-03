import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            breadcrumb={{
                title: "Profile",
                items: [
                    { label: "Dashboard", href: "dashboard" },
                    { label: "Profile", active: true },
                ],
            }}
            title="Profile"
        >
            <div className="row">
                <div className="col-md-6">
                    <div className="card mb-4">
                        <div className="card-body">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </div>
                    </div>
                    <div className="card mb-4">
                        <div className="card-body">
                            <DeleteUserForm className="max-w-xl" />
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card mb-4">
                        <div className="card-body">
                            <UpdatePasswordForm className="max-w-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
