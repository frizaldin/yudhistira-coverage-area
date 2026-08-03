import { usePage } from "@inertiajs/react";

export default function ApplicationLogo(props) {
    const { configuration } = usePage().props

    return (
        <img src={configuration.logo} alt="logo" {...props} />
    );
}
