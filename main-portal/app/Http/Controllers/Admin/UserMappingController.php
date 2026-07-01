<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class UserMappingController extends Controller
{
    /**
     * Show user mapping dashboard
     */
    public function index()
    {
        return view('admin.user-mapping.index');
    }

    /**
     * Show manual user mapping interface
     */
    public function manual()
    {
        return view('admin.user-mapping.manual');
    }

    /**
     * Get statistics for dashboard
     */
    public function getStatistics()
    {
        try {
            $systems = ['balai' => 'mysql_balai', 'reguler' => 'mysql_reguler', 'fg' => 'mysql_fg', 'tuk' => 'mysql_tuk'];
            $stats = [
                'total_master_users' => DB::table('sso_users')->count(),
                'total_system_users' => 0,
                'total_connections' => DB::table('sso_user_systems')->count(),
                'systems' => []
            ];

            foreach ($systems as $systemName => $connection) {
                try {
                    $userCount = DB::connection($connection)->table('users')->count();
                    $stats['total_system_users'] += $userCount;
                    $stats['systems'][$systemName] = [
                        'name' => ucfirst($systemName),
                        'user_count' => $userCount,
                        'connected_count' => DB::table('sso_user_systems')
                            ->where('system_name', $systemName)
                            ->count()
                    ];
                } catch (\Exception $e) {
                    $stats['systems'][$systemName] = [
                        'name' => ucfirst($systemName),
                        'user_count' => 0,
                        'connected_count' => 0,
                        'error' => $e->getMessage()
                    ];
                }
            }

            // Get duplicate candidates
            $stats['potential_duplicates'] = $this->getPotentialDuplicatesCount();

            return response()->json($stats);

        } catch (\Exception $e) {
            Log::error("Error getting statistics: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Search users across all systems
     */
    public function searchUsers(Request $request)
    {
        $query = $request->get('query', '');
        $limit = min($request->get('limit', 20), 50);

        if (empty($query) || strlen($query) < 2) {
            return response()->json(['users' => []]);
        }

        try {
            $allUsers = [];
            $systems = ['balai' => 'mysql_balai', 'reguler' => 'mysql_reguler', 'fg' => 'mysql_fg', 'tuk' => 'mysql_tuk'];

            foreach ($systems as $systemName => $connection) {
                try {
                    $users = DB::connection($connection)
                        ->table('users')
                        ->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%")
                        ->limit($limit)
                        ->get();

                    foreach ($users as $user) {
                        $allUsers[] = [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'role' => $user->role,
                            'system' => $systemName,
                            'system_display' => ucfirst($systemName),
                            'normalized_name' => $this->normalizeName($user->name),
                            'created_at' => $user->created_at
                        ];
                    }
                } catch (\Exception $e) {
                    Log::error("Error searching users in {$systemName}: " . $e->getMessage());
                }
            }

            // Also search master users
            $masterUsers = DB::table('sso_users')
                ->where('name', 'like', "%{$query}%")
                ->orWhere('email', 'like', "%{$query}%")
                ->limit($limit)
                ->get();

            foreach ($masterUsers as $user) {
                $allUsers[] = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => 'master',
                    'system' => 'sso',
                    'system_display' => 'SSO Master',
                    'normalized_name' => $this->normalizeName($user->name),
                    'created_at' => $user->created_at
                ];
            }

            // Sort by relevance (exact matches first)
            usort($allUsers, function($a, $b) use ($query) {
                $aScore = 0;
                $bScore = 0;

                // Exact name match
                if (strtolower($a['name']) === strtolower($query)) $aScore += 100;
                if (strtolower($b['name']) === strtolower($query)) $bScore += 100;

                // Exact email match
                if (strtolower($a['email']) === strtolower($query)) $aScore += 100;
                if (strtolower($b['email']) === strtolower($query)) $bScore += 100;

                // Name contains query
                if (stripos($a['name'], $query) !== false) $aScore += 50;
                if (stripos($b['name'], $query) !== false) $bScore += 50;

                // Email contains query
                if (stripos($a['email'], $query) !== false) $aScore += 50;
                if (stripos($b['email'], $query) !== false) $bScore += 50;

                return $bScore - $aScore;
            });

            return response()->json([
                'users' => array_slice($allUsers, 0, $limit)
            ]);

        } catch (\Exception $e) {
            Log::error("Error searching users: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get potential duplicates
     */
    public function getPotentialDuplicates()
    {
        try {
            $allUsers = [];
            $systems = ['balai' => 'mysql_balai', 'reguler' => 'mysql_reguler', 'fg' => 'mysql_fg', 'tuk' => 'mysql_tuk'];

            // Get all users from all systems
            foreach ($systems as $systemName => $connection) {
                try {
                    $users = DB::connection($connection)
                        ->table('users')
                        ->select('id', 'name', 'email', 'role', 'created_at')
                        ->get();

                    foreach ($users as $user) {
                        $allUsers[] = [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'role' => $user->role,
                            'system' => $systemName,
                            'normalized_name' => $this->normalizeName($user->name),
                            'email_domain' => $this->getEmailDomain($user->email),
                            'created_at' => $user->created_at
                        ];
                    }
                } catch (\Exception $e) {
                    Log::error("Error fetching users from {$systemName}: " . $e->getMessage());
                }
            }

            // Group by normalized name
            $nameGroups = [];
            foreach ($allUsers as $user) {
                $nameGroups[$user['normalized_name']][] = $user;
            }

            // Find duplicates
            $duplicates = [];
            foreach ($nameGroups as $normalizedName => $users) {
                if (count($users) > 1) {
                    $confidence = $this->calculateDuplicateConfidence($users);
                    if ($confidence > 0.5) {
                        $duplicates[] = [
                            'users' => $users,
                            'confidence' => $confidence,
                            'normalized_name' => $normalizedName
                        ];
                    }
                }
            }

            // Sort by confidence
            usort($duplicates, function($a, $b) {
                return $b['confidence'] - $a['confidence'];
            });

            return response()->json([
                'duplicates' => array_slice($duplicates, 0, 20) // Limit to 20 results
            ]);

        } catch (\Exception $e) {
            Log::error("Error finding duplicates: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create or update master user
     */
    public function saveMasterUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email',
            'phone' => 'nullable|string|max:50',
            'status' => 'required|in:active,inactive'
        ]);

        try {
            $id = $request->get('id');

            $userData = [
                'name' => $request->name,
                'email' => $request->email,
                'role' => 'admin', // Default role for master users
                'password' => Hash::make('password'), // Default password
                'status' => $request->status,
                'updated_at' => now()
            ];

            if ($id) {
                // Update existing
                DB::table('sso_users')->where('id', $id)->update($userData);
                $userId = $id;
            } else {
                // Create new
                $userData['created_at'] = now();
                $userData['email_verified_at'] = now(); // Auto-verify
                $userId = DB::table('sso_users')->insertGetId($userData);
            }

            return response()->json([
                'success' => true,
                'user_id' => $userId,
                'message' => $id ? 'User updated successfully' : 'User created successfully'
            ]);

        } catch (\Exception $e) {
            Log::error("Error saving master user: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Connect system account to master user
     */
    public function connectAccount(Request $request)
    {
        $request->validate([
            'sso_user_id' => 'required|integer',
            'system_name' => 'required|in:balai,reguler,fg,tuk',
            'system_user_id' => 'required|integer'
        ]);

        try {
            // Check if connection already exists
            $existing = DB::table('sso_user_systems')
                ->where('sso_user_id', $request->sso_user_id)
                ->where('system_name', $request->system_name)
                ->where('system_user_id', $request->system_user_id)
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Account already connected to this user'
                ], 400);
            }

            // Create connection
            DB::table('sso_user_systems')->insert([
                'sso_user_id' => $request->sso_user_id,
                'system_name' => $request->system_name,
                'system_user_id' => $request->system_user_id,
                'is_approved' => true,
                'approval_method' => 'admin',
                'approved_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Account connected successfully'
            ]);

        } catch (\Exception $e) {
            Log::error("Error connecting account: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Disconnect system account
     */
    public function disconnectAccount(Request $request)
    {
        $request->validate([
            'sso_user_id' => 'required|integer',
            'system_name' => 'required|in:balai,reguler,fg,tuk',
            'system_user_id' => 'required|integer'
        ]);

        try {
            $deleted = DB::table('sso_user_systems')
                ->where('sso_user_id', $request->sso_user_id)
                ->where('system_name', $request->system_name)
                ->where('system_user_id', $request->system_user_id)
                ->delete();

            if ($deleted) {
                return response()->json([
                    'success' => true,
                    'message' => 'Account disconnected successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Connection not found'
                ], 404);
            }

        } catch (\Exception $e) {
            Log::error("Error disconnecting account: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user details with all connections
     */
    public function getUserDetails($userId)
    {
        try {
            // Get master user
            $masterUser = DB::table('sso_users')->where('id', $userId)->first();
            if (!$masterUser) {
                return response()->json(['error' => 'User not found'], 404);
            }

            // Get all connections
            $connections = DB::table('sso_user_systems')
                ->where('sso_user_id', $userId)
                ->get()
                ->groupBy('system_name');

            return response()->json([
                'master_user' => $masterUser,
                'connections' => $connections,
                'total_connections' => DB::table('sso_user_systems')
                    ->where('sso_user_id', $userId)
                    ->count()
            ]);

        } catch (\Exception $e) {
            Log::error("Error getting user details: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Helper methods
     */
    private function normalizeName($name)
    {
        $name = strtolower($name);
        $name = preg_replace('/[^a-zA-Z0-9\s]/', '', $name);
        $name = preg_replace('/\b(sdr|bapak|ibuk|mr|mrs|ms|dr|ir|eng|prof|ht)\b/', '', $name);
        $name = trim(preg_replace('/\s+/', ' ', $name));
        return $name;
    }

    private function getEmailDomain($email)
    {
        $parts = explode('@', $email);
        return count($parts) > 1 ? $parts[1] : '';
    }

    private function calculateDuplicateConfidence($users)
    {
        if (count($users) < 2) return 0;

        $confidence = 0;
        $emails = array_column($users, 'email');
        $systems = array_unique(array_column($users, 'system'));

        // Same email domain (30%)
        $domains = array_unique(array_map([$this, 'getEmailDomain'], $emails));
        if (count($domains) === 1) {
            $confidence += 0.3;
        }

        // Multiple systems (40%)
        if (count($systems) > 1) {
            $confidence += 0.4;
        }

        // Name similarity (30%)
        $confidence += 0.3; // Already grouped by normalized name

        return min($confidence, 1.0);
    }

    private function getPotentialDuplicatesCount()
    {
        try {
            $count = 0;
            $allUsers = [];
            $systems = ['balai' => 'mysql_balai', 'reguler' => 'mysql_reguler', 'fg' => 'mysql_fg', 'tuk' => 'mysql_tuk'];

            foreach ($systems as $systemName => $connection) {
                try {
                    $users = DB::connection($connection)->table('users')->get();
                    foreach ($users as $user) {
                        $allUsers[] = [
                            'normalized_name' => $this->normalizeName($user->name),
                            'system' => $systemName
                        ];
                    }
                } catch (\Exception $e) {
                    continue;
                }
            }

            // Count duplicates
            $nameCounts = [];
            foreach ($allUsers as $user) {
                $nameCounts[$user['normalized_name']][] = $user['system'];
            }

            foreach ($nameCounts as $name => $userSystems) {
                if (count(array_unique($userSystems)) > 1) {
                    $count++;
                }
            }

            return $count;

        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Handle account selection from multiple matches
     */
    public function selectAccount(Request $request)
    {
        $request->validate([
            'sso_user_id' => 'required|integer',
            'system_name' => 'required|in:balai,reguler,fg,tuk',
            'selected_user_id' => 'required|integer',
            'selected_user_email' => 'required|email',
            'selected_user_name' => 'required|string',
            'selected_user_role' => 'nullable|string'
        ]);

        try {
            // Remove any existing connections for this user and system
            DB::table('sso_user_systems')
                ->where('sso_user_id', $request->sso_user_id)
                ->where('system_name', $request->system_name)
                ->delete();

            // Create new connection with selected account
            $connection = DB::table('sso_user_systems')->insert([
                'sso_user_id' => $request->sso_user_id,
                'system_name' => $request->system_name,
                'system_user_id' => $request->selected_user_id,
                'is_approved' => true,
                'approval_method' => 'auto',
                'approved_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Log the selection
            Log::info('User selected account', [
                'sso_user_id' => $request->sso_user_id,
                'system_name' => $request->system_name,
                'selected_user_id' => $request->selected_user_id,
                'selected_email' => $request->selected_user_email,
                'selected_name' => $request->selected_user_name
            ]);

            // Generate token for immediate login
            $systems = [
                'balai' => env('BALAI_URL', 'http://localhost:8001'),
                'reguler' => env('REGULER_URL', 'http://localhost:8002'),
                'fg' => env('FG_SUISEI_URL', 'http://localhost:8003'),
                'tuk' => env('TUK_URL', 'http://localhost:8004')
            ];

            $token = Str::random(60);
            $tokenData = [
                'sso_user_id' => $request->sso_user_id,
                'system_name' => $request->system_name,
                'selected_user_id' => $request->selected_user_id,
                'expires_at' => now()->addHour()
            ];

            cache([
                "sso_token_{$token}" => $tokenData
            ], 3600);

            $redirectUrl = $systems[$request->system_name] . "/sso/callback?token={$token}";

            return response()->json([
                'success' => true,
                'message' => 'Account selection saved successfully!',
                'system_name' => $request->system_name,
                'redirect_url' => $redirectUrl
            ]);

        } catch (\Exception $e) {
            Log::error("Error saving account selection: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }
}