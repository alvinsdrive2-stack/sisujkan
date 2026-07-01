<x-guest-layout>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl w-full space-y-8">
            <!-- Header -->
            <div class="text-center">
                <div class="mx-auto h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Multiple Accounts Found
                </h2>
                <p class="mt-2 text-center text-sm text-gray-600">
                    We found {{ $matches->count() }} accounts with similar names in {{ $system['name'] }}
                </p>
                <p class="mt-1 text-center text-sm text-gray-500">
                    SSO Name: <strong>{{ $sso_name }}</strong>
                </p>
            </div>

            <!-- Account Selection Card -->
            <div class="bg-white shadow-lg rounded-lg">
                <div class="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900">
                        Choose Account to Access
                    </h3>
                    <p class="mt-1 text-sm text-gray-500">
                        Select the account you want to use for {{ $system['name'] }}
                    </p>
                </div>

                <form id="accountSelectionForm" class="px-4 py-5 sm:p-6">
                    <div class="space-y-4">
                        @foreach($matches as $match)
                        <div class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors account-option"
                             data-user-id="{{ $match->id }}"
                             data-email="{{ $match->email }}"
                             data-name="{{ $match->name }}"
                             data-role="{{ $match->role }}">
                            <input type="radio" name="selected_account" value="{{ $match->id }}" class="sr-only" required>

                            <div class="flex items-center w-full">
                                <div class="flex-shrink-0">
                                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span class="text-sm font-medium text-blue-600">
                                            {{ strtoupper(substr($match->name, 0, 1)) }}
                                        </span>
                                    </div>
                                </div>
                                <div class="ml-4 flex-1">
                                    <div class="flex items-center justify-between">
                                        <p class="text-sm font-medium text-gray-900">
                                            {{ $match->name }}
                                        </p>
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {{ $match->role ?? 'user' }}
                                        </span>
                                    </div>
                                    <p class="text-sm text-gray-500">
                                        {{ $match->email }}
                                    </p>
                                </div>
                                <div class="ml-4">
                                    <div class="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center radio-indicator">
                                        <svg class="w-2.5 h-2.5 rounded-full bg-blue-600 hidden radio-dot" fill="currentColor" viewBox="0 0 20 20">
                                            <circle cx="10" cy="10" r="3" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        @endforeach
                    </div>

                    <!-- Action Buttons -->
                    <div class="mt-6 flex justify-between">
                        <button type="button"
                                onclick="window.location.href='{{ route('dashboard') }}'"
                                class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Dashboard
                        </button>

                        <button type="submit"
                                id="proceedBtn"
                                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            Proceed to {{ $system['name'] }}
                        </button>
                    </div>
                </form>
            </div>

            <!-- Info Section -->
            <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-blue-800">How this works:</h3>
                        <div class="mt-2 text-sm text-blue-700">
                            <ul class="list-disc list-inside space-y-1">
                                <li>The system found multiple accounts with similar names</li>
                                <li>Select the account you want to access</li>
                                <li>This selection will be saved for future logins</li>
                                <li>You'll be automatically logged into your chosen account</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <style>
        .account-option {
            transition: all 0.2s ease-in-out;
        }

        .account-option:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .account-option.selected {
            border-color: #3b82f6;
            background-color: #eff6ff;
        }

        .account-option.selected .radio-indicator {
            border-color: #3b82f6;
        }

        .account-option.selected .radio-dot {
            display: block !important;
        }

        input[type="radio"]:checked + .account-option {
            border-color: #3b82f6;
            background-color: #eff6ff;
        }

        input[type="radio"]:checked + .account-option .radio-indicator {
            border-color: #3b82f6;
        }

        input[type="radio"]:checked + .account-option .radio-dot {
            display: block !important;
        }
    </style>

    <script>
        // Handle account selection
        document.addEventListener('DOMContentLoaded', function() {
            const accountOptions = document.querySelectorAll('.account-option');
            const proceedBtn = document.getElementById('proceedBtn');
            const form = document.getElementById('accountSelectionForm');

            // Click handler for account options
            accountOptions.forEach(option => {
                option.addEventListener('click', function() {
                    const radio = this.querySelector('input[type="radio"]');
                    radio.checked = true;

                    // Update visual state
                    accountOptions.forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');

                    // Enable proceed button
                    proceedBtn.disabled = false;
                });
            });

            // Form submission
            form.addEventListener('submit', function(e) {
                e.preventDefault();

                const selectedRadio = form.querySelector('input[name="selected_account"]:checked');
                if (!selectedRadio) {
                    alert('Please select an account to proceed');
                    return;
                }

                const selectedOption = document.querySelector('.account-option.selected');
                const userId = selectedRadio.value;
                const userEmail = selectedOption.dataset.email;
                const userName = selectedOption.dataset.name;
                const userRole = selectedOption.dataset.role;

                // Show loading state
                proceedBtn.disabled = true;
                proceedBtn.innerHTML = `
                    <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V8a8 8 0 018-8h2a8 8 0 011 8v8a8 8 0 01-1 5.707M4 12a8 8 0 011.414 5.707"></path>
                    </svg>
                    Processing...
                `;

                // Submit selection to server
                const formData = new FormData();
                formData.append('sso_user_id', '{{ $sso_user_id }}');
                formData.append('system_name', '{{ $system_name }}');
                formData.append('selected_user_id', userId);
                formData.append('selected_user_email', userEmail);
                formData.append('selected_user_name', userName);
                formData.append('selected_user_role', userRole);

                fetch('/admin/user-mapping/select-account', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Show success message and redirect
                        alert('Account selection saved! Redirecting to ' + data.system_name + '...');
                        window.location.href = data.redirect_url;
                    } else {
                        alert('Error: ' + data.message);
                        proceedBtn.disabled = false;
                        proceedBtn.innerHTML = 'Proceed to ' + data.system_name;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while saving your selection');
                    proceedBtn.disabled = false;
                    proceedBtn.innerHTML = 'Proceed to ' + '{{ $system["name"] }}';
                });
            });

            // Initially disable proceed button
            proceedBtn.disabled = true;
        });
    </script>
</x-guest-layout>