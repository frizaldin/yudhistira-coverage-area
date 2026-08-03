import Footer from '@/Components/Footer';
import Navbar from '@/Components/Navbar';
import Sidebar from '@/Components/Sidebar';
import Breadcrumb from '@/Components/Breadcrumb';
import { usePage, Head } from '@inertiajs/react';

export default function AuthenticatedLayout({ breadcrumb, title, children }) {
    const { configuration } = usePage().props;

    return (
        <div className="app-wrapper">
            <Head
                title={`${title?.toUpperCase()} - ${configuration?.title?.toUpperCase()}`}
            >
                <link
                    rel="icon"
                    href={configuration?.favicon ?? "/dist/img/fav.png"}
                />
            </Head>

            <Navbar />
            <Sidebar />
            <main className="app-main">
                {breadcrumb && (
                    <Breadcrumb
                        title={breadcrumb.title}
                        items={breadcrumb.items}
                    />
                )}

                <div className="app-content">
                    <div className="container-fluid">
                        {children}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
