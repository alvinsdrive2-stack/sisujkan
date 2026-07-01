<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>SSO Login - LSP Gatensi</title>

        <!-- Preload logo for better loading -->
        <link rel="preload" href="{{ asset('logo.png') }}" as="image">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])

        <style>
            /* Login page specific styles */
            .login-bg {
                background: #ffffff;
                min-height: 100vh;
                position: relative;
            }

            .logo-container {
                width: 180px;
                height: 180px;
                background: #ffffff;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }

            .logo-container:hover {
                transform: translateY(-5px);
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
            }

            .logo-container img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            /* Form container */
            .form-container {
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(0, 0, 0, 0.05);
            }

            
            /* Form enhancements */
            .form-input {
                transition: all 0.3s ease;
            }

            /* Loading overlay - simplified */
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(5px);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .loading-overlay.show {
                display: flex;
            }

            .form-input:focus {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }

            /* Button animation */
            .login-button {
                position: relative;
                overflow: hidden;
            }

            .login-button::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: translate(-50%, -50%);
                transition: width 0.6s, height 0.6s;
            }

            .login-button:active::before {
                width: 300px;
                height: 300px;
            }
        </style>
    </head>
    <body class="font-sans antialiased">
        <div class="login-bg">
            <div class="relative min-h-screen flex flex-col justify-center items-center px-4">
                <!-- Login Form Container -->
                <div class="w-full sm:max-w-md form-container animate-slide-up">
                    {{ $slot }}
                </div>

                <!-- Footer -->
                <div class="mt-8 text-center animate-fade-in" style="animation-delay: 0.3s;">
                    <p class="text-gray-500 text-sm">© 2025 LSP Gatensi. All rights reserved.</p>
                </div>
            </div>

            <!-- Loading Overlay -->
            <div id="loadingOverlay" class="loading-overlay">
                <div class="text-center">
                    <div class="relative inline-block mb-4">
                        <!-- Outer spinning ring -->
                        <div class="w-20 h-20 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <!-- Favicon in center -->
                        <div class="absolute inset-0 flex items-center justify-center">
                            <img src="{{ asset('favicon.png') }}" alt="Loading..." class="w-10 h-10">
                        </div>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800">Logging in...</h3>
                    <p class="text-sm text-gray-600 mt-1">Please wait while we redirect you</p>
                </div>
            </div>

                    </div>

        <script>
            // Animation classes
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out;
                }

                .animate-slide-up {
                    animation: slideUp 0.8s ease-out;
                }
            `;
            document.head.appendChild(style);

            // Simple form submission handler with loading
            document.addEventListener('DOMContentLoaded', function() {
                const loginForm = document.querySelector('form[method="POST"]');
                if (loginForm) {
                    loginForm.addEventListener('submit', function(e) {
                        // Don't prevent default - let form submit
                        // Just show loading and disable button

                        // Disable button to prevent double submission
                        const submitButton = this.querySelector('button[type="submit"]');
                        submitButton.disabled = true;
                        submitButton.textContent = 'Logging in...';

                        // Show loading overlay
                        const loadingOverlay = document.getElementById('loadingOverlay');
                        if (loadingOverlay) {
                            loadingOverlay.classList.add('show');
                        }

                        // The form will submit and redirect normally
                    });
                }
            });
        </script>
    </body>
</html>
