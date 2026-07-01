<x-app-layout>
<x-slot name="header">
    <h2 class="font-semibold text-xl text-gray-800 leading-tight">
        🔗 User Mapping Management - LSP Gatensi
    </h2>
</x-slot>

@section('content')
<div class="py-12">
    <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
            <div class="p-6">
                <h1 class="text-2xl font-bold text-gray-900">🔗 User Mapping Management</h1>
                <p class="mt-1 text-sm text-gray-600">Manage master users and their system account connections</p>
            </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6" x-data="{
            stats: {},
            searchQuery: '',
            searchResults: [],
            duplicates: [],
            showCreateUserModal: false,
            showEditUserModal: false,
            saving: false,
            masterUserForm: {
                id: null,
                name: '',
                email: '',
                status: 'active'
            },

            init() {
                this.loadStatistics();
            },

            async loadStatistics() {
                try {
                    const response = await fetch('/admin/user-mapping/statistics');
                    this.stats = await response.json();
                } catch (error) {
                    console.error('Error loading statistics:', error);
                }
            },

            async searchUsers() {
                if (this.searchQuery.length < 2) {
                    this.searchResults = [];
                    return;
                }

                try {
                    const response = await fetch(`/admin/user-mapping/search?query=${encodeURIComponent(this.searchQuery)}`);
                    const data = await response.json();
                    this.searchResults = data.users || [];
                } catch (error) {
                    console.error('Error searching users:', error);
                    this.searchResults = [];
                }
            },

            async loadDuplicates() {
                try {
                    const response = await fetch('/admin/user-mapping/duplicates');
                    const data = await response.json();
                    this.duplicates = data.duplicates || [];
                } catch (error) {
                    console.error('Error loading duplicates:', error);
                    this.duplicates = [];
                }
            },

            async saveMasterUser() {
                this.saving = true;
                try {
                    const url = this.masterUserForm.id ?
                        `/admin/user-mapping/user/${this.masterUserForm.id}` :
                        '/admin/user-mapping/save-master';

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name=\"csrf-token\"]').getAttribute('content')
                        },
                        body: JSON.stringify(this.masterUserForm)
                    });

                    const result = await response.json();

                    if (result.success) {
                        alert('Master user saved successfully!');
                        this.showCreateUserModal = false;
                        this.showEditUserModal = false;
                        this.masterUserForm = { id: null, name: '', email: '', status: 'active' };
                        this.loadStatistics();
                    } else {
                        alert('Error: ' + result.message);
                    }
                } catch (error) {
                    alert('Error saving master user');
                } finally {
                    this.saving = false;
                }
            },

            editUser(user) {
                if (user.system === 'sso') {
                    this.masterUserForm = {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        status: 'active'
                    };
                    this.showEditUserModal = true;
                } else {
                    this.masterUserForm = {
                        id: null,
                        name: user.name,
                        email: user.email,
                        status: 'active'
                    };
                    this.showCreateUserModal = true;
                }
            },

            connectAccountToMaster(user) {
                alert('Connect account to master user - implement connection modal');
            },

            createMasterFromDuplicates(users) {
                const firstUser = users[0];
                this.masterUserForm = {
                    id: null,
                    name: firstUser.name,
                    email: firstUser.email,
                    status: 'active'
                };
                this.showCreateUserModal = true;
            }
        }">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Master Users</p>
                        <p class="text-2xl font-semibold text-gray-900" x-text="stats.total_master_users ? stats.total_master_users : '...'"></p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Total Connections</p>
                        <p class="text-2xl font-semibold text-gray-900" x-text="stats.total_connections ? stats.total_connections : '...'"></p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Potential Duplicates</p>
                        <p class="text-2xl font-semibold text-gray-900" x-text="stats.potential_duplicates ? stats.potential_duplicates : '...'"></p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0 bg-purple-500 rounded-md p-3">
                        <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">System Users</p>
                        <p class="text-2xl font-semibold text-gray-900" x-text="stats.total_system_users ? stats.total_system_users : '...'"></p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search and Actions -->
        <div class="bg-white rounded-lg shadow mb-6">
            <div class="p-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h2 class="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">🔍 User Search</h2>
                    <div class="flex gap-3">
                        <button @click="showCreateUserModal = true"
                                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Master User
                        </button>
                        <button @click="loadDuplicates()"
                                class="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center">
                            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            Check Duplicates
                        </button>
                    </div>
                </div>

                <div class="relative">
                    <input type="text"
                           x-model="searchQuery"
                           @keyup.debounce.500ms="searchUsers()"
                           placeholder="Search users by name or email across all systems..."
                           class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search Results -->
        <div x-show="searchResults.length > 0" class="bg-white rounded-lg shadow mb-6">
            <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Search Results</h3>
                <div class="space-y-3">
                    <template x-for="user in searchResults" :key="user.id + '_' + user.system">
                        <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <div class="flex items-center space-x-4">
                                <div class="flex-shrink-0">
                                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span class="text-sm font-medium text-blue-600" x-text="user.name.charAt(0).toUpperCase()"></span>
                                    </div>
                                </div>
                                <div>
                                    <p class="font-medium text-gray-900" x-text="user.name"></p>
                                    <p class="text-sm text-gray-500" x-text="user.email"></p>
                                </div>
                                <div class="flex space-x-2">
                                    <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800" x-text="user.role"></span>
                                    <span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800" x-text="user.system_display"></span>
                                </div>
                            </div>
                            <div class="flex space-x-2">
                                <button @click="connectAccountToMaster(user)"
                                        class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                    Connect to Master
                                </button>
                                <button @click="editUser(user)"
                                        class="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700">
                                    Edit
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <!-- Duplicate Results -->
        <div x-show="duplicates.length > 0" class="bg-white rounded-lg shadow mb-6">
            <div class="p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">⚠️ Potential Duplicates</h3>
                <div class="space-y-6">
                    <template x-for="group in duplicates" :key="group.normalized_name">
                        <div class="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                            <div class="flex items-center justify-between mb-3">
                                <div>
                                    <h4 class="font-medium text-gray-900" x-text="group.normalized_name"></h4>
                                    <p class="text-sm text-gray-600">
                                        Confidence: <span class="font-semibold" x-text="Math.round(group.confidence * 100) + '%'"></span>
                                    </p>
                                </div>
                                <button @click="createMasterFromDuplicates(group.users)"
                                        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                                    Create Master User
                                </button>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <template x-for="user in group.users" :key="user.id + '_' + user.system">
                                    <div class="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                                        <div>
                                            <p class="font-medium text-sm" x-text="user.name"></p>
                                            <p class="text-xs text-gray-500" x-text="user.email + ' (' + user.system_display + ')'"></p>
                                        </div>
                                        <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800" x-text="user.role"></span>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

<!-- Create/Edit Master User Modal -->
<div x-show="showCreateUserModal || showEditUserModal"
     x-transition:enter="transition ease-out duration-300"
     x-transition:enter-start="opacity-0"
     x-transition:enter-end="opacity-100"
     x-transition:leave="transition ease-in duration-200"
     x-transition:leave-start="opacity-100"
     x-transition:leave-end="opacity-0"
     class="fixed inset-0 overflow-y-auto z-50"
     style="display: none;">
    <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75" @click="showCreateUserModal = false; showEditUserModal = false"></div>

        <div class="relative bg-white rounded-lg max-w-md w-full p-6">
            <h3 class="text-lg font-semibold mb-4" x-text="showEditUserModal ? 'Edit Master User' : 'Create Master User'"></h3>

            <form @submit.prevent="saveMasterUser()">
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text"
                           x-model="masterUserForm.name"
                           required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email"
                           x-model="masterUserForm.email"
                           required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

  
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select x-model="masterUserForm.status"
                            required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div class="flex justify-end gap-3">
                    <button type="button"
                            @click="showCreateUserModal = false; showEditUserModal = false"
                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit"
                            :disabled="saving"
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                        <span x-show="!saving">Save</span>
                        <span x-show="saving">Saving...</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
    </div>
</div>

</x-app-layout>