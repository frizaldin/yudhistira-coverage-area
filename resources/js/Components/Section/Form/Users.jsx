import { useForm } from "@inertiajs/react";
import { confirmAction, showLoading, hideLoading, showError } from "@/Utils/swal";
import FooterButton from "@/Components/Section/FooterButton"
import RequiredStar from "@/Components/Element/RequiredStar";
import SelectReact from "@/Components/Element/SelectReact";

export default function Users({ title, code, item, roles, areas, cabangs, kecamatans }) {
    const { data, setData, post } = useForm({
        id: item?.id ?? "",
        name: item?.name ?? "",
        email: item?.email ?? "",
        password: "",
        role_id: item?.role_id ?? "",
        level: item?.level ?? "nasional",
        area_id: item?.area_id ?? "",
        cabang_id: item?.cabang_id ?? "",
        kecamatan_id: item?.kecamatan_id ?? "",
    });

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
                            User Name <RequiredStar />
                        </label>
                        <input
                            type="text"
                            className="form-control mb-4"
                            id="roleName"
                            placeholder="Enter user name"
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
                    <div className="col-md-6">
                        <label htmlFor="role" className="form-label">
                            Role <RequiredStar />
                        </label>
                        <SelectReact
                            collection={roles}
                            value={data.role_id}
                            onChange={(value) =>
                                setData("role_id", value)
                            }
                        />
                    </div>
                    
                    <div className="col-md-6">
                        <label htmlFor="level" className="form-label">
                            Level Akses <RequiredStar />
                        </label>
                        <select className="form-control mb-4" id="level" required value={data.level} onChange={(e) => setData("level", e.target.value)}>
                            <option value="nasional">Nasional</option>
                            <option value="area">Area</option>
                            <option value="cabang">Cabang</option>
                            <option value="kecamatan">Kecamatan</option>
                        </select>
                    </div>

                    {data.level === 'area' && (
                        <div className="col-md-6">
                            <label htmlFor="area" className="form-label">
                                Pilih Area <RequiredStar />
                            </label>
                            <div className="mb-4">
                                <SelectReact
                                    collection={areas}
                                    value={data.area_id}
                                    onChange={(value) => setData("area_id", value)}
                                />
                            </div>
                        </div>
                    )}
                    {data.level === 'cabang' && (
                        <div className="col-md-6">
                            <label htmlFor="cabang" className="form-label">
                                Pilih Cabang <RequiredStar />
                            </label>
                            <div className="mb-4">
                                <SelectReact
                                    collection={cabangs}
                                    value={data.cabang_id}
                                    onChange={(value) => setData("cabang_id", value)}
                                />
                            </div>
                        </div>
                    )}
                    {data.level === 'kecamatan' && (
                        <div className="col-md-6">
                            <label htmlFor="kecamatan" className="form-label">
                                Pilih Kecamatan <RequiredStar />
                            </label>
                            <div className="mb-4">
                                <SelectReact
                                    collection={kecamatans}
                                    value={data.kecamatan_id}
                                    onChange={(value) => setData("kecamatan_id", value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="card-footer d-flex justify-content-end gap-2">
                <FooterButton url={`${code}.index`} />
            </div>
        </form>
    )
}
