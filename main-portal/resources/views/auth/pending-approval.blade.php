<x-guest-layout>
    <div class="mb-4 text-center">
        <h2 class="text-2xl font-bold text-gray-900">Menunggu Approval</h2>
        <p class="mt-1 text-sm text-gray-600">Akses sistem sedang dalam proses verifikasi</p>
    </div>

    @if($system)
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-yellow-800">Nama tidak ditemukan di {{ $system['name'] }}</h3>
                    <div class="mt-2 text-sm text-yellow-700">
                        <p>Nama <strong>{{ $searched_name ?? 'User' }}</strong> tidak cocok dengan user yang terdaftar di sistem {{ $system['name'] }}.</p>
                        <p class="mt-1">Email: <strong>{{ $email }}</strong></p>
                        <p class="mt-1">Silakan hubungi administrator untuk mendapatkan akses.</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
            <h3 class="text-sm font-medium text-blue-800 mb-2">💡 Cara Kerja Pencocokan Nama</h3>
            <div class="text-sm text-blue-700">
                <p class="mb-2">Sistem akan mencoba mencocokkan nama Anda dengan beberapa metode:</p>
                <ul class="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Nama Persis</strong> - Sama persis case-sensitive</li>
                    <li><strong>Nama Mirip</strong> - Abaikan kapital, spasi, dan gelar (Sdr, Bapak, dll)</li>
                    <li><strong>Sebagian Nama</strong> - Jika nama Anda mengandung atau terkandung dalam nama database</li>
                    <li><strong>Kemiripan Kata</strong> - Jika beberapa kata nama cocok</li>
                </ul>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-2">Informasi Akses</h3>
            <dl class="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <div>
                    <dt class="text-sm font-medium text-gray-500">Sistem</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ $system['name'] }}</dd>
                </div>
                <div>
                    <dt class="text-sm font-medium text-gray-500">Deskripsi</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ $system['description'] }}</dd>
                </div>
                <div>
                    <dt class="text-sm font-medium text-gray-500">Nama yang dicari</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ $searched_name ?? 'Tidak diketahui' }}</dd>
                </div>
                <div>
                    <dt class="text-sm font-medium text-gray-500">Email</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ $email }}</dd>
                </div>
                <div>
                    <dt class="text-sm font-medium text-gray-500">Status</dt>
                    <dd class="mt-1">
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Menunggu Approval
                        </span>
                    </dd>
                </div>
            </dl>
        </div>

        <div class="mt-6 flex items-center justify-between">
            <a href="{{ route('login') }}" class="text-sm text-indigo-600 hover:text-indigo-500">
                &larr; Kembali ke Login
            </a>
            <div class="text-sm text-gray-500">
                <p>Hubungi IT Support jika ada pertanyaan</p>
            </div>
        </div>
    @else
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Error</h3>
                    <div class="mt-2 text-sm text-red-700">
                        <p>Sistem tidak valid. Silakan coba lagi.</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-6">
            <a href="{{ route('login') }}" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Kembali ke Login
            </a>
        </div>
    @endif
</x-guest-layout>