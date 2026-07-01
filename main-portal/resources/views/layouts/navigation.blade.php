<div x-data="{ sidebarOpen: false, open: false }" class="relative">

    <!-- ================= TOGGLE BUTTON ================= -->
    <button
        @click="sidebarOpen = !sidebarOpen"
        class="fixed left-0 top-1/2 -translate-y-1/2 z-50
               bg-blue-600 text-white p-2 rounded-r-lg
               hover:bg-blue-700 transition shadow-lg">
        <i :class="sidebarOpen ? 'fas fa-chevron-left' : 'fas fa-chevron-right'"></i>
    </button>

    <!-- ================= OVERLAY ================= -->
    <div
        x-show="sidebarOpen"
        @click="sidebarOpen = false"
        x-transition:enter="transition-opacity ease-out duration-300"
        x-transition:enter-start="opacity-0"
        x-transition:enter-end="opacity-100"
        x-transition:leave="transition-opacity ease-in duration-200"
        x-transition:leave-start="opacity-100"
        x-transition:leave-end="opacity-0"
        class="fixed inset-0 bg-black/50 z-40">
    </div>

    <!-- ================= SIDEBAR ================= -->
    <aside
        x-show="sidebarOpen"
        x-transition:enter="transition transform ease-out duration-300"
        x-transition:enter-start="-translate-x-full"
        x-transition:enter-end="translate-x-0"
        x-transition:leave="transition transform ease-in duration-200"
        x-transition:leave-start="translate-x-0"
        x-transition:leave-end="-translate-x-full"
        class="fixed left-0 top-0 h-full w-64 bg-white z-50
               shadow-2xl border-r border-gray-200">

        <div class="p-6">

            <!-- Header -->
            <div class="flex items-center mb-6">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600
                            rounded-lg flex items-center justify-center text-white mr-3">
                    <i class="fas fa-globe"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-800">Portal Sistem</h3>
            </div>

            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-4">
                Terintegrasi
            </h4>

            <!-- Systems -->
            <div class="space-y-2">
                @foreach(app(\App\Services\SSOService::class)->getAvailableSystems() as $key => $system)
                <button onclick="accessSystem('{{ $key }}')" class="w-full text-left group">
                    <div class="bg-gray-50 hover:bg-white border border-gray-100
                                rounded-lg p-3 transition hover:shadow-sm">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 bg-white border rounded-lg
                                        flex items-center justify-center">
                                <img src="{{ asset('favicon.png') }}" class="w-6 h-6">
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 class="font-semibold text-xs text-gray-900">
                                    {{ $system['name'] }}
                                </h4>
                                <p class="text-xs text-gray-600 truncate">
                                    {{ $system['description'] }}
                                </p>
                            </div>
                            <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Aktif
                            </span>
                        </div>
                    </div>
                </button>
                @endforeach
            </div>

            <!-- Stats -->
            <div class="mt-8 pt-6 border-t">
                <div class="text-xs text-gray-500">Sistem Aktif</div>
                <div class="text-2xl font-bold">
                    {{ count(app(\App\Services\SSOService::class)->getAvailableSystems()) }}
                </div>
            </div>
        </div>
    </aside>

    <!-- ================= NAVBAR ================= -->
    <nav class="bg-white border-b border-gray-100 relative z-30">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">

                <!-- Left -->
                <div class="flex items-center space-x-8">
                    <a href="{{ route('dashboard') }}">
                        <x-application-logo class="block h-9 w-auto" />
                    </a>

                    <div class="hidden sm:flex space-x-6">
                        <x-nav-link :href="route('dashboard')" :active="request()->routeIs('dashboard')">
                            Dashboard
                        </x-nav-link>

                        @if(Auth::check() && in_array(Auth::user()->role, ['admin','super_admin']))
                        <x-nav-link :href="route('admin.users.index')">
                            User Management
                        </x-nav-link>
                        @endif
                    </div>
                </div>

                <!-- Right -->
                <div class="flex items-center">
                    <x-dropdown align="right" width="48">
                        <x-slot name="trigger">
                            <button class="flex items-center text-sm text-gray-600">
                                {{ Auth::user()->name }}
                                <svg class="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293L10 12l4.707-4.707" />
                                </svg>
                            </button>
                        </x-slot>

                        <x-slot name="content">
                            <x-dropdown-link :href="route('profile.edit')">
                                Profile
                            </x-dropdown-link>
                            <form method="POST" action="{{ route('logout') }}">
                                @csrf
                                <x-dropdown-link :href="route('logout')"
                                    onclick="event.preventDefault();this.closest('form').submit();">
                                    Logout
                                </x-dropdown-link>
                            </form>
                        </x-slot>
                    </x-dropdown>
                </div>

            </div>
        </div>
    </nav>

</div>
