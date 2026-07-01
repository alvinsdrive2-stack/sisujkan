<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manual User Mapping - LSP Gatensi</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .loading-spinner {
            border: 2px solid #f3f3f3;
            border-top: 2px solid #3b82f6;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="bg-gray-100">
    <!-- Header -->
    <div class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold text-gray-900">🔗 Manual User Mapping</h1>
                <a href="/dashboard" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                    ← Back to Dashboard
                </a>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Master Users</p>
                        <p class="text-2xl font-semibold text-gray-900" id="masterUsersCount">...</p>
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
                        <p class="text-sm font-medium text-gray-600">Connections</p>
                        <p class="text-2xl font-semibold text-gray-900" id="connectionsCount">...</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">System Users</p>
                        <p class="text-2xl font-semibold text-gray-900" id="systemUsersCount">...</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0 bg-purple-500 rounded-md p-3">
                        <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">Quick Actions</p>
                        <button onclick="showCreateMasterModal()" class="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                            Add Master User
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Mapping Interface -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Left Column - Master Users -->
            <div class="bg-white rounded-lg shadow">
                <div class="p-6 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">Master Users</h2>
                    <p class="text-sm text-gray-600">Users yang sudah terhubung ke SSO</p>
                </div>
                <div class="p-6">
                    <div class="mb-4">
                        <input type="text"
                               id="masterUserSearch"
                               placeholder="Cari master user..."
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div id="masterUsersList" class="space-y-3 max-h-96 overflow-y-auto">
                        <!-- Master users will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Right Column - System Users -->
            <div class="bg-white rounded-lg shadow">
                <div class="p-6 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">System Users</h2>
                    <p class="text-sm text-gray-600">Users dari sistem yang belum terhubung</p>
                </div>
                <div class="p-6">
                    <div class="mb-4">
                        <select id="systemSelect" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Pilih Sistem</option>
                            <option value="balai">BALAI</option>
                            <option value="reguler">REGULER</option>
                            <option value="fg">FG</option>
                            <option value="tuk">TUK</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <input type="text"
                               id="systemUserSearch"
                               placeholder="Cari user di sistem..."
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div id="systemUsersList" class="space-y-3 max-h-96 overflow-y-auto">
                        <!-- System users will be loaded here -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Connection Queue -->
        <div class="mt-8 bg-white rounded-lg shadow">
            <div class="p-6 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">Koneksi Menunggu</h2>
                <p class="text-sm text-gray-600">User yang akan dihubungkan (drag & drop atau klik)</p>
            </div>
            <div class="p-6">
                <div id="connectionQueue" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Pending connections will be shown here -->
                </div>
                <div class="mt-6 flex justify-end">
                    <button onclick="processAllConnections()"
                            id="processBtn"
                            class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
                        Proses Semua Koneksi
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Create Master User Modal -->
    <div id="createMasterModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 hidden">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="mt-3">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Buat Master User Baru</h3>
                <form id="createMasterForm">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input type="text" name="name" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div class="flex justify-end gap-3">
                        <button type="button" onclick="hideCreateMasterModal()"
                                class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                            Cancel
                        </button>
                        <button type="submit"
                                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        // Global state
        let masterUsers = [];
        let systemUsers = [];
        let pendingConnections = [];
        let selectedMasterUser = null;

        // API base URL
        const API_BASE = '/admin/user-mapping';

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            loadStatistics();
            loadMasterUsers();
            setupEventListeners();
        });

        function setupEventListeners() {
            // Master user search
            document.getElementById('masterUserSearch').addEventListener('input', function(e) {
                filterMasterUsers(e.target.value);
            });

            // System user search
            document.getElementById('systemUserSearch').addEventListener('input', function(e) {
                filterSystemUsers(e.target.value);
            });

            // System selection
            document.getElementById('systemSelect').addEventListener('change', function(e) {
                if (e.target.value) {
                    loadSystemUsers(e.target.value);
                }
            });

            // Create master form
            document.getElementById('createMasterForm').addEventListener('submit', function(e) {
                e.preventDefault();
                createMasterUser(new FormData(e.target));
            });
        }

        async function loadStatistics() {
            try {
                const response = await fetch(`${API_BASE}/statistics`);
                const stats = await response.json();

                document.getElementById('masterUsersCount').textContent = stats.total_master_users || 0;
                document.getElementById('connectionsCount').textContent = stats.total_connections || 0;
                document.getElementById('systemUsersCount').textContent = stats.total_system_users || 0;
            } catch (error) {
                console.error('Error loading statistics:', error);
            }
        }

        async function loadMasterUsers() {
            try {
                const response = await fetch(`${API_BASE}/search?query=&limit=100`);
                const data = await response.json();

                masterUsers = data.users.filter(user => user.system === 'sso');
                renderMasterUsers();
            } catch (error) {
                console.error('Error loading master users:', error);
            }
        }

        async function loadSystemUsers(system) {
            try {
                const response = await fetch(`${API_BASE}/search?query=&limit=100`);
                const data = await response.json();

                systemUsers = data.users.filter(user => user.system === system);
                renderSystemUsers();
            } catch (error) {
                console.error('Error loading system users:', error);
            }
        }

        function renderMasterUsers() {
            const container = document.getElementById('masterUsersList');

            if (masterUsers.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">No master users found</p>';
                return;
            }

            container.innerHTML = masterUsers.map(user => `
                <div class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer ${selectedMasterUser?.id === user.id ? 'bg-blue-50 border-blue-300' : ''}"
                     onclick="selectMasterUser(${JSON.stringify(user).replace(/"/g, '&quot;')})">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium text-gray-900">${user.name}</p>
                            <p class="text-sm text-gray-500">${user.email}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">SSO</span>
                            <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function renderSystemUsers() {
            const container = document.getElementById('systemUsersList');

            if (systemUsers.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">Select a system to view users</p>';
                return;
            }

            container.innerHTML = systemUsers.map(user => `
                <div class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                     onclick="addToQueue(${JSON.stringify(user).replace(/"/g, '&quot;')})">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium text-gray-900">${user.name}</p>
                            <p class="text-sm text-gray-500">${user.email}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">${user.system_display}</span>
                            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                            </svg>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function selectMasterUser(user) {
            selectedMasterUser = user;
            renderMasterUsers();
            updateProcessButton();
        }

        function addToQueue(user) {
            if (!selectedMasterUser) {
                alert('Please select a master user first');
                return;
            }

            // Check if already in queue
            const exists = pendingConnections.find(conn =>
                conn.systemUser.id === user.id && conn.systemUser.system === user.system
            );

            if (exists) {
                alert('User already in queue');
                return;
            }

            pendingConnections.push({
                masterUser: selectedMasterUser,
                systemUser: user
            });

            renderConnectionQueue();
            updateProcessButton();
        }

        function renderConnectionQueue() {
            const container = document.getElementById('connectionQueue');

            if (pendingConnections.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center col-span-full py-8">No pending connections</p>';
                return;
            }

            container.innerHTML = pendingConnections.map((conn, index) => `
                <div class="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <p class="font-medium text-sm text-gray-900">${conn.masterUser.name}</p>
                            <p class="text-xs text-gray-500">${conn.masterUser.email}</p>
                        </div>
                        <button onclick="removeFromQueue(${index})" class="text-red-500 hover:text-red-700">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                    <div class="border-t border-yellow-200 pt-2 mt-2">
                        <div class="flex items-center space-x-2">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                            </svg>
                            <div>
                                <p class="text-sm font-medium text-gray-900">${conn.systemUser.name}</p>
                                <p class="text-xs text-gray-500">${conn.systemUser.email} (${conn.systemUser.system_display})</p>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function removeFromQueue(index) {
            pendingConnections.splice(index, 1);
            renderConnectionQueue();
            updateProcessButton();
        }

        function updateProcessButton() {
            const btn = document.getElementById('processBtn');
            btn.disabled = pendingConnections.length === 0;
        }

        async function processAllConnections() {
            if (pendingConnections.length === 0) return;

            const btn = document.getElementById('processBtn');
            btn.disabled = true;
            btn.innerHTML = '<div class="loading-spinner inline-block mr-2"></div> Processing...';

            let success = 0;
            let failed = 0;

            for (const conn of pendingConnections) {
                try {
                    const response = await fetch(`${API_BASE}/connect-account`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                        },
                        body: JSON.stringify({
                            sso_user_id: conn.masterUser.id,
                            system_name: conn.systemUser.system,
                            system_user_id: conn.systemUser.id,
                            system_role: conn.systemUser.role || 'user'
                        })
                    });

                    const result = await response.json();
                    if (result.success) {
                        success++;
                    } else {
                        failed++;
                        console.error('Connection failed:', result.message);
                    }
                } catch (error) {
                    failed++;
                    console.error('Connection error:', error);
                }
            }

            alert(`Processing complete!\nSuccess: ${success}\nFailed: ${failed}`);

            // Reset
            pendingConnections = [];
            selectedMasterUser = null;
            renderConnectionQueue();
            renderMasterUsers();
            updateProcessButton();
            loadStatistics();

            btn.disabled = false;
            btn.innerHTML = 'Proses Semua Koneksi';
        }

        function filterMasterUsers(query) {
            const filtered = masterUsers.filter(user =>
                user.name.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase())
            );

            const container = document.getElementById('masterUsersList');
            if (filtered.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">No users found</p>';
                return;
            }

            // Render filtered users
            const originalUsers = masterUsers;
            masterUsers = filtered;
            renderMasterUsers();
            masterUsers = originalUsers;
        }

        function filterSystemUsers(query) {
            if (!systemUsers.length) return;

            const filtered = systemUsers.filter(user =>
                user.name.toLowerCase().includes(query.toLowerCase()) ||
                user.email.toLowerCase().includes(query.toLowerCase())
            );

            const container = document.getElementById('systemUsersList');
            if (filtered.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center py-8">No users found</p>';
                return;
            }

            // Render filtered users
            const originalUsers = systemUsers;
            systemUsers = filtered;
            renderSystemUsers();
            systemUsers = originalUsers;
        }

        function showCreateMasterModal() {
            document.getElementById('createMasterModal').classList.remove('hidden');
        }

        function hideCreateMasterModal() {
            document.getElementById('createMasterModal').classList.add('hidden');
            document.getElementById('createMasterForm').reset();
        }

        async function createMasterUser(formData) {
            const btn = document.querySelector('#createMasterForm button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = 'Creating...';

            try {
                const response = await fetch(`${API_BASE}/save-master`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    body: JSON.stringify({
                        name: formData.get('name'),
                        email: formData.get('email'),
                        status: formData.get('status')
                    })
                });

                const result = await response.json();

                if (result.success) {
                    alert('Master user created successfully!');
                    hideCreateMasterModal();
                    loadMasterUsers();
                    loadStatistics();
                } else {
                    alert('Error: ' + result.message);
                }
            } catch (error) {
                alert('Error creating master user');
                console.error(error);
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Create';
            }
        }
    </script>
</body>
</html>