<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        @if(Auth::check())
        <meta name="user-id" content="{{ Auth::user()->id }}">
        @endif

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Preload Logo to prevent flashing -->
        <link rel="preload" href="{{ asset('logo.png') }}" as="image">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Font Awesome -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer" />

      <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
        <script src="{{ asset('js/dashboard-helpers.js') }}" defer></script>
        <script src="{{ asset('js/global-functions.js') }}" defer></script>

        <script>
            // Prevent flash on navigation
            if ('scrollRestoration' in history) {
                history.scrollRestoration = 'manual';
            }

            // Smooth page transitions
            document.addEventListener('DOMContentLoaded', function() {
                // Preload logo if not already cached
                const logoImg = new Image();
                logoImg.src = '{{ asset("logo.png") }}';

                // Show page with smooth animation
                const mainContent = document.getElementById('main-content');
                if (mainContent) {
                    mainContent.style.opacity = '0';
                    mainContent.style.transform = 'translateY(10px)';

                    setTimeout(() => {
                        mainContent.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
                        mainContent.style.opacity = '1';
                        mainContent.style.transform = 'translateY(0)';
                    }, 50);
                }

                // Add smooth transitions to all internal links
                const internalLinks = document.querySelectorAll('a[href^="/"], a[href^="{{ url("/") }}"]');
                internalLinks.forEach(link => {
                    if (!link.hasAttribute('target') && !link.hasAttribute('download') && !link.classList.contains('dropdown-toggle')) {
                        link.addEventListener('click', function(e) {
                            // Skip if modifier keys are pressed
                            if (e.ctrlKey || e.metaKey || e.shiftKey) return;

                            // Skip if it's a logout or form submission
                            if (this.getAttribute('onclick') && this.getAttribute('onclick').includes('submit')) return;

                            e.preventDefault();
                            const href = this.getAttribute('href');

                            // Smooth fade out
                            mainContent.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out';
                            mainContent.style.opacity = '0';
                            mainContent.style.transform = 'translateY(10px)';

                            // Navigate after transition
                            setTimeout(() => {
                                window.location.href = href;
                            }, 150);
                        });
                    }
                });

                // Handle form submissions with smooth transition
                const forms = document.querySelectorAll('form');
                forms.forEach(form => {
                    form.addEventListener('submit', function(e) {
                        if (!form.getAttribute('action') || form.getAttribute('action').includes('logout')) return;

                        // Smooth fade out
                        mainContent.style.transition = 'opacity 0.15s ease-out, transform 0.15s ease-out';
                        mainContent.style.opacity = '0';
                        mainContent.style.transform = 'translateY(10px)';
                    });
                });
            });
        </script>
    </head>
    <body class="font-sans antialiased">
        <div class="min-h-screen bg-gray-100">
            @include('layouts.navigation')

            <!-- Page Content -->
            <main class="main-container page-transition" id="main-content">
                {{ $slot }}
            </main>
        </div>
        <!-- Modals for System Access -->
        <!-- Floating Loading Modal -->
        <div id="floatingLoadingModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden" style="z-index: 9999;">
            <div class="fixed inset-0 flex items-center justify-center p-4">
                <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 transform">
                    <!-- Logo with spinning ring -->
                    <div class="flex flex-col items-center mb-6">
                        <div class="relative inline-block mb-4">
                            <!-- Outer spinning ring -->
                            <div class="w-20 h-20 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <!-- Favicon in center -->
                            <div class="absolute inset-0 flex items-center justify-center">
                                <img src="{{ asset('favicon.png') }}" alt="Loading..." class="w-10 h-10">
                            </div>
                        </div>
                    </div>

                    <!-- Loading text -->
                    <div class="text-center">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">
                            Menghubungkan ke <span id="loadingSystemName"></span>...
                        </h3>
                        <p class="text-sm text-gray-600 mb-4">
                            Mohon tunggu sebentar
                        </p>

                        <!-- Progress bar -->
                        <div class="w-full bg-gray-200 rounded-full h-3">
                            <div id="loadingProgressBar" class="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
                                 style="width: 0%">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Account Selection Modal -->
        <div id="accountSelectionModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden" style="z-index: 9999;">
            <div class="fixed inset-0 flex items-center justify-center p-4">
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 transform p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-semibold text-gray-900">Pilih Akun</h3>
                        <button onclick="closeAccountModal()" class="text-gray-400 hover:text-gray-500 transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <div id="accountModalMessage" class="mb-6 text-sm text-gray-600"></div>

                    <div id="accountOptions" class="space-y-3 max-h-96 overflow-y-auto">
                        <!-- Account options will be loaded here -->
                    </div>

                    <div class="mt-6 flex justify-end space-x-3">
                        <button onclick="closeAccountModal()"
                                class="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                            Batal
                        </button>
                        <button id="confirmAccountBtn"
                                onclick="confirmAccountSelection()"
                                disabled
                                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            Lanjutkan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
