import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/js/dashboard-data-service.js',
                'resources/js/optimized-dashboard.js'
            ],
            refresh: true,
        }),
    ],
});
