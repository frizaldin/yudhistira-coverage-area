import { useForm, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import FooterButton from "@/Components/Section/FooterButton";
import { useImagePreview } from "@/Utils/file";
import { useEffect } from "react";
import {
    showSuccess,
    confirmAction,
    showLoading,
    showError,
    hideLoading,
} from "@/Utils/swal";
import RequiredStar from "@/Components/Element/RequiredStar";
import ConfigurationCard from "@/Components/Section/ConfigurationCard";
import { can } from "@/Utils/permission";

export default function Index({ item, title, code }) {
    const { flash, auth } = usePage().props;

    const { data, setData, post } = useForm({
        id: item?.id ?? "",

        title: item?.title ?? "",
        site_name: item?.site_name ?? "",
        site_tagline: item?.site_tagline ?? "",
        site_url: item?.site_url ?? "",

        logo: null,
        favicon: null,
        og_image: null,

        address: item?.address ?? "",
        phone: item?.phone ?? "",
        whatsapp: item?.whatsapp ?? "",
        email: item?.email ?? "",

        instagram: item?.instagram ?? "",
        facebook: item?.facebook ?? "",
        youtube: item?.youtube ?? "",

        about_us: item?.about_us ?? "",
        footer_description: item?.footer_description ?? "",
        footer_copyright: item?.footer_copyright ?? "",
        copyright: item?.copyright ?? "",

        maintenance_mode: item?.maintenance_mode ?? false,

        google_maps_embed: item?.google_maps_embed ?? "",
        latitude: item?.latitude ?? "",
        longitude: item?.longitude ?? "",

        meta_title: item?.meta_title ?? "",
        meta_description: item?.meta_description ?? "",
        meta_keywords: item?.meta_keywords ?? "",
    });

    const logo = useImagePreview();
    const favicon = useImagePreview();
    const og_image = useImagePreview();

    const handleImage = (e, field, handler) => {
        const file = e.target.files[0];

        setData(field, file);
        handler.setImage(file);
    };

    const updatePermission = can(auth.user.role.permissions, "configuration", "update");

    console.log("updatePermission", updatePermission);

    const submit = (e) => {
        e.preventDefault();

        if (!updatePermission) {
            showError(msg("forbidden"));
            return;
        }

        confirmAction({
            text: `The ${code} data will be saved.`,
            confirmText: "Yes, save it!",
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading("Saving...");

                post(route(`${code}.update`), {
                    forceFormData: true,
                    onSuccess: () => {},
                    onError: (errors) => {
                        hideLoading();

                        showError(errors.error);
                    },
                });
            }
        });
    };

    useEffect(() => {
        if (flash.success) {
            showSuccess(flash.success);
        }
        if (flash.error) {
            showError(flash.error);
        }
    }, [flash]);

    return (
        <AuthenticatedLayout
            breadcrumb={{
                title: title,
                items: [
                    { label: "Dashboard", href: "dashboard" },
                    { label: title, active: true },
                ],
            }}
            title={title}
        >
            <form onSubmit={submit}>
                <ConfigurationCard title="General Information">
                    <div className="col-md-6 mb-4">
                        <label className="form-label">Title</label>
                        <input
                            type="text"
                            className="form-control"
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                        />
                    </div>

                    <div className="col-md-6 mb-4">
                        <label className="form-label">Site Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={data.site_name}
                            onChange={(e) =>
                                setData("site_name", e.target.value)
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-4">
                        <label className="form-label">Site Tagline</label>
                        <input
                            type="text"
                            className="form-control"
                            value={data.site_tagline}
                            onChange={(e) =>
                                setData("site_tagline", e.target.value)
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-4">
                        <label className="form-label">Site URL</label>
                        <input
                            type="text"
                            className="form-control"
                            value={data.site_url}
                            onChange={(e) =>
                                setData("site_url", e.target.value)
                            }
                        />
                    </div>
                </ConfigurationCard>
                <ConfigurationCard title="Contact Information">
                    <div className="col-md-12 mb-4">
                        <label className="form-label">Address</label>
                        <input
                            type="text"
                            className="form-control"
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                        />
                    </div>

                    <div className="col-md-4 mb-4">
                        <label className="form-label">Phone</label>
                        <input
                            type="text"
                            className="form-control"
                            value={data.phone}
                            onChange={(e) => setData("phone", e.target.value)}
                        />
                    </div>

                    <div className="col-md-4 mb-4">
                        <label className="form-label">Whatsapp</label>
                        <input
                            type="text"
                            className="form-control"
                            value={data.whatsapp}
                            onChange={(e) =>
                                setData("whatsapp", e.target.value)
                            }
                        />
                    </div>

                    <div className="col-md-4 mb-4">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                        />
                    </div>
                </ConfigurationCard>
                <ConfigurationCard title="Social Media">
                    <div className="col-md-4 mb-4">
                        <label className="form-label">Instagram</label>
                        <input
                            type="text"
                            className="form-control"
                            value={data.instagram}
                            onChange={(e) =>
                                setData("instagram", e.target.value)
                            }
                        />
                    </div>

                    <div className="col-md-4 mb-4">
                        <label className="form-label">Facebook</label>
                        <input
                            type="text"
                            className="form-control"
                            value={data.facebook}
                            onChange={(e) =>
                                setData("facebook", e.target.value)
                            }
                        />
                    </div>

                    <div className="col-md-4 mb-4">
                        <label className="form-label">Youtube</label>
                        <input
                            type="text"
                            className="form-control"
                            value={data.youtube}
                            onChange={(e) => setData("youtube", e.target.value)}
                        />
                    </div>
                </ConfigurationCard>

                <ConfigurationCard title="Website Content">
                    <div className="col-md-12 mb-4">
                        <label className="form-label">About Us</label>
                        <textarea
                            className="form-control"
                            rows="5"
                            value={data.about_us}
                            onChange={(e) =>
                                setData("about_us", e.target.value)
                            }
                        />
                    </div>

                    <div className="col-md-12 mb-4">
                        <label className="form-label">Footer Description</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={data.footer_description}
                            onChange={(e) =>
                                setData("footer_description", e.target.value)
                            }
                        />
                    </div>

                    <div className="col-md-12 mb-4">
                        <label className="form-label">Footer Copyright</label>
                        <textarea
                            className="form-control"
                            rows="2"
                            value={data.footer_copyright}
                            onChange={(e) =>
                                setData("footer_copyright", e.target.value)
                            }
                        />
                    </div>
                </ConfigurationCard>

                <ConfigurationCard title="SEO Configuration">
                    <div className="col-md-12 mb-4">
                        <label className="form-label">Meta Title</label>
                        <input
                            type="text"
                            className="form-control"
                            value={data.meta_title}
                            onChange={(e) =>
                                setData("meta_title", e.target.value)
                            }
                        />
                    </div>

                    <div className="col-md-12 mb-4">
                        <label className="form-label">Meta Description</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={data.meta_description}
                            onChange={(e) =>
                                setData("meta_description", e.target.value)
                            }
                        />
                    </div>

                    <div className="col-md-12 mb-4">
                        <label className="form-label">Meta Keywords</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={data.meta_keywords}
                            onChange={(e) =>
                                setData("meta_keywords", e.target.value)
                            }
                        />
                    </div>
                </ConfigurationCard>

                <ConfigurationCard title="Location & Maps">
                    <div className="col-md-12 mb-4">
                        <label className="form-label">Google Maps Embed</label>
                        <textarea
                            className="form-control"
                            rows="3"
                            value={data.google_maps_embed}
                            onChange={(e) =>
                                setData("google_maps_embed", e.target.value)
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-4">
                        <label className="form-label">Latitude</label>
                        <input
                            type="number"
                            step="any"
                            className="form-control"
                            value={data.latitude}
                            onChange={(e) =>
                                setData("latitude", e.target.value)
                            }
                        />
                    </div>

                    <div className="col-md-6 mb-4">
                        <label className="form-label">Longitude</label>
                        <input
                            type="number"
                            step="any"
                            className="form-control"
                            value={data.longitude}
                            onChange={(e) =>
                                setData("longitude", e.target.value)
                            }
                        />
                    </div>
                </ConfigurationCard>

                <ConfigurationCard title="Images">
                    <div className="col-md-6 mb-4">
                        <label className="form-label">
                            Logo {!item.url_logo && <RequiredStar />}
                        </label>
                        <input
                            type="file"
                            className="form-control mb-3"
                            accept="image/*"
                            onChange={(e) => handleImage(e, "logo", logo)}
                        />
                        {(logo.preview || item.url_logo) && (
                            <img
                                src={logo.preview || item.url_logo}
                                alt="preview"
                                className="preview"
                            />
                        )}
                    </div>
                    <div className="col-md-6 mb-4">
                        <label className="form-label">
                            Favicon {!item.url_favicon && <RequiredStar />}
                        </label>
                        <input
                            type="file"
                            className="form-control mb-3"
                            accept="image/*"
                            onChange={(e) => handleImage(e, "favicon", favicon)}
                        />

                        {(favicon.preview || item.url_favicon) && (
                            <img
                                src={favicon.preview || item.url_favicon}
                                alt="preview"
                                className="preview"
                            />
                        )}
                    </div>
                    <div className="col-md-6 mb-4">
                        <label className="form-label">
                            OG Image {!item.url_og_image && <RequiredStar />}
                        </label>
                        <input
                            type="file"
                            className="form-control mb-3"
                            accept="image/*"
                            onChange={(e) =>
                                handleImage(e, "og_image", og_image)
                            }
                        />

                        {(og_image.preview || item.url_og_image) && (
                            <img
                                src={og_image.preview || item.url_og_image}
                                alt="preview"
                                className="preview"
                            />
                        )}
                    </div>
                </ConfigurationCard>

                <ConfigurationCard title="System Settings">
                    <div className="col-md-12 mb-4">
                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="maintenance_mode"
                                checked={data.maintenance_mode}
                                onChange={(e) =>
                                    setData(
                                        "maintenance_mode",
                                        e.target.checked,
                                    )
                                }
                            />
                            <label className="form-check-label" htmlFor="maintenance_mode">
                                Maintenance Mode
                            </label>
                        </div>
                    </div>
                </ConfigurationCard>
                {updatePermission && (
                    <div className="card">
                        <div className="card-footer d-flex justify-content-end">
                            <FooterButton url={`/${code}`} rm_back={true} />
                        </div>
                    </div>
                )}
            </form>
        </AuthenticatedLayout>
    );
}
