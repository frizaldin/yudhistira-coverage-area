import { defineConfig, loadEnv } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    // Subdirectory deploy (contoh production: /coverage-area/)
    // Lokal root: biarkan kosong atau "/"
    let base = env.VITE_BASE_PATH || "/";
    if (!base.startsWith("/")) base = `/${base}`;
    if (!base.endsWith("/")) base = `${base}/`;

    return {
        base,
        plugins: [
            laravel({
                input: ["resources/js/app.jsx"],
                refresh: true,
            }),
            react(),
        ],
    };
});
