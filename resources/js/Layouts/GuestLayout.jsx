import ApplicationLogo from "@/Components/ApplicationLogo";
import { usePage, Link } from "@inertiajs/react";
import MetaTags from '@/Components/MetaTags';

export default function GuestLayout({ children, title }) {
    return (
        <>
            <MetaTags title={title?.toUpperCase()} />

            <div className="flex min-h-screen flex-col items-center bg-first pt-6 px-3 sm:justify-center sm:pt-0">
                <div>
                    <Link href="/">
                        <ApplicationLogo className="h-20 fill-current text-gray-500 mt-6" />
                    </Link>
                </div>

                <div className="mt-6 w-full overflow-hidden shadow-md br-1 sm:max-w-md sm:rounded-lg mb-5">
                    <div className="card">
                        <div className="card-body">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
