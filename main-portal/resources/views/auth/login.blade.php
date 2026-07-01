<x-guest-layout>
    <!-- Session Status -->
    <x-auth-session-status class="mb-4" :status="session('status')" />

    <!-- Logout Notification -->
    @if(request()->has('logout_from'))
        <div id="logoutNotification" class="fixed top-4 right-4 z-50 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg shadow-lg max-w-md fade-in">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <p class="font-medium">Logout Successful!</p>
                </div>
                <button onclick="closeNotification()" class="ml-4 text-green-500 hover:text-green-700">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
            <p class="mt-2 text-sm">Anda telah logout dari <strong>{{ request()->get('system_name') }}</strong></p>
        </div>
    @endif

    @if(isset($user) && $user)
        <!-- User already logged in state -->
        <div class="mb-4 text-center">
            <h2 class="text-2xl font-bold text-gray-900">Welcome Back, {{ $user->name }}!</h2>
            <p class="mt-1 text-sm text-gray-600">You are logged in to Main Portal</p>
        </div>

        <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-blue-700">
                        You can access any system from the dashboard.
                    </p>
                </div>
            </div>
        </div>

        <div class="flex items-center justify-center space-x-4">
            <a href="{{ route('dashboard') }}" class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:border-indigo-900 focus:ring focus:ring-indigo-300 disabled:opacity-25 transition">
                Go to Dashboard
            </a>
        </div>
    @else
        <!-- Normal login form -->
        <div class="p-8">
            <!-- Logo di dalam form -->
            <div class="mb-2 text-center">
                <div class="inline-block mb-1">
                    <div class="w-52 h-32 flex items-center justify-center">
                        <img src="{{ asset('logo.png') }}" alt="LSP Gatensi" class="w-full h-full object-contain">
                    </div>
                </div>
                <h2 class="text-2xl font-bold text-gray-900">Login Semesta Gatensi</h2>
                <p class="mt-2 text-sm text-gray-600">Login untuk mengakses semua sistem LSP Gatensi</p>
            </div>

            <form method="POST" action="{{ route('login.submit') }}">
            @csrf

            <!-- Email Address -->
            <div class="mb-4">
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                </label>
                <input id="email"
                       class="form-input block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       type="email"
                       name="email"
                       :value="old('email')"
                       required
                       autofocus
                       autocomplete="username"
                       placeholder="email@example.com">
                @error('email')
                    <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <!-- Password -->
            <div class="mb-4">
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                    Password
                </label>
                <div class="relative">
                    <input id="password"
                           class="form-input block w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           type="password"
                           name="password"
                           required
                           autocomplete="current-password"
                           placeholder="••••••••">
                    <button type="button"
                            onclick="togglePassword()"
                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                        <svg id="eye-icon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        <svg id="eye-off-icon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                        </svg>
                    </button>
                </div>
                @error('password')
                    <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                @enderror
            </div>

            <!-- Remember Me -->
            <div class="flex items-center justify-between mb-6">
                <label for="remember_me" class="flex items-center">
                    <input id="remember_me"
                           type="checkbox"
                           class="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
                           name="remember">
                    <span class="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" class="text-sm text-blue-600 hover:text-blue-500">Forgot password?</a>
            </div>

            <div class="flex items-center justify-end">
                <button type="submit"
                        class="login-button w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200">
                    Login dengan SSO
                </button>
            </div>
            </form>
        </div>
    @endif

      <script>
        // Toggle password visibility - available for all login views
        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const eyeIcon = document.getElementById('eye-icon');
            const eyeOffIcon = document.getElementById('eye-off-icon');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.classList.add('hidden');
                eyeOffIcon.classList.remove('hidden');
            } else {
                passwordInput.type = 'password';
                eyeIcon.classList.remove('hidden');
                eyeOffIcon.classList.add('hidden');
            }
        }

        // Show loading when form is submitted
        document.addEventListener('DOMContentLoaded', function() {
            const loginForm = document.querySelector('form[method="POST"]');
            if (loginForm) {
                loginForm.addEventListener('submit', function(e) {
                    // Prevent multiple submissions
                    const submitButton = this.querySelector('button[type="submit"]');
                    if (submitButton.disabled) {
                        e.preventDefault();
                        return false;
                    }

                    // Show loading overlay
                    const loadingOverlay = document.getElementById('loadingOverlay');
                    if (loadingOverlay) {
                        loadingOverlay.classList.add('active');
                    }

                    // Disable submit button
                    submitButton.disabled = true;
                    submitButton.innerHTML = '<span class="opacity-75">Logging in...</span>';

                    // Allow form to submit
                    return true;
                });
            }
        });
    </script>

    @if(request()->has('logout_from'))
        <script>
            // Auto-close notification after 5 seconds
            setTimeout(() => {
                closeNotification();
            }, 5000);

            function closeNotification() {
                const notification = document.getElementById('logoutNotification');
                if (notification) {
                    notification.style.transition = 'opacity 0.3s ease-out';
                    notification.style.opacity = '0';
                    setTimeout(() => {
                        notification.remove();
                    }, 300);
                }
            }

            // Add fade-in style
            const style = document.createElement('style');
            style.textContent = `
                .fade-in {
                    animation: fadeIn 0.3s ease-in;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        </script>
    @endif
</x-guest-layout>
