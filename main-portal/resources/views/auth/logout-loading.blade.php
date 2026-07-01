<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Redirecting - {{ config('app.name', 'LSP Gatensi') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />

        <!-- Styles -->
        <style>
            :root {
                --primary-blue: #1e40af;
                --primary-light: #3b82f6;
                --secondary-blue: #60a5fa;
                --light-blue: #dbeafe;
                --accent: #f59e0b;
                --gray-100: #f3f4f6;
                --gray-600: #4b5563;
                --gray-800: #1f2937;
                --gray-900: #111827;
                --white: #ffffff;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: var(--white);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                color: var(--gray-800);
            }

            /* Header with Logo */
            .header {
                background: var(--white);
                padding: 1.5rem 0;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                position: relative;
            }

            .header-content {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 1.5rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .logo {
                width: 200px;
                height: 50px;
            }

            .logo img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            /* Main Content */
            .main-container {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem 1rem;
            }

            .content-card {
                background: var(--white);
                border-radius: 16px;
                padding: 3rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                border: 1px solid var(--gray-100);
                text-align: center;
                max-width: 480px;
                width: 100%;
                position: relative;
                overflow: hidden;
            }

            /* Success Icon Container */
            .icon-container {
                width: 120px;
                height: 120px;
                margin: 0 auto 2rem;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .logo2-container {
                position: relative;
                z-index: 2;
                width: 100px;
                height: 100px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--white);
                border-radius: 50%;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                animation: logo-pop 0.6s ease-out;
            }

            .logo2-image {
                width: 80px;
                height: 80px;
                object-fit: contain;
            }

            .success-checkmark {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 32px;
                height: 32px;
                background: var(--accent);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: checkmark-bounce 0.6s ease-out 0.3s both;
                box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
                border: 3px solid var(--white);
            }

            .success-checkmark svg {
                width: 18px;
                height: 18px;
                color: var(--white);
            }

            @keyframes logo-pop {
                0% {
                    transform: scale(0);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.1);
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            @keyframes checkmark-bounce {
                0% {
                    transform: scale(0);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.3);
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            /* Success Rings Animation */
            .success-ring {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 2px solid var(--secondary-blue);
                border-radius: 50%;
                animation: ring-expand 1.5s ease-out infinite;
            }

            .success-ring:nth-child(2) {
                animation-delay: 0.5s;
            }

            @keyframes checkmark {
                0% {
                    transform: scale(0);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.2);
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            @keyframes ring-expand {
                0% {
                    transform: scale(0.8);
                    opacity: 1;
                }
                100% {
                    transform: scale(1.3);
                    opacity: 0;
                }
            }

            /* Text Content */
            h1 {
                font-size: 2rem;
                font-weight: 700;
                color: var(--gray-900);
                margin-bottom: 0.75rem;
                animation: fadeInUp 0.5s ease-out;
            }

            .subtitle {
                font-size: 1.125rem;
                color: var(--gray-600);
                line-height: 1.6;
                margin-bottom: 2.5rem;
                animation: fadeInUp 0.5s ease-out 0.1s both;
            }

            /* Loading Spinner */
            .loading-spinner {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 6px;
                margin-bottom: 2rem;
            }

            .spinner-dot {
                width: 10px;
                height: 10px;
                background: var(--primary-blue);
                border-radius: 50%;
                animation: spinner-pulse 1.4s ease-in-out infinite both;
            }

            .spinner-dot:nth-child(1) {
                animation-delay: -0.32s;
                background: var(--primary-blue);
            }

            .spinner-dot:nth-child(2) {
                animation-delay: -0.16s;
                background: var(--primary-light);
            }

            .spinner-dot:nth-child(3) {
                background: var(--secondary-blue);
            }

            @keyframes spinner-pulse {
                0%, 80%, 100% {
                    transform: scale(0);
                    opacity: 0.5;
                }
                40% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            /* Progress Section */
            .progress-section {
                background: var(--gray-100);
                border-radius: 12px;
                padding: 1.5rem;
                margin-top: 2rem;
            }

            .progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                color: var(--gray-600);
                font-size: 0.95rem;
            }

            .countdown-text {
                font-weight: 600;
                color: var(--primary-blue);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .countdown-number {
                font-size: 1.25rem;
                color: var(--accent);
                font-weight: 700;
            }

            .progress-bar-container {
                width: 100%;
                height: 8px;
                background: var(--white);
                border-radius: 4px;
                overflow: hidden;
                position: relative;
            }

            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, var(--primary-blue) 0%, var(--primary-light) 100%);
                border-radius: 4px;
                animation: progress-fill 3s linear forwards;
                box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
            }

            .progress-glow {
                position: absolute;
                top: 0;
                right: 0;
                width: 20px;
                height: 100%;
                background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 100%);
                animation: progress-shine 1s ease-in-out infinite;
            }

            @keyframes progress-fill {
                from {
                    width: 0%;
                }
                to {
                    width: 100%;
                }
            }

            @keyframes progress-shine {
                0% {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                50% {
                    opacity: 1;
                }
                100% {
                    opacity: 0;
                    transform: translateX(20px);
                }
            }

            /* Skip Link */
            .skip-link {
                position: absolute;
                bottom: 1rem;
                right: 1rem;
                color: var(--primary-light);
                text-decoration: none;
                font-size: 0.875rem;
                font-weight: 500;
                transition: color 0.2s;
            }

            .skip-link:hover {
                color: var(--primary-blue);
            }

            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Responsive Design */
            @media (max-width: 640px) {
                .content-card {
                    padding: 2rem 1.5rem;
                }

                h1 {
                    font-size: 1.75rem;
                }

                .subtitle {
                    font-size: 1rem;
                }

                .logo-text {
                    font-size: 1.25rem;
                }
            }

            /* Accessibility */
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border-width: 0;
            }
        </style>
    </head>
    <body>
        <!-- Header -->
        <header class="header">
            <div class="header-content">
                <div class="logo">
                    <img src="{{ asset('logo.png') }}" alt="LSP Gatensi">
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="main-container">
            <div class="content-card">
                <!-- Success Icon with Logo -->
                <div class="icon-container">
                    <div class="logo2-container">
                        <img src="{{ asset('favicon.png') }}" alt="Success" class="logo2-image">
                        <div class="success-checkmark">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                    <div class="success-ring"></div>
                    <div class="success-ring"></div>
                </div>

                <!-- Text Content -->
                <h1>Logout Successful</h1>
                <p class="subtitle">
                    You have been successfully logged out from<br>
                    <strong>{{ $systemName }}</strong>
                </p>

                <!-- Loading Animation -->
                <div class="loading-spinner" aria-hidden="true">
                    <div class="spinner-dot"></div>
                    <div class="spinner-dot"></div>
                    <div class="spinner-dot"></div>
                </div>

                <!-- Progress Section -->
                <div class="progress-section">
                    <div class="progress-header">
                        <span>Redirecting to Dashboard</span>
                        <div class="countdown-text">
                            <span>in</span>
                            <span class="countdown-number" id="countdown">3</span>
                            <span>seconds</span>
                        </div>
                    </div>
                    <div class="progress-bar-container" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                        <div class="progress-bar"></div>
                        <div class="progress-glow"></div>
                    </div>
                </div>

                <!-- Skip Link -->
                <a href="{{ $redirectUrl }}" class="skip-link">
                    Continue Now →
                </a>
            </div>
        </main>

        <script>
            // Countdown and Progress
            let count = 3;
            const countdownEl = document.getElementById('countdown');
            const progressBar = document.querySelector('.progress-bar');
            const progressContainer = document.querySelector('.progress-bar-container');

            const timer = setInterval(() => {
                count--;
                countdownEl.textContent = count;

                // Update ARIA attributes
                const progress = Math.round(((3 - count) / 3) * 100);
                progressContainer.setAttribute('aria-valuenow', progress);

                if (count <= 0) {
                    clearInterval(timer);
                    window.location.href = '{{ $redirectUrl }}';
                }
            }, 1000);

            // Manual redirect
            document.querySelector('.skip-link').addEventListener('click', (e) => {
                e.preventDefault();
                clearInterval(timer);
                window.location.href = '{{ $redirectUrl }}';
            });

            // Keyboard accessibility
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    clearInterval(timer);
                    window.location.href = '{{ $redirectUrl }}';
                }
            });
        </script>
    </body>
</html>