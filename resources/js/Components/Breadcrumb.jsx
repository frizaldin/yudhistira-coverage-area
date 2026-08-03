import { Link} from "@inertiajs/react";

export default function Breadcrumb({ title, items = [] }) {
    return (
        <div className="app-content-header">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-sm-6">
                        <h3 className="mb-0">{title}</h3>
                    </div>

                    <div className="col-sm-6">
                        <ol className="breadcrumb float-sm-end">
                            {items.map((item, index) => (
                                <li
                                    key={index}
                                    className={`breadcrumb-item ${ item.active ? "active" : "" }`}
                                    aria-current={item.active ? "page" : undefined}
                                >
                                    {item.href ? (
                                        <Link href={route(item.href)}>{item.label}</Link>
                                    ) : (
                                        item.label
                                    )}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
