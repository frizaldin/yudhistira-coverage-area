import { useForm } from "@inertiajs/react";
import { confirmAction, showLoading, hideLoading, showError } from "@/Utils/swal";
import FooterButton from "@/Components/Section/FooterButton"
import RequiredStar from "@/Components/Element/RequiredStar";
import { useImagePreview } from "@/Utils/file";
import SelectReact from "@/Components/Element/SelectReact";

export default function FrontUser({ title, code, item }) {
    const { data, setData, post } = useForm({
        id: item?.id ?? "",
        name: item?.name ?? "",
        email: item?.email ?? "",
        phone_number: item?.phone_number ?? "",
        active: item?.active ?? "",
        avatar: null,
        password: "",
        gender: item?.gender ?? "",
    });

    const avatar = useImagePreview();

    const handleImage = (e, field, handler) => {
        const file = e.target.files[0];

        setData(field, file);
        handler.setImage(file);
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
                    item && item?.id ?
                        route(`${code}.update`, item.id) :
                        route(`${code}.store`),
                    {
                        forceFormData: true,
                        onSuccess: () => { },
                        onError: (errors) => {
                            hideLoading();

                            showError(errors.error);
                        }
                    });
            }
        });
    };

    return (
        <form onSubmit={submit}>
            <div className="card-body">
                <div className="row">
                    <div className="col-md-6">
                        <label htmlFor="roleName" className="form-label">
                            Name <RequiredStar />
                        </label>
                        <input
                            type="text"
                            className="form-control mb-4"
                            id="roleName"
                            placeholder="Enter name"
                            required
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="email" className="form-label">
                            Email <RequiredStar />
                        </label>
                        <input
                            type="email"
                            className="form-control mb-4"
                            id="email"
                            required
                            value={data.email}
                            placeholder="Enter email"
                            onChange={(e) => setData("email", e.target.value)}
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="email" className="form-label">
                            Phone Number <RequiredStar />
                        </label>
                        <input
                            type="tel"
                            className="form-control mb-4"
                            id="phone_number"
                            required
                            value={data.phone_number}
                            placeholder="Enter phone_number"
                            onChange={(e) => setData("phone_number", e.target.value)}
                        />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="password" className="form-label">
                            Password {!item && (
                                <RequiredStar />
                            )}
                        </label>
                        <input
                            type="password"
                            className="form-control mb-4"
                            id="password"
                            placeholder="Enter new password"
                            onChange={(e) => setData("password", e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <label htmlFor="role" className="form-label">
                            Status <RequiredStar />
                        </label>
                        <SelectReact
                            collection={[{
                                id: 1,
                                name: 'Active'
                            }, {
                                id: 2,
                                name: 'Nonactive'
                            }]}
                            value={data.active}
                            onChange={(value) =>
                                setData("active", value)
                            }
                        />
                    </div>
                    <div className="col-md-4">
                        <label htmlFor="role" className="form-label">
                            Gender <RequiredStar />
                        </label>

                        <SelectReact
                            collection={[{
                                id: 'M',
                                name: 'Male'
                            }, {
                                id: 'F',
                                name: 'Female'
                            }]}
                            value={data.gender}
                            onChange={(value) =>
                                setData("gender", value)
                            }
                        />
                    </div>
                    <div className="col-md-4 mb-4">
                        <label className="form-label">Avatar {!item && (<RequiredStar />)}</label>
                        <input
                            type="file"
                            className="form-control mb-3"
                            accept="image/*"
                            onChange={(e) => handleImage(e, "avatar", avatar)}
                        />
                        {(avatar.preview || (item && item?.url_avatar)) && (
                            <img
                                src={avatar.preview || (item && item?.url_avatar)}
                                alt="preview"
                                className="preview"
                            />
                        )}
                    </div>
                </div>
            </div>
            <div className="card-footer d-flex justify-content-end gap-2">
                <FooterButton url={`${code}.index`} />
            </div>
        </form>
    )
}
