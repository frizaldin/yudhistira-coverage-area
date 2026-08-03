import { Head, usePage } from '@inertiajs/react';

export default function MetaTags({ title = null }) {
    const { configuration } = usePage().props;

    return (
        <Head
            title={
                title ?
                    title + " | " + configuration?.title?.toUpperCase() :
                    configuration?.title?.toUpperCase()}
        >
            <link rel="icon" href={configuration?.favicon} />
            <link rel="shortcut icon" href={configuration?.favicon} />
            <link rel="apple-touch-icon" href={configuration?.favicon} />

            <meta name="author" content={configuration?.site_name} />
            <meta name="description" content={configuration?.meta_description} />
            <meta name="keywords" content={configuration?.meta_keywords} />

            <meta property="og:title" content={ configuration?.meta_title ?? configuration?.title } />
            <meta property="og:description" content={configuration?.meta_description} />
            <meta property="og:image" content={ configuration?.og_image ?? configuration?.logo } />
            <meta property="og:url" content={configuration?.site_url} />
            <meta property="og:site_name" content={configuration?.site_name} />
            <meta property="og:type" content="website" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={ configuration?.meta_title ?? configuration?.title } />
            <meta name="twitter:description" content={configuration?.meta_description} />
            <meta name="twitter:image" content={ configuration?.og_image ?? configuration?.logo } />

            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />

            <link rel="alternate" hrefLang="id" href={configuration?.site_url} />
            <link rel="canonical" href={configuration?.site_url} />

            <meta name="robots" content="index,follow" />
        </Head>
    )
}
