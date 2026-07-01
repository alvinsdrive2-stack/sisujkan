<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SSO Loading - LSP Gatensi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin 2s linear infinite;
        }
        .fade-in {
            animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <div class="flex items-center justify-center min-h-screen">
        <div class="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full mx-4 fade-in">
            <!-- Logo/Icon Section -->
            <div class="flex justify-center mb-8">
                <div class="relative">
                    <!-- Rotating Logo -->
                    <img src="{{ asset('favicon.png') }}"
                         alt="LSP Gatensi Logo"
                         class="w-24 h-24 animate-spin-slow rounded-full shadow-lg">

                    <!-- Pulsing Ring Around Logo -->
                    <div class="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping"></div>

                    <!-- Status Indicator -->
                    <div class="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                        <svg class="w-4 h-4 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Loading Dots Animation -->
            <div class="flex justify-center mb-6">
                <div class="flex space-x-2">
                    <div class="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style="animation-delay: 0s;"></div>
                    <div class="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
                    <div class="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style="animation-delay: 0.4s;"></div>
                </div>
            </div>

            <!-- Text Section -->
            <div class="text-center">
                <h1 class="text-2xl font-bold text-gray-900 mb-2">
                    Menghubungkan ke {{ $systemName }}...
                </h1>
                <p class="text-gray-600 mb-6">
                    Mohon tunggu sebentar, kami sedang mengamankan koneksi Anda
                </p>

                <!-- Enhanced Progress Bar -->
                <div class="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
                    <div class="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-1000 relative"
                         style="width: 0%"
                         id="progress-bar">
                        <!-- Shimmer Effect -->
                        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                    </div>
                </div>

                <!-- Enhanced Status Messages -->
                <div class="space-y-3 text-sm text-gray-600" id="status-messages">
                    <div class="fade-in flex items-center justify-start">
                        <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <span class="font-medium">Token SSO berhasil dibuat</span>
                    </div>
                    <div class="opacity-50 flex items-center justify-start">
                        <div class="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span>Memverifikasi identitas pengguna</span>
                    </div>
                    <div class="opacity-50 flex items-center justify-start">
                        <svg class="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                        </svg>
                        <span>Mengarahkan ke {{ $systemName }}</span>
                    </div>
                </div>
            </div>

            <!-- Manual Redirect Link -->
            <div class="mt-8 text-center">
                <p class="text-xs text-gray-500">
                    Tidak terarah otomatis?
                    <a href="{{ $redirectUrl }}"
                       class="text-indigo-600 hover:text-indigo-800 font-medium underline">
                        Klik di sini
                    </a>
                </p>
            </div>
        </div>
    </div>

    <script>
        // Auto redirect after 2 seconds
        const redirectUrl = "{{ $redirectUrl }}";
        const progressBar = document.getElementById('progress-bar');

        // Animate progress bar
        setTimeout(() => {
            progressBar.style.width = '30%';
            document.getElementById('status-messages').children[1].classList.remove('opacity-50');
            document.getElementById('status-messages').children[1].classList.add('fade-in');
        }, 500);

        setTimeout(() => {
            progressBar.style.width = '60%';
            document.getElementById('status-messages').children[2].classList.remove('opacity-50');
            document.getElementById('status-messages').children[2].classList.add('fade-in');
        }, 1000);

        setTimeout(() => {
            progressBar.style.width = '100%';
            window.location.href = redirectUrl;
        }, 2000);
    </script>
</body>
</html>