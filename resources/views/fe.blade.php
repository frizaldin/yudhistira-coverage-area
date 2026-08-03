<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia></title>

        <!--begin::Accessibility Meta Tags-->
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
        <!--end::Accessibility Meta Tags-->

        <!--begin::Accessibility Features-->
        <!-- Skip links will be dynamically added by accessibility.js -->
        <link rel="preload" href="{{asset('dist/css/adminlte.css')}}" as="style" />
        <!--end::Accessibility Features-->

        <!--begin::Fonts-->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/source-sans-3@5.0.12/index.css"
            integrity="sha256-tXJfXfp6Ewt1ilPzLDtQnJV4hclT9XuaZUKyUvmyr+Q=" crossorigin="anonymous" media="print"
            onload="this.media = 'all'" />
        <!--end::Fonts-->

        <!--begin::Third Party Plugin(OverlayScrollbars)-->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/overlayscrollbars@2.11.0/styles/overlayscrollbars.min.css"
            crossorigin="anonymous" />
        <!--end::Third Party Plugin(OverlayScrollbars)-->

        <!--begin::Third Party Plugin(Bootstrap Icons)-->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
            crossorigin="anonymous" />
        <!--end::Third Party Plugin(Bootstrap Icons)-->

        <!--begin::Required Plugin(AdminLTE)-->
        <link rel="stylesheet" href="{{asset('dist/css/adminlte.css')}}" />
        <link rel="stylesheet" href="{{asset('dist/css/color/default.css')}}" />
        <link rel="stylesheet" href="{{asset('dist/css/custom.css')}}" />
        <link rel="stylesheet" href="{{asset('dist/css/welcome.css')}}" />
        <!--end::Required Plugin(AdminLTE)-->

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="fixed-footer sidebar-expand-lg bg-body-tertiary">
        @inertia

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/js/bootstrap.min.js"
            crossorigin="anonymous"></script>
    </body>
</html>
