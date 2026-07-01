<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        @if(Auth::check())
        <meta name="user-id" content="{{ Auth::user()->id }}">
        @endif
        <title>User Management - {{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Tailwind CSS -->
        <script src="https://cdn.tailwindcss.com"></script>

        <!-- AlpineJS x-cloak styling -->
        <style>
            [x-cloak] { display: none !important; }

            /* Custom animations */
            @keyframes slideInFromTop {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes slideInFromBottom {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes slideInFromLeft {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes slideInFromRight {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes shimmer {
                0% {
                    background-position: -468px 0;
                }
                100% {
                    background-position: 468px 0;
                }
            }

            .animate-slide-in-top {
                animation: slideInFromTop 0.5s ease-out;
            }

            .animate-slide-in-bottom {
                animation: slideInFromBottom 0.5s ease-out;
            }

            .animate-slide-in-left {
                animation: slideInFromLeft 0.5s ease-out;
            }

            .animate-slide-in-right {
                animation: slideInFromRight 0.5s ease-out;
            }

            .animate-fade-in {
                animation: fadeIn 0.5s ease-out;
            }

            /* Skeleton loading animation */
            .skeleton {
                background: linear-gradient(
                    90deg,
                    #f0f0f0 0%,
                    #e0e0e0 20%,
                    #f0f0f0 40%,
                    #f0f0f0 100%
                );
                background-size: 200% 100%;
                animation: shimmer 1.5s ease-in-out infinite;
            }

            /* Smooth transitions */
            .transition-all-smooth {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* Hover scale effect */
            .hover-scale {
                transition: transform 0.2s ease;
            }

            .hover-scale:hover {
                transform: scale(1.02);
            }

            /* Card hover effect */
            .card-hover {
                transition: all 0.3s ease;
            }

            .card-hover:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            }

            /* Tab indicator animation */
            .tab-indicator {
                position: absolute;
                bottom: 0;
                height: 2px;
                background-color: #3B82F6;
                transition: all 0.3s ease;
            }

            /* Modal backdrop blur */
            .modal-backdrop {
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
            }

            /* Button ripple effect */
            .ripple {
                position: relative;
                overflow: hidden;
            }

            .ripple:before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                transform: translate(-50%, -50%);
                transition: width 0.6s, height 0.6s;
            }

            .ripple:active:before {
                width: 300px;
                height: 300px;
            }

            /* Table row stagger animation */
            .table-row-enter {
                opacity: 0;
                transform: translateX(-20px);
            }

            .table-row-enter-active {
                opacity: 1;
                transform: translateX(0);
                transition: all 0.3s ease;
            }

            /* Pulse animation for new items */
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: .5;
                }
            }

            .animate-pulse-slow {
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }

            /* Smooth height transitions */
            .smooth-height {
                transition: max-height 0.3s ease-out;
                overflow: hidden;
            }
        </style>

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
        <!-- Font Awesome -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <!-- Alpine.js -->
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    </head>
    <body class="font-sans antialiased" x-data="userManagement()">
        <div class="min-h-screen bg-gray-100" x-init="initAnimations()">
            @include('layouts.navigation')

            
            <!-- Page Content -->
            <main class="max-w-7xl mx-auto pt-20 pb-6 px-4 sm:px-6 lg:px-8">

                <!-- Management Header with Two Buttons -->
                <div class="bg-white rounded-lg shadow-lg animate-slide-in-top card-hover mb-6">
                    <div class="p-6">
                        <div class="flex items-center justify-between">
                            <!-- Left Button - SSO Users -->
                            <button
                                @click="activeTab = 'sso'"
                                :class="activeTab === 'sso' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                                class="flex items-center px-6 py-3 rounded-xl transition-all-smooth">
                                <div class="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                                     :class="activeTab === 'sso' ? 'bg-white/20' : 'bg-blue-100'">
                                    <i class="fas fa-shield-halved text-lg"
                                       :class="activeTab === 'sso' ? 'text-white' : 'text-blue-600'"></i>
                                </div>
                                <div class="text-left">
                                    <h3 class="font-semibold">SSO Users</h3>
                                    <p class="text-xs opacity-80" x-text="`${ssoUsers.data?.length || 0} users`"></p>
                                </div>
                            </button>

                            <!-- Right Button - Browse Users -->
                            <button
                                @click="activeTab = 'browse'"
                                :class="activeTab === 'browse' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg transform scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                                class="flex items-center px-6 py-3 rounded-xl transition-all-smooth">
                                <div class="text-left mr-3">
                                    <h3 class="font-semibold">Browse Users</h3>
                                    <p class="text-xs opacity-80">Multiple databases</p>
                                </div>
                                <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                                     :class="activeTab === 'browse' ? 'bg-white/20' : 'bg-indigo-100'">
                                    <i class="fas fa-users text-lg"
                                       :class="activeTab === 'browse' ? 'text-white' : 'text-indigo-600'"></i>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tab Content -->
                <div class="bg-white rounded-lg shadow-lg animate-slide-in-bottom card-hover">
                    <div class="p-6">
                        <!-- SSO Users Content -->
                        <div x-show="activeTab === 'sso'" x-cloak
                             x-transition:enter="transition ease-out duration-300"
                             x-transition:enter-start="opacity-0 transform translate-y-4"
                             x-transition:enter-end="opacity-100 transform translate-y-0">
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-lg font-semibold text-gray-900 flex items-center">
                                    <i class="fas fa-shield-halved mr-2 text-blue-600"></i>
                                    SSO Users Management
                                </h2>
                                <div class="flex gap-2">
                                    <button
                                        @click="openCreateSSOModal()"
                                        class="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 text-sm transition-all-smooth shadow-md ripple">
                                        <i class="fas fa-plus-circle mr-2"></i>Create SSO User
                                    </button>
                                    <button
                                        @click="openAddMainUserModal()"
                                        class="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 text-sm transition-all-smooth shadow-md ripple">
                                        <i class="fas fa-user-plus mr-2"></i>Import User
                                    </button>
                                </div>
                            </div>

                            <!-- Search and Filters -->
                            <div class="mb-6">
                                <div class="flex gap-3">
                                    <div class="flex-1 relative">
                                        <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                        <input
                                            type="text"
                                            x-model="ssoSearch"
                                            @keyup.debounce="loadSSOUsers()"
                                            placeholder="Search SSO users..."
                                            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all-smooth text-sm"
                                        >
                                    </div>
                                    <select
                                        x-model="ssoStatusFilter"
                                        @change="loadSSOUsers()"
                                        class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all-smooth text-sm">
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <!-- SSO Users Table -->
                            <div class="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                <div class="flex items-center">
                                                    <i class="fas fa-user mr-2"></i>Name
                                                </div>
                                            </th>
                                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                <div class="flex items-center">
                                                    <i class="fas fa-envelope mr-2"></i>Email
                                                </div>
                                            </th>
                                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                <div class="flex items-center">
                                                    <i class="fas fa-circle mr-2"></i>Status
                                                </div>
                                            </th>
                                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                <div class="flex items-center">
                                                    <i class="fas fa-shield-alt mr-2"></i>Role
                                                </div>
                                            </th>
                                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                <div class="flex items-center">
                                                    <i class="fas fa-calendar mr-2"></i>Created
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-100">
                                        <!-- Loading Skeleton -->
                                        <template x-show="loading.ssoUsers">
                                            <tr x-for="i in 5" :key="'skeleton-' + i">
                                                <td class="px-6 py-4">
                                                    <div class="skeleton h-4 w-32 rounded"></div>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <div class="skeleton h-4 w-40 rounded"></div>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <div class="skeleton h-6 w-16 rounded-full"></div>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <div class="skeleton h-6 w-16 rounded-full"></div>
                                                </td>
                                                <td class="px-6 py-4">
                                                    <div class="skeleton h-4 w-24 rounded"></div>
                                                </td>
                                            </tr>
                                        </template>
                                        <!-- User Data -->
                                        <template x-for="(user, index) in ssoUsers.data" :key="user.id"
                                                  x-show="!loading.ssoUsers"
                                                  x-transition:enter="transition ease-out duration-300"
                                                  x-transition:enter-start="opacity-0"
                                                  x-transition:enter-end="opacity-100">
                                            <tr @click="openEditSSOModal(user)"
                                                class="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-colors duration-200">
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <div class="flex items-center">
                                                        <div class="flex-shrink-0 h-10 w-10">
                                                            <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                                                <span x-text="user.name.charAt(0).toUpperCase()"></span>
                                                            </div>
                                                        </div>
                                                        <div class="ml-4">
                                                            <div class="text-sm font-medium text-gray-900" x-text="user.name"></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <div class="text-sm text-gray-600" x-text="user.email"></div>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-all-smooth bg-green-100 text-green-800 border border-green-200"
                                                        x-text="'Active'">
                                                    </span>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap">
                                                    <span class="text-sm text-gray-900" x-text="user.role ? user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'No Role'"></span>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div class="flex items-center">
                                                        <i class="far fa-clock mr-1"></i>
                                                        <span x-text="user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'"></span>
                                                    </div>
                                                </td>
                                            </tr>
                                        </template>
                                        <tr x-show="!loading.ssoUsers && (!ssoUsers.data || ssoUsers.data.length === 0)">
                                            <td colspan="5" class="px-6 py-12 text-center">
                                                <div class="animate-fade-in">
                                                    <i class="fas fa-users-slash text-4xl text-gray-300 mb-3"></i>
                                                    <p class="text-sm text-gray-500">No SSO users found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Browse Users Content -->
                        <div x-show="activeTab === 'browse'" x-cloak
                             x-transition:enter="transition ease-out duration-300"
                             x-transition:enter-start="opacity-0 transform translate-x-10"
                             x-transition:enter-end="opacity-100 transform translate-x-0">
                            <!-- Database Selection -->
                            <div class="mb-8">
                                <div class="flex flex-wrap gap-3">
                                    <template x-for="(system, index) in systems" :key="system">
                                        <button
                                            @click="switchDatabase(system)"
                                            :class="activeSystem === system ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                                            class="relative px-6 py-3 rounded-xl transition-all-smooth">
                                            <div class="flex items-center space-x-3">
                                                <!-- Icon -->
                                                <i :class="system === 'all' ? 'fas fa-globe-americas' : system === 'balai' ? 'fas fa-building' : system === 'reguler' ? 'fas fa-users' : system === 'fg' ? 'fas fa-bolt' : 'fas fa-wrench'"
                                                   class="text-lg"></i>
                                                <!-- Database Name -->
                                                <div class="text-left">
                                                    <div class="font-semibold" x-text="system === 'all' ? 'All Databases' : system.toUpperCase()"></div>
                                                    <div class="text-xs opacity-80" x-text="`${systemStats[system] || '...'} users`"></div>
                                                </div>
                                            </div>
                                            <!-- Active Indicator -->
                                            <div x-show="activeSystem === system"
                                                 class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse flex items-center justify-center">
                                                <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                                            </div>
                                        </button>
                                    </template>
                                </div>
                            </div>

                            <!-- Search and Actions -->
                            <div class="border-b border-gray-200 pb-6 mb-6">
                                <div class="flex gap-3 items-center">
                                    <!-- Search Input -->
                                    <div class="flex-1 relative max-w-md">
                                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <i class="fas fa-search text-gray-400"></i>
                                        </div>
                                        <input
                                            type="text"
                                            x-model="search"
                                            @keyup.debounce="loadUsers()"
                                            :placeholder="activeSystem === 'all' ? 'Search across all databases...' : 'Search in ' + activeSystem.toUpperCase() + ' database...'"
                                            class="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all-smooth">
                                    </div>

                                    <!-- Create User Button -->
                                    <button
                                        @click="activeSystem !== 'all' && openCreateModal(activeSystem)"
                                        :disabled="activeSystem === 'all'"
                                        :class="activeSystem === 'all' ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'hover:bg-green-700 bg-green-600'"
                                        class="px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-all-smooth">
                                        <i class="fas fa-plus mr-2"></i>Create User
                                    </button>

                                    <!-- Delete Selected Button - Hidden by default -->
                                    <button
                                        x-show="selectedBrowseUsers.length > 0 && activeSystem !== 'all'"
                                        @click="deleteSelectedUsers()"
                                        x-transition
                                        class="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium transition-all-smooth">
                                        <i class="fas fa-trash mr-2"></i>Delete Selected (<span x-text="selectedBrowseUsers.length"></span>)
                                    </button>

                                    <!-- Update Names Button - Hidden by default -->
                                    <button
                                        x-show="selectedBrowseUsers.length > 0"
                                        @click="openBulkNameModal()"
                                        x-transition
                                        class="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium transition-all-smooth">
                                        <i class="fas fa-edit mr-2"></i>Update Names (<span x-text="selectedBrowseUsers.length"></span>)
                                    </button>
                                </div>

                                <!-- Selection Info -->
                                <div x-show="selectedBrowseUsers.length > 0" class="mt-3 text-sm text-gray-600 flex items-center">
                                    <i class="fas fa-check-circle text-blue-600 mr-2"></i>
                                    <span>Selected: <span x-text="selectedBrowseUsers.length" class="font-semibold text-blue-600"></span> users</span>
                                </div>
                            </div>
                            </div>

                            <!-- Users Table -->
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-gray-200">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    @change="toggleSelectAllBrowse($event)"
                                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                            </th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Database</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-gray-200">
                                        <template x-for="user in users.data" :key="user.id + '_' + (user.system || activeSystem)">
                                            <tr class="hover:bg-gray-50 cursor-pointer" :class="activeSystem === 'all' ? 'border-l-4' : ''" :style="activeSystem === 'all' ? 'border-color: ' + (user.system === 'balai' ? '#3B82F6' : user.system === 'reguler' ? '#10B981' : user.system === 'fg' ? '#F59E0B' : '#EF4444') : ''"
                                                @click="openEditBrowseUserModal(user)">
                                                <td class="px-6 py-4" @click.stop>
                                                    <input
                                                        type="checkbox"
                                                        :value="JSON.stringify({id: user.id, system: user.system || activeSystem, user_id: user.id})"
                                                        x-model="selectedBrowseUsers"
                                                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm" x-text="user.id"></td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" x-text="user.name"></td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm" x-text="user.email"></td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span class="text-sm text-gray-900" x-text="user.role || 'No Role'"></span>
                                                </td>
                                                <!-- System Column - Always visible for clarity -->
                                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div class="flex items-center space-x-2">
                                                        <i :class="user.system === 'balai' ? 'fas fa-building' : user.system === 'reguler' ? 'fas fa-users' : user.system === 'fg' ? 'fas fa-bolt' : 'fas fa-wrench'" class="text-lg"></i>
                                                        <span
                                                            class="px-2 py-1 text-xs rounded-full font-semibold"
                                                            :class="user.system === 'balai' ? 'bg-blue-100 text-blue-800' : user.system === 'reguler' ? 'bg-green-100 text-green-800' : user.system === 'fg' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'"
                                                            x-text="(user.system_display || user.system || activeSystem).toUpperCase()">
                                                        </span>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" x-text="user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'"></td>
                                            </tr>
                                        </template>
                                        <tr x-show="users.data === undefined || users.data.length === 0">
                                            <td colspan="7" class="px-6 py-8 text-center text-sm text-gray-500">
                                                No users found
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

  
                      </div>  <!-- Tab Content Container -->

                  </div>  <!-- Main Content Area -->
            </main>
        </div>

        <!-- Create User Modal -->
        <div x-show="showCreateModal"
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 overflow-y-auto z-50"
             style="display: none;">
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75" @click="showCreateModal = false"></div>

                <div class="relative bg-white rounded-lg max-w-md w-full p-6">
                    <h3 class="text-lg font-semibold mb-4">Create User in <span x-text="createSystem.toUpperCase()"></span></h3>

                    <form @submit.prevent="createUser()">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                x-model="createUserForm.email"
                                required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                x-model="createUserForm.name"
                                required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                x-model="createUserForm.role"
                                required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select Role</option>
                                <template x-for="role in systemRoles" :key="role">
                                    <option :value="role" x-text="role"></option>
                                </template>
                            </select>
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                x-model="createUserForm.password"
                                required
                                minlength="6"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>

                        <template x-if="createSystem === 'tuk'">
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    x-model="createUserForm.username"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>
                        </template>

                        <div class="flex justify-end gap-3">
                            <button
                                type="button"
                                @click="showCreateModal = false"
                                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                :disabled="createLoading"
                                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                                <span x-show="!createLoading">Create User</span>
                                <span x-show="createLoading">Creating...</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Edit Browse User Modal -->
        <div x-show="showEditBrowseUserModal"
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 overflow-y-auto z-50"
             style="display: none;">
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75" @click="showEditBrowseUserModal = false"></div>

                <div class="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 transform transition-all">
                    <!-- Modal Header with Icon -->
                    <div class="flex items-center mb-6">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mr-4">
                            <i class="fas fa-user-edit"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-900">Edit User</h3>
                            <p class="text-sm text-gray-500">
                                <i class="fas fa-database mr-1"></i>
                                <span x-text="editBrowseUserForm.system.toUpperCase()"></span> Database
                            </p>
                        </div>
                    </div>

                    <form @submit.prevent="updateBrowseUser()">
                        <!-- User ID Display -->
                        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p class="text-sm text-gray-600">User ID: <span class="font-semibold text-gray-800" x-text="editBrowseUserForm.id"></span></p>
                        </div>

                        <!-- Name Field -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-user mr-1"></i>Name
                            </label>
                            <input
                                type="text"
                                x-model="editBrowseUserForm.name"
                                required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>

                        <!-- Email Field -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-envelope mr-1"></i>Email
                            </label>
                            <input
                                type="email"
                                x-model="editBrowseUserForm.email"
                                required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>

                        <!-- Password Update Section -->
                        <div class="mb-6">
                            <div class="flex items-center justify-between mb-2">
                                <label class="block text-sm font-medium text-gray-700">
                                    <i class="fas fa-lock mr-1"></i>Password
                                </label>
                                <button type="button" @click="editBrowseUserForm.showPassword = !editBrowseUserForm.showPassword"
                                        class="text-xs text-blue-600 hover:text-blue-700">
                                    <i class="fas fa-eye mr-1"></i>
                                    <span x-text="editBrowseUserForm.showPassword ? 'Hide' : 'Show'"></span>
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mb-2">Leave blank to keep current password</p>
                            <div x-show="!editBrowseUserForm.showPassword">
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    disabled
                                    class="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                            </div>
                            <div x-show="editBrowseUserForm.showPassword" x-transition>
                                <input
                                    type="password"
                                    x-model="editBrowseUserForm.password"
                                    placeholder="Enter new password"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2">
                                <input
                                    type="password"
                                    x-model="editBrowseUserForm.password_confirmation"
                                    placeholder="Confirm new password"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        </div>

                        <!-- Role Field -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-user-tag mr-1"></i>Role in <span x-text="editBrowseUserForm.system.toUpperCase()"></span>
                            </label>
                            <select
                                x-model="editBrowseUserForm.role"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Select Role</option>
                                <template x-if="editBrowseUserForm.system === 'balai'">
                                    <option value="adm_tuk">Administrator TUK</option>
                                    <option value="adm_pusat">Administrator Pusat</option>
                                    <option value="prometheus">Prometheus</option>
                                    <option value="keuangan">Keuangan</option>
                                    <option value="banned">Banned</option>
                                </template>
                                <template x-if="editBrowseUserForm.system === 'reguler'">
                                    <option value="adm_tuk">Administrator TUK</option>
                                    <option value="adm_tuk_bpc">Administrator TUK BPC</option>
                                    <option value="adm_pusat">Administrator Pusat</option>
                                    <option value="prometheus">Prometheus</option>
                                    <option value="keuangan">Keuangan</option>
                                </template>
                                <template x-if="editBrowseUserForm.system === 'suisei'">
                                    <option value="adm_tuk">Administrator TUK</option>
                                    <option value="adm_pusat">Administrator Pusat</option>
                                    <option value="prometheus">Prometheus</option>
                                    <option value="keuangan">Keuangan</option>
                                </template>
                                <template x-if="editBrowseUserForm.system === 'tuk'">
                                    <option value="ketua_tuk">Ketua TUK</option>
                                    <option value="verifikator">Verifikator</option>
                                    <option value="validator">Validator</option>
                                    <option value="admin_lsp">Admin LSP</option>
                                    <option value="admin">Administrator</option>
                                    <option value="direktur">Director</option>
                                </template>
                            </select>
                            <p class="text-xs text-gray-500 mt-1" x-show="getRoleDescription(editBrowseUserForm.role)" x-text="getRoleDescription(editBrowseUserForm.role)"></p>
                        </div>

                        <!-- Status Field (Always Active for Database Users) -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-toggle-on mr-1"></i>Status
                            </label>
                            <div class="flex items-center">
                                <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                                    Active
                                </span>
                                <span class="text-xs text-gray-500 ml-2">Database users are always active</span>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                @click="deleteBrowseUser()"
                                :disabled="editBrowseUserLoading"
                                class="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-150 flex items-center">
                                <i class="fas fa-trash mr-2"></i>
                                Delete User
                            </button>
                            <button
                                type="submit"
                                :disabled="editBrowseUserLoading"
                                class="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-150 flex items-center">
                                <i class="fas fa-save mr-2" x-show="!editBrowseUserLoading"></i>
                                <i class="fas fa-spinner fa-spin mr-2" x-show="editBrowseUserLoading"></i>
                                <span x-show="!editBrowseUserLoading">Save Changes</span>
                                <span x-show="editBrowseUserLoading">Saving...</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Mass Update Modal -->
        <div x-show="showMassUpdateModal"
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 overflow-y-auto z-50"
             style="display: none;">
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75" @click="showMassUpdateModal = false"></div>

                <div class="relative bg-white rounded-lg max-w-md w-full p-6">
                    <h3 class="text-lg font-semibold mb-4">
                        <i class="fas fa-bolt mr-2"></i>Mass Update Users
                    </h3>
                    <p class="text-sm text-gray-600 mb-4">Update <span x-text="selectedSSOUsers.length" class="font-semibold"></span> selected users</p>

                    <form @submit.prevent="performMassUpdate()">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Operation</label>
                            <select
                                x-model="massUpdateForm.operation"
                                required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select Operation</option>
                                <option value="activate">Activate Users</option>
                                <option value="deactivate">Deactivate Users</option>
                                <option value="delete">Delete Users</option>
                                <option value="update_role">Update Role</option>
                                <option value="reset_password">Reset Password</option>
                            </select>
                        </div>

                        <div x-show="massUpdateForm.operation === 'update_role'" class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">New Role</label>
                            <input
                                type="text"
                                x-model="massUpdateForm.new_role"
                                placeholder="Enter new role..."
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>

                        <div x-show="massUpdateForm.operation === 'reset_password'" class="mb-4">
                            <label class="flex items-center">
                                <input
                                    type="checkbox"
                                    x-model="massUpdateForm.send_email"
                                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">Send password reset email</span>
                            </label>
                        </div>

                        <div class="flex justify-end gap-3">
                            <button
                                type="button"
                                @click="showMassUpdateModal = false"
                                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                :disabled="massUpdateLoading"
                                class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50">
                                <span x-show="!massUpdateLoading">Update Users</span>
                                <span x-show="massUpdateLoading">Updating...</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

    
        <!-- Create SSO User Modal (Modular) -->
        <div x-show="showCreateSSOModal"
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 overflow-y-auto z-50"
             style="display: none;">
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="fixed inset-0 bg-gray-900 bg-opacity-60 modal-backdrop transition-opacity duration-300" @click="showCreateSSOModal = false"></div>

                <div class="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl transform transition-all"
                     x-transition:enter="transition ease-out duration-300"
                     x-transition:enter-start="opacity-0 transform scale-95 translate-y-4"
                     x-transition:enter-end="opacity-100 transform scale-100 translate-y-0"
                     x-transition:leave="transition ease-in duration-200"
                     x-transition:leave-start="opacity-100 transform scale-100 translate-y-0"
                     x-transition:leave-end="opacity-0 transform scale-95 translate-y-4">

                    <h3 class="text-lg font-semibold mb-4">
                        <i class="fas fa-user-plus mr-2"></i>Create New SSO User
                    </h3>
                    <p class="text-sm text-gray-600 mb-4">Create new SSO user and assign roles per system</p>

                    <form @submit.prevent="performCreateSSOUser()">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                x-model="createSSOForm.name"
                                required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter full name...">
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email (SSO Login)</label>
                            <input
                                type="email"
                                x-model="createSSOForm.email"
                                required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="user@example.com">
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                x-model="createSSOForm.password"
                                required
                                minlength="6"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Min 6 characters">
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                x-model="createSSOForm.password_confirmation"
                                required
                                minlength="6"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Confirm password">
                        </div>

                        <!-- SSO User Role -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">SSO User Role</label>
                            <select
                                x-model="createSSOForm.role"
                                required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select role...</option>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                            <p class="text-xs text-gray-500 mt-1">This role determines access level in the main SSO system</p>
                        </div>

                        <!-- Role Selection by System -->
                        <div class="mb-6">
                            <h4 class="text-sm font-semibold text-gray-900 mb-4">
                                <i class="fas fa-user-tag mr-1"></i>
                                Select Roles per System
                            </h4>

                            <div x-show="loading.systemRoles" class="text-center py-4">
                                <i class="fas fa-spinner fa-spin text-blue-500"></i>
                                <p class="text-sm text-gray-600 mt-2">Loading available roles...</p>
                            </div>

                            <div x-show="!loading.systemRoles" class="space-y-4">
                                <!-- BALAI System -->
                                <div class="border rounded-lg p-4 bg-gray-50">
                                    <div class="flex items-center mb-3">
                                        <i class="fas fa-building text-blue-600 mr-2"></i>
                                        <h5 class="font-semibold text-gray-900">BALAI System</h5>
                                        <span class="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            <span x-text="createSSOForm.selectedRoles.filter(r => r.startsWith('balai.')).length"></span> roles selected
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-3 gap-2">
                                        <template x-for="role in systemRoles.balai || []" :key="'balai-' + role">
                                            <label class="flex items-center p-2 border rounded hover:bg-blue-50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    :value="'balai.' + role"
                                                    x-model="createSSOForm.selectedRoles"
                                                    class="mr-2 text-blue-600 focus:ring-blue-500">
                                                <span class="text-sm" x-text="role"></span>
                                            </label>
                                        </template>
                                    </div>
                                </div>

                                <!-- REGULER System -->
                                <div class="border rounded-lg p-4 bg-gray-50">
                                    <div class="flex items-center mb-3">
                                        <i class="fas fa-graduation-cap text-green-600 mr-2"></i>
                                        <h5 class="font-semibold text-gray-900">REGULER System</h5>
                                        <span class="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                            <span x-text="createSSOForm.selectedRoles.filter(r => r.startsWith('reguler.')).length"></span> roles selected
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-3 gap-2">
                                        <template x-for="role in systemRoles.reguler || []" :key="'reguler-' + role">
                                            <label class="flex items-center p-2 border rounded hover:bg-green-50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    :value="'reguler.' + role"
                                                    x-model="createSSOForm.selectedRoles"
                                                    class="mr-2 text-green-600 focus:ring-green-500">
                                                <span class="text-sm" x-text="role"></span>
                                            </label>
                                        </template>
                                    </div>
                                </div>

                                <!-- FG System -->
                                <div class="border rounded-lg p-4 bg-gray-50">
                                    <div class="flex items-center mb-3">
                                        <i class="fas fa-flask text-purple-600 mr-2"></i>
                                        <h5 class="font-semibold text-gray-900">FG System</h5>
                                        <span class="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                            <span x-text="createSSOForm.selectedRoles.filter(r => r.startsWith('fg.')).length"></span> roles selected
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-3 gap-2">
                                        <template x-for="role in systemRoles.fg || []" :key="'fg-' + role">
                                            <label class="flex items-center p-2 border rounded hover:bg-purple-50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    :value="'fg.' + role"
                                                    x-model="createSSOForm.selectedRoles"
                                                    class="mr-2 text-purple-600 focus:ring-purple-500">
                                                <span class="text-sm" x-text="role"></span>
                                            </label>
                                        </template>
                                    </div>
                                </div>

                                <!-- TUK System -->
                                <div class="border rounded-lg p-4 bg-gray-50">
                                    <div class="flex items-center mb-3">
                                        <i class="fas fa-certificate text-orange-600 mr-2"></i>
                                        <h5 class="font-semibold text-gray-900">TUK System</h5>
                                        <span class="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                            <span x-text="createSSOForm.selectedRoles.filter(r => r.startsWith('tuk.')).length"></span> roles selected
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-3 gap-2">
                                        <template x-for="role in systemRoles.tuk || []" :key="'tuk-' + role">
                                            <label class="flex items-center p-2 border rounded hover:bg-orange-50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    :value="'tuk.' + role"
                                                    x-model="createSSOForm.selectedRoles"
                                                    class="mr-2 text-orange-600 focus:ring-orange-500">
                                                <span class="text-sm" x-text="role"></span>
                                            </label>
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Summary Section -->
                        <div class="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h4 class="text-sm font-semibold text-yellow-900 mb-2">
                                <i class="fas fa-info-circle mr-1"></i>
                                Account Creation Summary
                            </h4>
                            <p class="text-xs text-yellow-700 mb-2">
                                User will be created with <span x-text="createSSOForm.selectedRoles.length" class="font-bold"></span> role account(s):
                            </p>
                            <div class="text-xs text-yellow-700">
                                • Each selected role creates a separate account in the target system<br>
                                • Each account gets unique email and password<br>
                                • Same name used across all accounts for consistency
                            </div>
                        </div>

                        <div class="flex justify-between">
                            <button
                                type="button"
                                @click="showCreateSSOModal = false"
                                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                :disabled="createSSOLoading"
                                class="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-150 flex items-center">
                                <i class="fas fa-plus-circle mr-2" x-show="!createSSOLoading"></i>
                                <i class="fas fa-spinner fa-spin mr-2" x-show="createSSOLoading"></i>
                                <span x-show="!createSSOLoading">Create User</span>
                                <span x-show="createSSOLoading">Creating...</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Edit SSO User Modal (System Access) -->
        <div x-show="showEditSSOModal"
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 overflow-y-auto z-50"
             style="display: none;">
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="fixed inset-0 bg-gray-900 bg-opacity-60 modal-backdrop transition-opacity duration-300" @click="showEditSSOModal = false"></div>

                <div class="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl transform transition-all"
                     x-transition:enter="transition ease-out duration-300"
                     x-transition:enter-start="opacity-0 transform scale-95 translate-y-4"
                     x-transition:enter-end="opacity-100 transform scale-100 translate-y-0"
                     x-transition:leave="transition ease-in duration-200"
                     x-transition:leave-start="opacity-100 transform scale-100 translate-y-0"
                     x-transition:leave-end="opacity-0 transform scale-95 translate-y-4">

                    <h3 class="text-lg font-semibold mb-2">
                        <i class="fas fa-user-cog mr-2"></i>
                        <span x-text="'Manage System Access for ' + editSSOForm.name"></span>
                    </h3>
                    <div class="mb-6">
                        <p class="text-sm text-gray-600 mb-1" x-text="'Email: ' + editSSOForm.email"></p>
                        <p class="text-sm text-gray-600" x-text="'SSO Role: ' + (editSSOForm.role || 'Not specified')"></p>
                    </div>

                    <div x-show="loading.systemAccess" class="text-center py-4">
                        <i class="fas fa-spinner fa-spin text-blue-500"></i>
                        <p class="text-sm text-gray-600 mt-2">Loading system access...</p>
                    </div>

                    <form @submit.prevent="performSyncSystems()" x-show="!loading.systemAccess">
                        <!-- Role Management by System -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-3">
                                <i class="fas fa-user-tag mr-1"></i>
                                Manage Roles per System
                            </label>

                            <div class="space-y-4">
                                <!-- BALAI System Roles -->
                                <div class="border rounded-lg p-4 bg-gray-50">
                                    <div class="flex items-center mb-3">
                                        <i class="fas fa-building text-blue-600 mr-2"></i>
                                        <h5 class="font-semibold text-gray-900">BALAI System</h5>
                                        <span class="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            <span x-text="editSSOForm.selectedRoles.filter(r => r.startsWith('balai.')).length"></span> roles
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-3 gap-2">
                                        <template x-for="role in systemRoles.balai || []" :key="'balai-edit-' + role">
                                            <label class="flex items-center p-2 border rounded hover:bg-blue-50 cursor-pointer transition-colors"
                                                  :class="editSSOForm.selectedRoles.includes('balai.' + role) ? 'bg-blue-100 border-blue-300' : ''">
                                                <input
                                                    type="checkbox"
                                                    :value="'balai.' + role"
                                                    x-model="editSSOForm.selectedRoles"
                                                    class="mr-2 text-blue-600 focus:ring-blue-500">
                                                <span class="text-sm" x-text="role"></span>
                                            </label>
                                        </template>
                                    </div>
                                </div>

                                <!-- REGULER System Roles -->
                                <div class="border rounded-lg p-4 bg-gray-50">
                                    <div class="flex items-center mb-3">
                                        <i class="fas fa-graduation-cap text-green-600 mr-2"></i>
                                        <h5 class="font-semibold text-gray-900">REGULER System</h5>
                                        <span class="ml-auto text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                            <span x-text="editSSOForm.selectedRoles.filter(r => r.startsWith('reguler.')).length"></span> roles
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-3 gap-2">
                                        <template x-for="role in systemRoles.reguler || []" :key="'reguler-edit-' + role">
                                            <label class="flex items-center p-2 border rounded hover:bg-green-50 cursor-pointer transition-colors"
                                                  :class="editSSOForm.selectedRoles.includes('reguler.' + role) ? 'bg-green-100 border-green-300' : ''">
                                                <input
                                                    type="checkbox"
                                                    :value="'reguler.' + role"
                                                    x-model="editSSOForm.selectedRoles"
                                                    class="mr-2 text-green-600 focus:ring-green-500">
                                                <span class="text-sm" x-text="role"></span>
                                            </label>
                                        </template>
                                    </div>
                                </div>

                                <!-- FG System Roles -->
                                <div class="border rounded-lg p-4 bg-gray-50">
                                    <div class="flex items-center mb-3">
                                        <i class="fas fa-flask text-purple-600 mr-2"></i>
                                        <h5 class="font-semibold text-gray-900">FG System</h5>
                                        <span class="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                            <span x-text="editSSOForm.selectedRoles.filter(r => r.startsWith('fg.')).length"></span> roles
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-3 gap-2">
                                        <template x-for="role in systemRoles.fg || []" :key="'fg-edit-' + role">
                                            <label class="flex items-center p-2 border rounded hover:bg-purple-50 cursor-pointer transition-colors"
                                                  :class="editSSOForm.selectedRoles.includes('fg.' + role) ? 'bg-purple-100 border-purple-300' : ''">
                                                <input
                                                    type="checkbox"
                                                    :value="'fg.' + role"
                                                    x-model="editSSOForm.selectedRoles"
                                                    class="mr-2 text-purple-600 focus:ring-purple-500">
                                                <span class="text-sm" x-text="role"></span>
                                            </label>
                                        </template>
                                    </div>
                                </div>

                                <!-- TUK System Roles -->
                                <div class="border rounded-lg p-4 bg-gray-50">
                                    <div class="flex items-center mb-3">
                                        <i class="fas fa-certificate text-orange-600 mr-2"></i>
                                        <h5 class="font-semibold text-gray-900">TUK System</h5>
                                        <span class="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                            <span x-text="editSSOForm.selectedRoles.filter(r => r.startsWith('tuk.')).length"></span> roles
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-3 gap-2">
                                        <template x-for="role in systemRoles.tuk || []" :key="'tuk-edit-' + role">
                                            <label class="flex items-center p-2 border rounded hover:bg-orange-50 cursor-pointer transition-colors"
                                                  :class="editSSOForm.selectedRoles.includes('tuk.' + role) ? 'bg-orange-100 border-orange-300' : ''">
                                                <input
                                                    type="checkbox"
                                                    :value="'tuk.' + role"
                                                    x-model="editSSOForm.selectedRoles"
                                                    class="mr-2 text-orange-600 focus:ring-orange-500">
                                                <span class="text-sm" x-text="role"></span>
                                            </label>
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Current Accounts Display -->
                        <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h4 class="text-sm font-semibold text-blue-900 mb-2">
                                <i class="fas fa-info-circle mr-1"></i>
                                Current Accounts
                            </h4>
                            <div class="text-xs text-blue-700 space-y-1">
                                <template x-for="account in currentUserAccounts" :key="'account-' + account.id">
                                    <div class="flex items-center justify-between py-1 border-b border-blue-100 last:border-0">
                                        <span>
                                            <strong x-text="account.system.toUpperCase()"></strong> -
                                            <span x-text="account.role"></span>
                                        </span>
                                        <span class="text-blue-600" x-text="account.email"></span>
                                    </div>
                                </template>
                                <div x-show="currentUserAccounts.length === 0" class="text-center py-2 text-blue-600">
                                    No accounts created yet
                                </div>
                            </div>
                        </div>

                        <!-- Info Section -->
                        <div class="mb-6 p-4 bg-yellow-50 rounded-lg">
                            <h4 class="text-sm font-semibold text-yellow-900 mb-2">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                Important Notes
                            </h4>
                            <ul class="text-xs text-yellow-700 space-y-1">
                                <li>• <strong>Check Role = Create Account</strong>: New account will be created with that role</li>
                                <li>• <strong>Uncheck Role = Delete Account</strong>: Account with that role will be deleted</li>
                                <li>• Multiple roles per system = Multiple accounts with different emails</li>
                                <li>• Each account gets unique email and password for security</li>
                                <li>• Same name used across all accounts for consistency</li>
                            </ul>
                        </div>

                        <div class="flex justify-between">
                            <button
                                type="button"
                                @click="showEditSSOModal = false"
                                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                :disabled="syncSystemsLoading"
                                class="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 disabled:opacity-50 transition-all duration-150 flex items-center">
                                <i class="fas fa-sync-alt mr-2" x-show="!syncSystemsLoading"></i>
                                <i class="fas fa-spinner fa-spin mr-2" x-show="syncSystemsLoading"></i>
                                <span x-show="!syncSystemsLoading">Sync Systems</span>
                                <span x-show="syncSystemsLoading">Syncing...</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Add Main User Modal -->
        <div x-show="showAddMainUserModal"
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 overflow-y-auto z-50"
             style="display: none;">
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="fixed inset-0 bg-gray-900 bg-opacity-60 modal-backdrop transition-opacity duration-300" @click="showAddMainUserModal = false"></div>

                <div class="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all"
                     x-transition:enter="transition ease-out duration-300"
                     x-transition:enter-start="opacity-0 transform scale-95 translate-y-4"
                     x-transition:enter-end="opacity-100 transform scale-100 translate-y-0"
                     x-transition:leave="transition ease-in duration-200"
                     x-transition:leave-start="opacity-100 transform scale-100 translate-y-0"
                     x-transition:leave-end="opacity-0 transform scale-95 translate-y-4">
                    <h3 class="text-lg font-semibold mb-4">
                        <i class="fas fa-user-plus mr-2"></i>Add New Main User
                    </h3>
                    <p class="text-sm text-gray-600 mb-4">Create a new SSO user account</p>

                    <form @submit.prevent="performAddMainUser()">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <div class="relative">
                                <input
                                    type="text"
                                    x-model="addMainUserForm.name"
                                    @input="searchUserNames($event.target.value)"
                                    @focus="searchUserNames($event.target.value)"
                                    @click.stop
                                    required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Type to search or enter custom name...">

                                <!-- Autocomplete Dropdown -->
                                <div x-show="searchResults.length > 0 && showUserSearchDropdown"
                                     @click.away="showUserSearchDropdown = false"
                                     x-transition:enter="transition ease-out duration-200"
                                     x-transition:enter-start="opacity-0 transform scale-95"
                                     x-transition:enter-end="opacity-100 transform scale-100"
                                     class="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-80 overflow-hidden">
                                    <!-- Header -->
                                    <div class="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                        <p class="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <i class="fas fa-search mr-1"></i>
                                            <span x-text="searchResults.length"></span> User(s) Found
                                        </p>
                                    </div>

                                    <!-- Results Container -->
                                    <div class="max-h-64 overflow-y-auto">
                                        <template x-for="(result, index) in searchResults" :key="'search-' + index">
                                            <div @click="selectUser(result)"
                                                 class="group px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-150 border-l-4 hover:border-l-blue-500"
                                                 :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'">

                                                <!-- Name Section -->
                                                <div class="flex items-center justify-between">
                                                    <div class="flex-1">
                                                        <div class="flex items-center">
                                                            <div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold">
                                                                <span x-text="result.name.charAt(0).toUpperCase()"></span>
                                                            </div>
                                                            <div>
                                                                <div class="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors"
                                                                     x-text="result.name"></div>
                                                                <div class="text-xs text-gray-500 mt-0.5">
                                                                    <i class="fas fa-database mr-1"></i>
                                                                    Available in <span x-text="result.systems.length" /> system(s)
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="text-gray-400 group-hover:text-blue-500 transition-colors">
                                                        <i class="fas fa-chevron-right"></i>
                                                    </div>
                                                </div>

                                                <!-- Systems Section -->
                                                <div class="mt-3 flex flex-wrap gap-1.5" x-show="result.systems.length > 0">
                                                    <template x-for="system in result.systems" :key="system.name">
                                                        <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-150"
                                                             :class="system.name === 'balai' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                                                                        system.name === 'reguler' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                                                                        system.name === 'fg' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white' :
                                                                        'bg-gradient-to-r from-red-500 to-red-600 text-white'">
                                                            <i class="fas fa-server mr-1 text-xs"></i>
                                                            <span x-text="system.display" class="font-bold"></span>
                                                            <span class="ml-1 opacity-90" x-text="'• ' + system.role"></span>
                                                        </div>
                                                    </template>
                                                </div>
                                            </div>
                                        </template>

                                        <!-- No Results State (handled by empty array) -->
                                    </div>

                                    <!-- Footer -->
                                    <div class="px-4 py-2 bg-gray-50 border-t border-gray-200">
                                        <p class="text-xs text-gray-500 italic">
                                            <i class="fas fa-info-circle mr-1"></i>
                                            Click to select or continue typing for more results
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <p class="mt-1 text-xs text-gray-500">Search for existing users from all databases or enter a custom name</p>
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                x-model="addMainUserForm.email"
                                required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                x-model="addMainUserForm.password"
                                required
                                minlength="6"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                x-model="addMainUserForm.password_confirmation"
                                required
                                minlength="6"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                x-model="addMainUserForm.role"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>

                        <div class="flex justify-end gap-3">
                            <button
                                type="button"
                                @click="showAddMainUserModal = false"
                                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                :disabled="addMainUserLoading"
                                class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
                                <span x-show="!addMainUserLoading">Create User</span>
                                <span x-show="addMainUserLoading">Creating...</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Update Names Modal for SSO Users -->
        <div x-show="showUpdateNamesModal"
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 overflow-y-auto z-50"
             style="display: none;">
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75" @click="showUpdateNamesModal = false"></div>

                <div class="relative bg-white rounded-lg max-w-md w-full p-6">
                    <h3 class="text-lg font-semibold mb-4">
                        <i class="fas fa-edit mr-2"></i>Update Names
                    </h3>
                    <p class="text-sm text-gray-600 mb-4">Update names for <span x-text="selectedSSOUsers.length" class="font-semibold"></span> selected users</p>

                    <div x-show="updateNamesResults.length === 0">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">New Name</label>
                            <div class="relative">
                                <input
                                    type="text"
                                    x-model="updateNamesForm.new_name"
                                    @input="searchUserNames($event.target.value)"
                                    @focus="searchUserNames($event.target.value)"
                                    @click.stop
                                    required
                                    placeholder="Type to search or enter new name..."
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">

                                <!-- Autocomplete Dropdown -->
                                <div x-show="searchResults.length > 0 && showUserSearchDropdown"
                                     @click.away="showUserSearchDropdown = false"
                                     x-transition:enter="transition ease-out duration-200"
                                     x-transition:enter-start="opacity-0 transform scale-95"
                                     x-transition:enter-end="opacity-100 transform scale-100"
                                     class="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-80 overflow-hidden">
                                    <!-- Header -->
                                    <div class="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                        <p class="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <i class="fas fa-search mr-1"></i>
                                            <span x-text="searchResults.length"></span> User(s) Found
                                        </p>
                                    </div>

                                    <!-- Results Container -->
                                    <div class="max-h-64 overflow-y-auto">
                                        <template x-for="(result, index) in searchResults" :key="'search-' + index">
                                            <div @click="selectUserForUpdate(result)"
                                                 class="group px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-150 border-l-4 hover:border-l-blue-500"
                                                 :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'">

                                                <!-- Name Section -->
                                                <div class="flex items-center justify-between">
                                                    <div class="flex-1">
                                                        <div class="flex items-center">
                                                            <div class="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold">
                                                                <span x-text="result.name.charAt(0).toUpperCase()"></span>
                                                            </div>
                                                            <div>
                                                                <div class="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors"
                                                                     x-text="result.name"></div>
                                                                <div class="text-xs text-gray-500 mt-0.5">
                                                                    <i class="fas fa-database mr-1"></i>
                                                                    Available in <span x-text="result.systems.length" /> system(s)
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="text-gray-400 group-hover:text-indigo-500 transition-colors">
                                                        <i class="fas fa-chevron-right"></i>
                                                    </div>
                                                </div>

                                                <!-- Systems Section -->
                                                <div class="mt-3 flex flex-wrap gap-1.5" x-show="result.systems.length > 0">
                                                    <template x-for="system in result.systems" :key="system.name">
                                                        <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-150"
                                                             :class="system.name === 'balai' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                                                                        system.name === 'reguler' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                                                                        system.name === 'fg' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white' :
                                                                        'bg-gradient-to-r from-red-500 to-red-600 text-white'">
                                                            <i class="fas fa-server mr-1 text-xs"></i>
                                                            <span x-text="system.display" class="font-bold"></span>
                                                            <span class="ml-1 opacity-90" x-text="'• ' + system.role"></span>
                                                        </div>
                                                    </template>
                                                </div>
                                            </div>
                                        </template>
                                    </div>

                                    <!-- Footer -->
                                    <div class="px-4 py-2 bg-gray-50 border-t border-gray-200">
                                        <p class="text-xs text-gray-500 italic">
                                            <i class="fas fa-info-circle mr-1"></i>
                                            Click to select or continue typing for more results
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <p class="mt-1 text-xs text-gray-500">Search for existing names from all databases or enter a custom name</p>
                        </div>
                    </div>

                    <!-- Results Display -->
                    <div x-show="updateNamesResults.length > 0" class="mb-4 max-h-60 overflow-y-auto">
                        <h4 class="font-semibold mb-2">Update Results:</h4>
                        <div class="space-y-2">
                            <template x-for="result in updateNamesResults" :key="result.id">
                                <div class="p-3 rounded border"
                                     :class="result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                                    <div class="text-sm">
                                        <div class="font-medium" x-text="result.email"></div>
                                        <div class="text-xs text-gray-600">
                                            <span class="line-through" x-text="result.old_name"></span>
                                            <span class="mx-2">→</span>
                                            <span class="text-green-600" x-text="result.new_name"></span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3">
                        <button
                            type="button"
                            @click="showUpdateNamesModal = false; updateNamesResults = []"
                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                            <span x-show="updateNamesResults.length === 0">Cancel</span>
                            <span x-show="updateNamesResults.length > 0">Close</span>
                        </button>
                        <button
                            x-show="updateNamesResults.length === 0"
                            @click="performUpdateNames()"
                            :disabled="updateNamesLoading"
                            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                            <span x-show="!updateNamesLoading">Update Names</span>
                            <span x-show="updateNamesLoading">Updating...</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Main Account Modal -->
        <div x-show="showCreateMainAccountModal"
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 overflow-y-auto z-50"
             style="display: none;">
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75" @click="showCreateMainAccountModal = false"></div>

                <div class="relative bg-white rounded-lg max-w-md w-full p-6">
                    <h3 class="text-lg font-semibold mb-4">👤 Create Main Account</h3>
                    <p class="text-sm text-gray-600 mb-4">Create main SSO account for <span x-text="selectedTargetUser?.name" class="font-semibold"></span></p>

                    <form @submit.prevent="performCreateMainAccount()">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                x-model="createMainAccountForm.email"
                                required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                x-model="createMainAccountForm.name"
                                required
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                x-model="createMainAccountForm.password"
                                required
                                minlength="6"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                x-model="createMainAccountForm.password_confirmation"
                                required
                                minlength="6"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>

                        <div class="flex justify-end gap-3">
                            <button
                                type="button"
                                @click="showCreateMainAccountModal = false"
                                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                :disabled="createMainAccountLoading"
                                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                                <span x-show="!createMainAccountLoading">Create Account</span>
                                <span x-show="createMainAccountLoading">Creating...</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Bulk Name Update Modal -->
        <div x-show="showBulkNameModal"
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 overflow-y-auto z-50"
             style="display: none;">
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75" @click="showBulkNameModal = false"></div>

                <div class="relative bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                    <h3 class="text-lg font-semibold mb-4">
                        <i class="fas fa-edit mr-2"></i>Bulk Update Names for SSO Standardization
                    </h3>
                    <p class="text-sm text-gray-600 mb-4">Update names for <span x-text="selectedBrowseUsers.length" class="font-semibold"></span> selected users to improve SSO name matching</p>

                    <form @submit.prevent="performBulkNameUpdate()">
                        <div x-show="bulkNameResults.length === 0">
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700 mb-1">New Name</label>
                                <input
                                    type="text"
                                    x-model="bulkNameForm.new_name"
                                    required
                                    placeholder="Enter the standardized name..."
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <p class="mt-1 text-xs text-gray-500">This name will be applied to all selected users</p>
                            </div>

                            <!-- Preview Selected Users -->
                            <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                                <h4 class="font-medium text-sm mb-2">Selected Users:</h4>
                                <div class="max-h-32 overflow-y-auto space-y-1">
                                    <template x-for="userStr in selectedBrowseUsers.slice(0, 10)" :key="userStr">
                                        <div class="flex justify-between text-xs">
                                            <template x="const user = JSON.parse(userStr);">
                                                <span x-text="user.system.toUpperCase() + ' - ID: ' + user.user_id"></span>
                                            </template>
                                        </div>
                                    </template>
                                    <div x-show="selectedBrowseUsers.length > 10" class="text-xs text-gray-500">
                                        ... and <span x-text="selectedBrowseUsers.length - 10"></span> more
                                    </div>
                                </div>
                            </div>

                            <div class="mb-4">
                                <h4 class="font-medium text-sm mb-2">Update Locations:</h4>

                                <!-- SSO Update -->
                                <div class="mb-3">
                                    <label class="flex items-center">
                                        <input
                                            type="checkbox"
                                            x-model="bulkNameForm.update_sso"
                                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                        <span class="ml-2 text-sm text-gray-700">Update names in SSO system</span>
                                    </label>
                                </div>

                                <!-- Target Systems Update -->
                                <div class="mb-3">
                                    <label class="flex items-center">
                                        <input
                                            type="checkbox"
                                            x-model="bulkNameForm.update_target_systems"
                                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                        <span class="ml-2 text-sm text-gray-700">Update names in target systems</span>
                                    </label>
                                </div>

                                <!-- System Selection -->
                                <div x-show="bulkNameForm.update_target_systems" class="ml-6 space-y-2">
                                    <label class="flex items-center text-sm">
                                        <input
                                            type="checkbox"
                                            value="balai"
                                            x-model="bulkNameForm.target_systems"
                                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                        <span class="ml-2">Balai</span>
                                    </label>
                                    <label class="flex items-center text-sm">
                                        <input
                                            type="checkbox"
                                            value="reguler"
                                            x-model="bulkNameForm.target_systems"
                                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                        <span class="ml-2">Reguler</span>
                                    </label>
                                    <label class="flex items-center text-sm">
                                        <input
                                            type="checkbox"
                                            value="fg"
                                            x-model="bulkNameForm.target_systems"
                                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                        <span class="ml-2">FG</span>
                                    </label>
                                    <label class="flex items-center text-sm">
                                        <input
                                            type="checkbox"
                                            value="tuk"
                                            x-model="bulkNameForm.target_systems"
                                            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                        <span class="ml-2">TUK</span>
                                    </label>
                                    <p class="text-xs text-gray-500">Only users from selected systems will be updated</p>
                                </div>
                            </div>
                        </div>

                        <!-- Update Results -->
                        <div x-show="bulkNameResults.length > 0" class="mb-4 max-h-96 overflow-y-auto">
                            <h4 class="font-semibold mb-2">Update Results:</h4>
                            <div class="space-y-2">
                                <template x-for="result in bulkNameResults" :key="result.system + '_' + result.target_user_id">
                                    <div class="p-3 rounded border"
                                         :class="result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                                        <div class="flex items-start justify-between">
                                            <div class="flex-1">
                                                <div class="flex items-center mb-1">
                                                    <span x-text="result.status === 'success' ? '✅' : '❌'" class="mr-2"></span>
                                                    <span class="font-medium text-sm" x-text="result.system.toUpperCase()"></span>
                                                    <span class="text-xs text-gray-500 ml-2" x-text="'ID: ' + result.target_user_id"></span>
                                                </div>
                                                <div class="text-xs text-gray-600 mb-1">
                                                    <span x-text="result.target_email"></span>
                                                </div>
                                                <div class="text-xs">
                                                    <span class="line-through text-gray-500" x-text="result.old_name"></span>
                                                    <span class="mx-2">→</span>
                                                    <span class="font-medium text-green-600" x-text="result.new_name"></span>
                                                </div>
                                                <div x-show="result.updates.length > 0" class="mt-1 text-xs text-blue-600">
                                                    Updates: <span x-text="result.updates.join(', ')"></span>
                                                </div>
                                                <div x-show="result.status === 'error'" class="mt-1 text-xs text-red-600">
                                                    Error: <span x-text="result.message"></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </div>

                        <div class="flex justify-end gap-3">
                            <button
                                type="button"
                                @click="showBulkNameModal = false; bulkNameResults = []"
                                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                <span x-show="bulkNameResults.length === 0">Cancel</span>
                                <span x-show="bulkNameResults.length > 0">Close</span>
                            </button>
                            <button
                                type="submit"
                                :disabled="bulkNameLoading || bulkNameResults.length > 0"
                                class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                                <span x-show="!bulkNameLoading">Update Names</span>
                                <span x-show="bulkNameLoading">Updating...</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <!-- Edit User Floating Modal -->
        <div x-show="showEditUserModal"
             x-transition:enter="transition ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 z-50 overflow-y-auto"
             style="display: none;">
            <!-- Overlay -->
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="fixed inset-0 bg-black bg-opacity-50" @click="showEditUserModal = false"></div>

                <!-- Modal Content -->
                <div class="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 my-8"
                     x-transition:enter="transition ease-out duration-300"
                     x-transition:enter-start="opacity-0 transform scale-95"
                     x-transition:enter-end="opacity-100 transform scale-100">

                    <!-- Header -->
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-user-edit text-white text-lg"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-gray-800">Edit User</h3>
                                <p class="text-sm text-gray-500">Update user information</p>
                            </div>
                        </div>
                        
                    </div>

                    <!-- Form -->
                    <form @submit.prevent="updateUser()">
                        <!-- User ID Display -->
                        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p class="text-sm text-gray-600">User ID: <span class="font-semibold text-gray-800" x-text="editUserForm.id"></span></p>
                        </div>

                        <!-- Name Field with Autocomplete -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-user mr-1"></i>Name
                            </label>
                            <div class="relative">
                                <input
                                    type="text"
                                    x-model="editUserForm.name"
                                    @input="searchUserNames($event.target.value)"
                                    @focus="searchUserNames($event.target.value)"
                                    @click.stop
                                    required
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">

                                <!-- Reuse the same autocomplete dropdown -->
                                <div x-show="searchResults.length > 0 && showUserSearchDropdown"
                                     @click.away="showUserSearchDropdown = false"
                                     x-transition:enter="transition ease-out duration-200"
                                     x-transition:enter-start="opacity-0 transform scale-95"
                                     x-transition:enter-end="opacity-100 transform scale-100"
                                     class="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-80 overflow-hidden">
                                    <!-- Header -->
                                    <div class="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                        <p class="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <i class="fas fa-search mr-1"></i>
                                            <span x-text="searchResults.length"></span> User(s) Found
                                        </p>
                                    </div>

                                    <!-- Results Container -->
                                    <div class="max-h-64 overflow-y-auto">
                                        <template x-for="(result, index) in searchResults" :key="'edit-search-' + index">
                                            <div @click="selectUserForEdit(result)"
                                                 class="group px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-150 border-l-4 hover:border-l-blue-500"
                                                 :class="index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'">
                                                <div class="flex items-center justify-between">
                                                    <div class="flex-1">
                                                        <div class="flex items-center">
                                                            <div class="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold">
                                                                <span x-text="result.name.charAt(0).toUpperCase()"></span>
                                                            </div>
                                                            <div>
                                                                <div class="font-semibold text-gray-800 group-hover:text-purple-600 transition-colors"
                                                                     x-text="result.name"></div>
                                                                <div class="text-xs text-gray-500 mt-0.5">
                                                                    <i class="fas fa-database mr-1"></i>
                                                                    Available in <span x-text="result.systems.length" /> system(s)
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="text-gray-400 group-hover:text-purple-500 transition-colors">
                                                        <i class="fas fa-chevron-right"></i>
                                                    </div>
                                                </div>

                                                <div class="mt-3 flex flex-wrap gap-1.5" x-show="result.systems.length > 0">
                                                    <template x-for="system in result.systems" :key="system.name">
                                                        <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-150"
                                                             :class="system.name === 'balai' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                                                                        system.name === 'reguler' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                                                                        system.name === 'fg' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white' :
                                                                        'bg-gradient-to-r from-red-500 to-red-600 text-white'">
                                                            <i class="fas fa-server mr-1 text-xs"></i>
                                                            <span x-text="system.display" class="font-bold"></span>
                                                            <span class="ml-1 opacity-90" x-text="'• ' + system.role"></span>
                                                        </div>
                                                    </template>
                                                </div>
                                            </div>
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Email Field -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-envelope mr-1"></i>Email
                            </label>
                            <input
                                type="email"
                                x-model="editUserForm.email"
                                required
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>

                        <!-- Password Update Section -->
                        <div class="mb-6">
                            <div class="flex items-center justify-between mb-2">
                                <label class="block text-sm font-medium text-gray-700">
                                    <i class="fas fa-lock mr-1"></i>Password
                                </label>
                                <button type="button" @click="editUserForm.showPassword = !editUserForm.showPassword"
                                        class="text-xs text-blue-600 hover:text-blue-700">
                                    <i class="fas fa-eye mr-1"></i>
                                    <span x-text="editUserForm.showPassword ? 'Hide' : 'Show'"></span>
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mb-2">Leave blank to keep current password</p>
                            <div x-show="!editUserForm.showPassword">
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    disabled
                                    class="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                            </div>
                            <div x-show="editUserForm.showPassword" x-transition>
                                <input
                                    type="password"
                                    x-model="editUserForm.password"
                                    placeholder="Enter new password"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2">
                                <input
                                    type="password"
                                    x-model="editUserForm.password_confirmation"
                                    placeholder="Confirm new password"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        </div>

                        <!-- Role Field -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-user-tag mr-1"></i>Role
                            </label>
                            <select
                                x-model="editUserForm.role"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>

                        <!-- Status Field -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-toggle-on mr-1"></i>Status
                            </label>
                            <div class="flex gap-4">
                                <label class="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        x-model="editUserForm.status"
                                        value="active"
                                        class="mr-2 text-blue-600 focus:ring-blue-500">
                                    <span class="text-sm text-gray-700">Active</span>
                                </label>
                                <label class="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        x-model="editUserForm.status"
                                        value="inactive"
                                        class="mr-2 text-blue-600 focus:ring-blue-500">
                                    <span class="text-sm text-gray-700">Inactive</span>
                                </label>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                @click="deleteUser()"
                                :disabled="editUserLoading"
                                class="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-150 flex items-center">
                                <i class="fas fa-trash mr-2"></i>
                                Delete User
                            </button>
                                <button
                                    type="submit"
                                    :disabled="editUserLoading"
                                    class="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-150 flex items-center">
                                    <i class="fas fa-save mr-2" x-show="!editUserLoading"></i>
                                    <i class="fas fa-spinner fa-spin mr-2" x-show="editUserLoading"></i>
                                    <span x-show="!editUserLoading">Save Changes</span>
                                    <span x-show="editUserLoading">Saving...</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>

    <!-- Include UI Components -->
    <x-ui.alert />
    <x-ui.confirm-dialog />

    <!-- Include global functions -->
    <script src="{{ asset('js/global-functions.js') }}"></script>

    </body>

    <script>
        function userManagement() {
            return {
                // Tab management
                managementTabs: [
                    { key: 'sso', label: 'SSO Users', icon: 'fas fa-shield-halved' },
                    { key: 'browse', label: 'Browse Users', icon: 'fas fa-users' }
                ],
                activeTab: 'sso',

                // Browse users
                systems: ['all', 'balai', 'reguler', 'fg', 'tuk'],
                activeSystem: 'all',
                users: { data: [] },
                search: '',
                systemStats: {},
                loading: {
                    ssoUsers: false,
                    browseUsers: false,
                    systemAccess: false
                },
                selectedBrowseUsers: [],

                // Update Names modal variables
                showUpdateNamesModal: false,
                updateNamesResults: [],
                updateNamesLoading: false,
                updateNamesForm: {
                    new_name: ''
                },

                // Search variables
                searchResults: [],
                showUserSearchDropdown: false,
                searchTimeout: null,

                // SSO Users
                selectedSSOUsers: [],
                ssoUsers: { data: [] },

                // Animation helpers
                initAnimations() {
                    // Add stagger animation to elements
                    const animateElements = document.querySelectorAll('.animate-slide-in-left, .animate-slide-in-right, .animate-slide-in-top, .animate-slide-in-bottom');
                    animateElements.forEach((el, index) => {
                        el.style.animationDelay = `${index * 0.1}s`;
                    });
                },

                switchTab(tabKey, index) {
                    this.activeTab = tabKey;
                    // Add ripple effect
                    this.createRipple(event);
                },

                createRipple(event) {
                    if (!event || !event.currentTarget) return;

                    const button = event.currentTarget;
                    const ripple = document.createElement('span');
                    const rect = button.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = event.clientX - rect.left - size / 2;
                    const y = event.clientY - rect.top - size / 2;

                    ripple.style.width = ripple.style.height = size + 'px';
                    ripple.style.left = x + 'px';
                    ripple.style.top = y + 'px';
                    ripple.classList.add('ripple');

                    button.appendChild(ripple);

                    setTimeout(() => {
                        ripple.remove();
                    }, 600);
                },

                // SSO users
                ssoUsers: { data: [] },
                ssoSearch: '',
                ssoStatusFilter: 'all',

                // Modals
                showCreateModal: false,
                showMassUpdateModal: false,
                showImportModal: false,
                showCreateMainAccountModal: false,

                // Form data
                createSystem: '',
                systemRoles: [],
                createLoading: false,
                createUserForm: {
                    email: '',
                    name: '',
                    role: '',
                    password: '',
                    username: ''
                },

                massUpdateLoading: false,
                massUpdateForm: {
                    operation: '',
                    new_role: '',
                    send_email: false
                },

                importLoading: false,
                importForm: {
                    default_password: '',
                    create_password: false
                },
                importResults: [],

                // Bulk name update
                showBulkNameModal: false,
                bulkNameLoading: false,
                bulkNameForm: {
                    new_name: '',
                    update_sso: false,
                    update_target_systems: false,
                    target_systems: []
                },

                // Delete users
                deleteLoading: false,

                // Edit Browse User Modal
                showEditBrowseUserModal: false,
                editBrowseUserLoading: false,
                editBrowseUserForm: {
                    id: null,
                    name: '',
                    email: '',
                    role: '',
                    system: '',
                    showPassword: false,
                    password: '',
                    password_confirmation: ''
                },

                // Edit User Modal
                showEditUserModal: false,
                editUserForm: {
                    id: null,
                    name: '',
                    email: '',
                    role: 'user',
                    system: '',
                    changePassword: false,
                    password: '',
                    password_confirmation: ''
                },
                bulkNameResults: [],

                // Create main account modal
                selectedTargetUser: null,
                createMainAccountLoading: false,
                createMainAccountForm: {
                    email: '',
                    name: '',
                    password: '',
                    password_confirmation: ''
                },

                // Add Main User modal
                showAddMainUserModal: false,
                addMainUserLoading: false,
                addMainUserForm: {
                    name: '',
                    email: '',
                    password: '',
                    password_confirmation: '',
                    role: 'user'
                },

                // Create SSO User modal
                showCreateSSOModal: false,
                createSSOLoading: false,
                createSSOForm: {
                    name: '',
                    email: '',
                    password: '',
                    password_confirmation: '',
                    role: 'user',
                    selectedRoles: []
                },

                // Edit SSO User modal
                showEditSSOModal: false,
                syncSystemsLoading: false,
                systemAccessOptions: [],
                currentUserAccounts: [],
                editSSOForm: {
                    id: null,
                    name: '',
                    email: '',
                    role: '',
                    selectedRoles: []
                },

                // System roles configuration (based on real database)
                systemRoles: {
                    balai: ['adm_tuk', 'adm_pusat', 'prometheus', 'banned', 'keuangan'],
                    reguler: ['adm_tuk', 'adm_tuk_bpc', 'adm_pusat', 'prometheus', 'keuangan'],
                    fg: ['adm_tuk', 'adm_pusat', 'prometheus', 'keuangan'],
                    tuk: ['ketua_tuk', 'verifikator', 'validator', 'admin_lsp', 'admin', 'direktur']
                },


                // Autocomplete search
                searchResults: [],
                showUserSearchDropdown: false,
                searchTimeout: null,

                // Edit User modal
                showEditUserModal: false,
                editUserLoading: false,
                editUserForm: {
                    id: null,
                    name: '',
                    email: '',
                    role: 'user',
                    status: 'active',
                    password: '',
                    password_confirmation: '',
                    showPassword: false
                },

                init() {
                    console.log('Initializing user management...');
                    this.loadUsers();
                    this.loadSystemStats();
                    this.loadSSOUsers();

                    // Add click outside listener
                    document.addEventListener('click', this.handleClickOutside.bind(this));

                    // Debug: Watch for tab changes
                    this.$watch('activeTab', (value) => {
                        console.log('Active tab changed to:', value);
                        if (value === 'sso') {
                            console.log('SSO Users data:', this.ssoUsers);
                        }
                    });
                },

                
                switchDatabase(system) {
                    console.log('Switching to system:', system, 'from:', this.activeSystem);
                    if (system !== this.activeSystem) {
                        this.activeSystem = system;
                        this.search = ''; // Clear search when switching databases
                        this.selectedBrowseUsers = []; // Clear selection when switching
                        console.log('Loading users for system:', this.activeSystem);
                        this.loadUsers();
                    }
                },

                async loadUsers() {
                    try {
                        console.log('Loading users for:', this.activeSystem, 'search:', this.search);
                        const response = await fetch(`/admin/users/${this.activeSystem}?search=${this.search}`);
                        const data = await response.json();
                        console.log('Received data:', data);
                        this.users = data;
                    } catch (error) {
                        console.error('Error loading users:', error);
                        this.users = { data: [] };
                    }
                },

                async loadSSOUsers() {
                    this.loading.ssoUsers = true;
                    try {
                        console.log('Loading SSO users...');
                        const params = new URLSearchParams({
                            search: this.ssoSearch,
                            per_page: 25
                        });

                        if (this.ssoStatusFilter !== 'all') {
                            params.append('status', this.ssoStatusFilter);
                        }

                        console.log('Fetching from:', `/admin/sso-users?${params}`);
                        const response = await fetch(`/admin/sso-users?${params}`);

                        if (!response.ok) {
                            console.error('Response not ok:', response.status, response.statusText);
                            this.ssoUsers = { data: [] };
                            return;
                        }

                        const data = await response.json();
                        console.log('SSO Users data:', data);
                        this.ssoUsers = data;
                    } catch (error) {
                        console.error('Error loading SSO users:', error);
                        this.ssoUsers = { data: [] };
                    } finally {
                        this.loading.ssoUsers = false;
                    }
                },

        
                async loadSystemStats() {
                    let totalUsers = 0;

                    for (const system of this.systems) {
                        if (system === 'all') {
                            this.systemStats[system] = '∑';
                            continue;
                        }

                        try {
                            const response = await fetch(`/admin/users/${system}?per_page=1`);
                            const data = await response.json();
                            this.systemStats[system] = data.total || 0;
                            totalUsers += data.total || 0;
                        } catch (error) {
                            this.systemStats[system] = '?';
                        }
                    }

                    this.systemStats['all'] = totalUsers;
                },

                async openCreateModal(system) {
                    this.createSystem = system;
                    this.showCreateModal = true;
                    this.createUserForm = {
                        email: '',
                        name: '',
                        role: '',
                        password: '',
                        username: ''
                    };

                    try {
                        const response = await fetch(`/admin/system-info/${system}`);
                        const data = await response.json();
                        this.systemRoles = data.roles || [];
                    } catch (error) {
                        this.systemRoles = [];
                    }
                },

                async createUser() {
                    this.createLoading = true;

                    try {
                        const response = await fetch('/admin/users/create', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify({
                                system: this.createSystem,
                                ...this.createUserForm
                            })
                        });

                        const result = await response.json();

                        if (result.success) {
                            showAlert('User created successfully!', 'success');
                            this.showCreateModal = false;
                            this.loadUsers();
                            this.loadSystemStats();
                        } else {
                            showAlert('Error: ' + result.message, 'error');
                        }
                    } catch (error) {
                        showAlert('Error creating user', 'error');
                    } finally {
                        this.createLoading = false;
                    }
                },

                toggleSelectAllImport(event) {
                    if (event.target.checked) {
                        this.selectedImportUsers = this.importUsers
                            .filter(user => user.can_import)
                            .map(user => JSON.stringify(user));
                    } else {
                        this.selectedImportUsers = [];
                    }
                },

                selectAllImportUsers() {
                    this.selectedImportUsers = this.importUsers
                        .filter(user => user.can_import)
                        .map(user => JSON.stringify(user));
                },

                openMassUpdateModal() {
                    this.massUpdateForm = {
                        operation: '',
                        new_role: '',
                        send_email: false
                    };
                    this.showMassUpdateModal = true;
                },

                async performMassUpdate() {
                    this.massUpdateLoading = true;

                    try {
                        const response = await fetch('/admin/mass-update', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify({
                                users: this.selectedSSOUsers.map(id => ({ id })),
                                operation: this.massUpdateForm.operation,
                                new_role: this.massUpdateForm.new_role,
                                send_email: this.massUpdateForm.send_email
                            })
                        });

                        const result = await response.json();

                        if (result.success) {
                            showAlert(`Mass update completed: ${result.summary.successful} successful, ${result.summary.errors} errors`, 'success');
                            this.showMassUpdateModal = false;
                            this.selectedSSOUsers = [];
                            this.loadSSOUsers();
                        } else {
                            showAlert('Error: ' + result.message, 'error');
                        }
                    } catch (error) {
                        showAlert('Error performing mass update', 'error');
                    } finally {
                        this.massUpdateLoading = false;
                    }
                },

                openImportModal() {
                    this.importResults = [];
                    this.importForm = {
                        default_password: '',
                        create_password: false
                    };
                    this.showImportModal = true;
                },

                async performImport() {
                    this.importLoading = true;

                    try {
                        const usersToImport = this.selectedImportUsers.map(userStr => JSON.parse(userStr));

                        const response = await fetch('/admin/import-users', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify({
                                users: usersToImport,
                                create_password: this.importForm.create_password,
                                default_password: this.importForm.default_password
                            })
                        });

                        const result = await response.json();

                        if (result.success) {
                            this.importResults = result.results;
                            this.selectedImportUsers = [];
                            this.loadImportUsers();
                        } else {
                            showAlert('Error: ' + result.message, 'error');
                        }
                    } catch (error) {
                        showAlert('Error importing users', 'error');
                    } finally {
                        this.importLoading = false;
                    }
                },

                openCreateMainAccountModal(user) {
                    this.selectedTargetUser = user;
                    this.createMainAccountForm = {
                        email: user.email,
                        name: user.name,
                        password: '',
                        password_confirmation: ''
                    };
                    this.showCreateMainAccountModal = true;
                },

                async performCreateMainAccount() {
                    if (this.createMainAccountForm.password !== this.createMainAccountForm.password_confirmation) {
                        showAlert('Passwords do not match', 'warning');
                        return;
                    }

                    this.createMainAccountLoading = true;

                    try {
                        const response = await fetch('/admin/create-main-account', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify({
                                system: this.selectedTargetUser.system,
                                user_id: this.selectedTargetUser.id,
                                ...this.createMainAccountForm
                            })
                        });

                        const result = await response.json();

                        if (result.success) {
                            showAlert('Main account created successfully!', 'success');
                            this.showCreateMainAccountModal = false;
                            this.loadImportUsers();
                            this.loadSSOUsers();
                        } else {
                            showAlert('Error: ' + result.message, 'error');
                        }
                    } catch (error) {
                        showAlert('Error creating main account', 'error');
                    } finally {
                        this.createMainAccountLoading = false;
                    }
                },

                // Bulk name update functions
                toggleSelectAllBrowse(event) {
                    if (event.target.checked) {
                        this.selectedBrowseUsers = this.users.data.map(user =>
                            JSON.stringify({id: user.id, system: user.system || this.activeSystem, user_id: user.id})
                        );
                    } else {
                        this.selectedBrowseUsers = [];
                    }
                },

                openBulkNameModal() {
                    this.bulkNameResults = [];
                    this.bulkNameForm = {
                        new_name: '',
                        update_sso: true,
                        update_target_systems: true,
                        target_systems: ['balai', 'reguler', 'fg', 'tuk']
                    };
                    this.showBulkNameModal = true;
                },

                // Add Main User functions
                openAddMainUserModal() {
                    this.addMainUserForm = {
                        name: '',
                        email: '',
                        password: '',
                        password_confirmation: '',
                        role: 'user'
                    };
                    this.showAddMainUserModal = true;
                },

                async performAddMainUser() {
                    if (this.addMainUserForm.password !== this.addMainUserForm.password_confirmation) {
                        showAlert('Passwords do not match', 'warning');
                        return;
                    }

                    this.addMainUserLoading = true;

                    try {
                        const response = await fetch('/admin/add-main-user', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify(this.addMainUserForm)
                        });

                        const result = await response.json();

                        if (result.success) {
                            showAlert('Main user created successfully!', 'success');
                            this.showAddMainUserModal = false;
                            this.loadSSOUsers();
                        } else {
                            showAlert('Error: ' + result.message, 'error');
                        }
                    } catch (error) {
                        showAlert('Error creating main user', 'error');
                    } finally {
                        this.addMainUserLoading = false;
                    }
                },

                // Create SSO User functions
                openCreateSSOModal() {
                    this.createSSOForm = {
                        name: '',
                        email: '',
                        password: '',
                        password_confirmation: '',
                        role: 'user',
                        selectedRoles: []
                    };
                    this.showCreateSSOModal = true;
                },

                async performCreateSSOUser() {
                    if (this.createSSOForm.password !== this.createSSOForm.password_confirmation) {
                        showAlert('Passwords do not match', 'warning');
                        return;
                    }

                    if (this.createSSOForm.selectedRoles.length === 0) {
                        showAlert('Please select at least one role', 'warning');
                        return;
                    }

                    this.createSSOLoading = true;

                    try {
                        const response = await fetch('/admin/sso-users/create-modular', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                            },
                            body: JSON.stringify({
                                name: this.createSSOForm.name,
                                email: this.createSSOForm.email,
                                password: this.createSSOForm.password,
                                password_confirmation: this.createSSOForm.password_confirmation,
                                role: this.createSSOForm.role,
                                selected_roles: this.createSSOForm.selectedRoles
                            })
                        });

                        const result = await response.json();

                        if (result.success) {
                            showAlert(`SSO user created successfully! Created ${result.accounts_created} role account(s).`, 'success');
                            this.showCreateSSOModal = false;
                            this.loadSSOUsers();

                            // Show injection results
                            if (result.injection_results) {
                                console.log('Account Creation Results:', result.injection_results);
                            }
                        } else {
                            showAlert('Error: ' + result.message, 'error');
                        }
                    } catch (error) {
                        showAlert('Error creating SSO user', 'error');
                        console.error('Create SSO User Error:', error);
                    } finally {
                        this.createSSOLoading = false;
                    }
                },

                // Edit SSO User functions
                async openEditSSOModal(user) {
                    this.editSSOForm = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role || 'user',
                        selectedRoles: []
                    };
                    this.currentUserAccounts = [];
                    this.showEditSSOModal = true;
                    this.loading.systemAccess = true;

                    try {
                        const response = await fetch(`/admin/sso-users/${user.id}/system-access`);
                        const result = await response.json();

                        if (result.success) {
                            this.currentUserAccounts = result.accounts || [];
                            this.editSSOForm.selectedRoles = result.current_roles || [];
                        } else {
                            showAlert('Error loading user accounts: ' + result.message, 'error');
                        }
                    } catch (error) {
                        showAlert('Error loading user accounts', 'error');
                        console.error('User Accounts Error:', error);
                    } finally {
                        this.loading.systemAccess = false;
                    }
                },

                async performSyncSystems() {
                    if (this.editSSOForm.selectedRoles.length === 0) {
                        showAlert('Please select at least one role', 'warning');
                        return;
                    }

                    this.syncSystemsLoading = true;

                    try {
                        const response = await fetch(`/admin/sso-users/${this.editSSOForm.id}/sync-systems`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                            },
                            body: JSON.stringify({
                                selected_roles: this.editSSOForm.selectedRoles
                            })
                        });

                        const result = await response.json();

                        if (result.success) {
                            showAlert(`Role sync completed! ${result.summary.accounts_created} created, ${result.summary.accounts_deleted} deleted.`, 'success');
                            this.showEditSSOModal = false;
                            this.loadSSOUsers();

                            // Show sync results
                            if (result.sync_results) {
                                console.log('Sync Results:', result.sync_results);
                            }
                        } else {
                            showAlert('Error: ' + result.message, 'error');
                        }
                    } catch (error) {
                        showAlert('Error syncing roles', 'error');
                        console.error('Sync Roles Error:', error);
                    } finally {
                        this.syncSystemsLoading = false;
                    }
                },

                // Update Names functions for SSO users
                openUpdateNamesModal() {
                    this.updateNamesResults = [];
                    this.updateNamesForm = {
                        new_name: ''
                    };
                    this.showUpdateNamesModal = true;
                },

                // Autocomplete search functions
                searchUserNames(query) {
                    // Clear previous timeout
                    if (this.searchTimeout) {
                        clearTimeout(this.searchTimeout);
                    }

                    // Hide dropdown if query is too short
                    if (query.length < 2) {
                        this.showUserSearchDropdown = false;
                        this.searchResults = [];
                        return;
                    }

                    // Set a timeout to avoid too many requests
                    this.searchTimeout = setTimeout(async () => {
                        try {
                            const response = await fetch(`/admin/search-users-across-systems?query=${encodeURIComponent(query)}`);
                            const results = await response.json();
                            this.searchResults = results;
                            this.showUserSearchDropdown = true;
                        } catch (error) {
                            console.error('Error searching users:', error);
                            this.searchResults = [];
                        }
                    }, 300);
                },

                selectUser(user) {
                    // Check if name already exists in SSO
                    fetch('/admin/check-sso-name-exists', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        },
                        body: JSON.stringify({ name: user.name })
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.exists) {
                            showAlert('This name already exists in the SSO system. Please choose a different name.', 'warning');
                            return;
                        }
                        this.addMainUserForm.name = user.name;
                        // Don't auto-fill email - let user enter it manually
                    })
                    .catch(error => {
                        console.error('Error checking name:', error);
                        this.addMainUserForm.name = user.name;
                    })
                    .finally(() => {
                        this.showUserSearchDropdown = false;
                        this.searchResults = [];
                    });
                },

                selectUserForUpdate(user) {
                    this.updateNamesForm.new_name = user.name;
                    this.showUserSearchDropdown = false;
                    this.searchResults = [];
                },

                selectUserForEdit(user) {
                    this.editUserForm.name = user.name;
                    this.showUserSearchDropdown = false;
                    this.searchResults = [];
                },

                // Edit User functions
                openEditUserModal(user) {
                    this.editUserForm = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role || 'user',
                        status: user.is_active ? 'active' : 'inactive',
                        password: '',
                        password_confirmation: '',
                        showPassword: false
                    };
                    this.showEditUserModal = true;
                },

                async updateUser() {
                    this.editUserLoading = true;

                    try {
                        const response = await fetch(`/admin/sso-users/${this.editUserForm.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify(this.editUserForm)
                        });

                        const result = await response.json();

                        if (result.success) {
                            showAlert('User updated successfully!', 'success');
                            this.showEditUserModal = false;
                            this.loadSSOUsers();
                        } else {
                            showAlert('Error: ' + result.message, 'error');
                        }
                    } catch (error) {
                        showAlert('Error updating user', 'error');
                    } finally {
                        this.editUserLoading = false;
                    }
                },

                async deleteUser() {
                    const self = this;

                    // Check if user ID exists
                    if (!self.editUserForm || !self.editUserForm.id) {
                        showAlert('Error: No user selected for deletion', 'error');
                        return;
                    }

                    showConfirm(
                        'Delete User',
                        'Are you sure you want to delete this user? This action cannot be undone.',
                        () => {
                            self.editUserLoading = true;

                            fetch(`/admin/sso-users/${self.editUserForm.id}`, {
                                method: 'DELETE',
                                headers: {
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                                }
                            })
                            .then(response => response.json())
                            .then(result => {
                                if (result.success) {
                                    showAlert('User deleted successfully!', 'success');
                                    self.showEditUserModal = false;
                                    self.loadSSOUsers();
                                } else {
                                    showAlert('Error: ' + result.message, 'error');
                                }
                            })
                            .catch(error => {
                                showAlert('Error deleting user', 'error');
                            })
                            .finally(() => {
                                self.editUserLoading = false;
                            });
                        },
                        {
                            type: 'danger',
                            confirmText: 'Delete',
                            cancelText: 'Cancel'
                        }
                    );
                },

                // Close dropdown when clicking outside
                handleClickOutside(event) {
                    if (!event.target.closest('.relative')) {
                        this.showUserSearchDropdown = false;
                    }
                },

                async performUpdateNames() {
                    if (!this.updateNamesForm.new_name) {
                        showAlert('Please enter a new name', 'warning');
                        return;
                    }

                    this.updateNamesLoading = true;

                    try {
                        const response = await fetch('/admin/update-sso-user-names', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify({
                                users: this.selectedSSOUsers,
                                new_name: this.updateNamesForm.new_name
                            })
                        });

                        const result = await response.json();

                        if (result.success) {
                            this.updateNamesResults = result.results;
                            this.selectedSSOUsers = [];
                            this.loadSSOUsers();
                        } else {
                            showAlert('Error: ' + result.message, 'error');
                        }
                    } catch (error) {
                        showAlert('Error updating names', 'error');
                    } finally {
                        this.updateNamesLoading = false;
                    }
                },

                async performBulkNameUpdate() {
                    this.bulkNameLoading = true;

                    try {
                        const usersToUpdate = this.selectedBrowseUsers.map(userStr => JSON.parse(userStr));

                        const response = await fetch('/admin/bulk-update-names', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify({
                                users: usersToUpdate,
                                ...this.bulkNameForm
                            })
                        });

                        const result = await response.json();

                        if (result.success) {
                            this.bulkNameResults = result.results;
                            this.selectedBrowseUsers = [];
                            this.loadUsers();

                            // Reload SSO users if they were updated
                            if (this.bulkNameForm.update_sso) {
                                this.loadSSOUsers();
                            }
                        } else {
                            showAlert('Error: ' + result.message, 'error');
                        }
                    } catch (error) {
                        showAlert('Error performing bulk name update', 'error');
                    } finally {
                        this.bulkNameLoading = false;
                    }
                },

                async deleteSelectedUsers() {
                    if (this.selectedBrowseUsers.length === 0) {
                        showAlert('Please select users to delete', 'error');
                        return;
                    }

                    if (this.activeSystem === 'all') {
                        showAlert('Please select a specific system to delete from', 'error');
                        return;
                    }

                    const self = this;
                    showConfirm(
                        `Delete ${this.selectedBrowseUsers.length} Users`,
                        `Are you sure you want to delete ${this.selectedBrowseUsers.length} users from ${this.activeSystem.toUpperCase()} system? This action cannot be undone.`,
                        async () => {
                            self.deleteLoading = true;

                            try {
                                const usersToDelete = self.selectedBrowseUsers.map(userStr => JSON.parse(userStr));

                                const response = await fetch('/admin/delete-users', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                                    },
                                    body: JSON.stringify({
                                        system: self.activeSystem,
                                        users: usersToDelete
                                    })
                                });

                                const result = await response.json();

                                if (result.success) {
                                    showAlert(`Successfully deleted ${result.deleted_count} users`, 'success');
                                    self.selectedBrowseUsers = [];
                                    self.loadUsers();
                                } else {
                                    showAlert('Error: ' + result.message, 'error');
                                }
                            } catch (error) {
                                showAlert('Error deleting users', 'error');
                            } finally {
                                self.deleteLoading = false;
                            }
                        },
                        {
                            type: 'danger',
                            confirmText: 'Delete',
                            cancelText: 'Cancel'
                        }
                    );
                },

                // Edit Browse User Modal Methods
                openEditBrowseUserModal(user) {
                    this.editBrowseUserForm = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role || '',
                        system: user.system || this.activeSystem,
                        showPassword: false,
                        password: '',
                        password_confirmation: ''
                    };
                    this.showEditBrowseUserModal = true;
                },

                async updateBrowseUser() {
                    this.editBrowseUserLoading = true;

                    try {
                        // Include changePassword flag only if password is shown
                        const payload = {
                            ...this.editBrowseUserForm,
                            system: this.editBrowseUserForm.system
                        };

                        // Only include password fields if they're shown
                        if (this.editBrowseUserForm.showPassword) {
                            payload.changePassword = true;
                            payload.password = this.editBrowseUserForm.password;
                            payload.password_confirmation = this.editBrowseUserForm.password_confirmation;
                        }

                        const response = await fetch(`/admin/update-user/${this.editBrowseUserForm.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify(payload)
                        });

                        const result = await response.json();

                        if (result.success) {
                            showAlert('User updated successfully!', 'success');
                            this.showEditBrowseUserModal = false;
                            this.loadUsers();
                        } else {
                            showAlert('Error: ' + result.message, 'error');
                        }
                    } catch (error) {
                        showAlert('Error updating user', 'error');
                    } finally {
                        this.editBrowseUserLoading = false;
                    }
                },

                deleteBrowseUser() {
                    const self = this;
                    showConfirm(
                        'Delete User',
                        'Are you sure you want to delete this user from ' + self.editBrowseUserForm.system.toUpperCase() + '? This action cannot be undone.',
                        () => {
                            self.editBrowseUserLoading = true;

                            fetch(`/admin/delete-users`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                                },
                                body: JSON.stringify({
                                    system: self.editBrowseUserForm.system,
                                    users: [{ id: self.editBrowseUserForm.id }]
                                })
                            })
                            .then(response => response.json())
                            .then(result => {
                                if (result.success) {
                                    showAlert('User deleted successfully!', 'success');
                                    self.showEditBrowseUserModal = false;
                                    self.loadUsers();
                                } else {
                                    showAlert('Error: ' + result.message, 'error');
                                }
                            })
                            .catch(error => {
                                showAlert('Error deleting user', 'error');
                            })
                            .finally(() => {
                                self.editBrowseUserLoading = false;
                            });
                        },
                        {
                            type: 'danger',
                            confirmText: 'Delete',
                            cancelText: 'Cancel'
                        }
                    );
                },

                getRoleDescription(role) {
                    const roleDescriptions = {
                        'adm_tuk': 'Administrator TUK - Manage TUK operations',
                        'adm_tuk_bpc': 'Administrator TUK BPC - Special TUK BPC role (Reguler only)',
                        'adm_pusat': 'Administrator Pusat - Central administration',
                        'prometheus': 'Prometheus - Special monitoring role',
                        'keuangan': 'Keuangan - Finance management',
                        'banned': 'Banned - User access blocked (Balai only)',
                        'ketua_tuk': 'Ketua TUK - TUK Leader (TUK only)',
                        'verifikator': 'Verifikator - Verification officer (TUK only)',
                        'validator': 'Validator - Validation officer (TUK only)',
                        'admin_lsp': 'Admin LSP - LSP Administrator (TUK only)',
                        'admin': 'Administrator - System admin (TUK only)',
                        'direktur': 'Director - Director role (TUK only)'
                    };
                    return roleDescriptions[role] || '';
                },

                async updateUser() {
                    this.editUserLoading = true;

                    try {
                        const response = await fetch(`/admin/update-user/${this.editUserForm.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                            },
                            body: JSON.stringify({
                                ...this.editUserForm,
                                system: this.editUserForm.system
                            })
                        });

                        const result = await response.json();

                        if (result.success) {
                            showAlert('User updated successfully!', 'success');
                            this.showEditUserModal = false;
                            this.loadUsers();
                        } else {
                            showAlert('Error: ' + result.message, 'error');
                        }
                    } catch (error) {
                        showAlert('Error updating user', 'error');
                    } finally {
                        this.editUserLoading = false;
                    }
                }
            }
        }
    </script>
</html>