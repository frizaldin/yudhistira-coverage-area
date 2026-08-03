import FooterButton from "@/Components/Section/FooterButton"
import { useForm } from "@inertiajs/react";
import { confirmAction, showLoading, hideLoading, showError } from "@/Utils/swal";
import { useImagePreview } from "@/Utils/file";
import RequiredStar from "@/Components/Element/RequiredStar";

export default function ProductCategory({ subtitle, code, item }) {
    const { data, setData, post } = useForm({
        id: item?.id ?? "",
        name: item?.name ?? "",
        image: null,
    });

    const image = useImagePreview();

    const handleImage = (e, field, handler) => {
        const file = e.target.files[0];

        setData(field, file);
        handler.setImage(file);
    };

    const submit = (e) => {
        e.preventDefault();

        confirmAction({
            text: `The ${subtitle} data will be saved.`,
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
                    <div className="col-md-6 mb-4">
                        <label className="form-label">Image {!item && (<RequiredStar />)}</label>
                        <input
                            type="file"
                            className="form-control mb-3"
                            accept="image/*"
                            onChange={(e) => handleImage(e, "image", image)}
                        />
                        {(image.preview || (item?.url_image ?? "")) && (
                            <img
                                src={image.preview || (item?.url_image ?? "")}
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
