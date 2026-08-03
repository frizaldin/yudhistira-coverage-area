import { confirmAction, showLoading, hideLoading, showError } from "@/Utils/swal";
import FooterButton from "@/Components/Section/FooterButton"
import { useImagePreview } from "@/Utils/file";
import { useForm } from "@inertiajs/react";
import RequiredStar from "@/Components/Element/RequiredStar";
import TextEditor from "@/Components/Element/TextEditor";
import SelectReact from "@/Components/Element/SelectReact";

export default function Blog({ title, subtitle, code, item, categories, status }) {
    const { data, setData, post } = useForm({
        id: item?.id ?? "",
        category_id: item?.category_id ?? "",
        title: item?.title ?? "",
        slug: item?.slug ?? "",
        excerpt: item?.excerpt ?? "",
        content: item?.content ?? "",
        image: null,
        status: item?.status ?? "",
        published_at: item?.published_at ?? "",
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
                    <div className="col-md-12">
                        <label htmlFor="roleName" className="form-label">
                            Title <RequiredStar />
                        </label>
                        <input
                            type="text"
                            className="form-control mb-4"
                            id="roleName"
                            placeholder="Enter title"
                            required
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                        />
                    </div>
                    <div className="col-md-6 mb-4">
                        <label htmlFor="role" className="form-label">
                            Category <RequiredStar />
                        </label>
                        <SelectReact
                            collection={categories}
                            value={data.category_id}
                            onChange={(value) =>
                                setData("category_id", value)
                            }
                        />
                    </div>
                    <div className="col-md-6 mb-4">
                        <label htmlFor="role" className="form-label">
                            Status <RequiredStar />
                        </label>
                        <SelectReact
                            collection={status}
                            value={data.status}
                            onChange={(value) =>
                                setData("status", value)
                            }
                        />
                    </div>
                    <div className="col-md-12 mb-4">
                        <label className="form-label">Excerpt <RequiredStar /></label>
                        <textarea
                            className="form-control"
                            rows="5"
                            placeholder="Enter excerpt"
                            value={data.excerpt}
                            onChange={(e) => setData("excerpt", e.target.value)}
                        />
                    </div>
                    <div className="col-md-6 mb-4">
                        <label htmlFor="roleName" className="form-label">
                            Published At {data.status == 'published' && <RequiredStar />}
                        </label>
                        <input
                            type="date"
                            className="form-control mb-4"
                            required
                            onChange={(e) => setData("published_at", e.target.value)}
                            value={data.published_at}
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
                        {(image.preview || (item && item?.url_image)) && (
                            <img
                                src={image.preview || (item && item?.url_image)}
                                alt="preview"
                                className="preview"
                            />
                        )}
                    </div>
                    <div className="col-md-12 mb-4">
                        <label className="form-label">Content <RequiredStar /></label>
                        <TextEditor
                            value={data.content}
                            onChange={(value) => setData("content", value)}
                        />
                    </div>
                </div>
            </div>
            <div className="card-footer d-flex justify-content-end gap-2">
                <FooterButton url={`${code}.index`} />
            </div>
        </form>
    )
}
