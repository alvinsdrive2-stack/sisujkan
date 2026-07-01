<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Database Analysis - {{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])

        <!-- Tailwind CSS -->
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="font-sans antialiased">
        <div class="min-h-screen bg-gray-100">
            @include('layouts.navigation')

            <!-- Page Heading -->
            <header class="bg-white shadow">
                <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 class="text-2xl font-bold text-gray-900">Database Analysis</h1>
                </div>
            </header>

            <!-- Page Content -->
            <main>
<div class="container mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">📊 Users Table Structure Analysis</h1>

    @foreach ($results as $system => $data)
        <div class="mb-8 bg-white rounded-lg shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold capitalize">
                    {{ strtoupper($system) }} Database
                    @if($data['status'] == 'error')
                        <span class="text-red-500 text-sm ml-2">❌ Error</span>
                    @else
                        <span class="text-green-500 text-sm ml-2">✅ Connected</span>
                    @endif
                </h2>
                @if($data['status'] == 'success')
                    <span class="text-sm text-gray-600">
                        Total Users: {{ number_format($data['total_users']) }}
                    </span>
                @endif
            </div>

            @if($data['status'] == 'error')
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {{ $data['error'] }}
                </div>
            @else
                <!-- Structure Table -->
                <div class="mb-6">
                    <h3 class="text-lg font-medium mb-3">Table Structure</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Null</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                @foreach ($data['structure'] as $field)
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {{ $field->Field }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ $field->Type }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ $field->Null }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ $field->Key }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ $field->Default }}
                                    </td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Available Roles -->
                <div class="mb-6">
                    <h3 class="text-lg font-medium mb-3">Available Roles</h3>
                    <div class="flex flex-wrap gap-2">
                        @foreach ($data['roles'] as $role)
                            <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                {{ $role }}
                            </span>
                        @endforeach
                    </div>
                </div>

                <!-- Sample Data -->
                <div>
                    <h3 class="text-lg font-medium mb-3">Sample Data (First 3 records)</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    @foreach ($data['structure'] as $field)
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {{ $field->Field }}
                                    </th>
                                    @endforeach
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                @foreach ($data['sample_data'] as $row)
                                <tr>
                                    @foreach ($data['structure'] as $field)
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ $row->{$field->Field} ?? '-' }}
                                    </td>
                                    @endforeach
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
            @endif
        </div>
    @endforeach
</div>
            </main>
        </div>
    </body>
</html>