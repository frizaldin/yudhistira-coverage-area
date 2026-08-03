import { useEffect, useState } from "react";

export function useImagePreview() {
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const setImage = (file) => {
        if (!file) return;
        setPreview(URL.createObjectURL(file));
    };

    return { preview, setImage };
}
