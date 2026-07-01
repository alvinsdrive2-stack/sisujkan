<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AccountConsolidationController extends Controller
{
    /**
     * Show duplicate detection dashboard
     */
    public function index()
    {
        return view('admin.account-consolidation.index');
    }

    /**
     * Detect potential duplicate users across all systems
     */
    public function detectDuplicates(Request $request)
    {
        try {
            $duplicates = [];
            $systems = ['balai' => 'mysql_balai', 'reguler' => 'mysql_reguler', 'fg' => 'mysql_fg', 'tuk' => 'mysql_tuk'];

            // Get all users from all systems
            $allUsers = [];
            foreach ($systems as $systemName => $connection) {
                try {
                    $users = DB::connection($connection)
                        ->table('users')
                        ->select('id', 'name', 'email', 'role', 'created_at')
                        ->get()
                        ->toArray();

                    foreach ($users as $user) {
                        $user->system = $systemName;
                        $user->normalizedName = $this->normalizeName($user->name);
                        $user->emailDomain = $this->getEmailDomain($user->email);
                        $allUsers[] = $user;
                    }
                } catch (\Exception $e) {
                    Log::error("Error fetching users from {$systemName}: " . $e->getMessage());
                }
            }

            // Group by normalized name
            $nameGroups = [];
            foreach ($allUsers as $user) {
                $nameGroups[$user->normalizedName][] = $user;
            }

            // Find potential duplicates
            foreach ($nameGroups as $normalizedName => $users) {
                if (count($users) > 1) {
                    // Check if these are actually the same person
                    $duplicateGroup = $this->analyzeDuplicates($users);
                    if ($duplicateGroup['confidence'] > 0.6) {
                        $duplicates[] = $duplicateGroup;
                    }
                }
            }

            return response()->json([
                'duplicates' => $duplicates,
                'totalChecked' => count($allUsers),
                'potentialDuplicates' => count($duplicates)
            ]);

        } catch (\Exception $e) {
            Log::error("Error detecting duplicates: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Analyze group of users with similar names
     */
    private function analyzeDuplicates($users)
    {
        $emails = array_column($users, 'email');
        $systems = array_unique(array_column($users, 'system'));

        // Calculate confidence score
        $confidence = 0;
        $factors = [];

        // Factor 1: Same email domain (30%)
        $domains = array_unique(array_map([$this, 'getEmailDomain'], $emails));
        if (count($domains) === 1) {
            $confidence += 0.3;
            $factors[] = 'Same email domain';
        }

        // Factor 2: Email pattern similarity (25%)
        $emailSimilarity = $this->calculateEmailSimilarity($emails);
        $confidence += $emailSimilarity * 0.25;
        if ($emailSimilarity > 0.7) {
            $factors[] = 'Email pattern similarity';
        }

        // Factor 3: Same person in multiple systems (30%)
        if (count($systems) > 1) {
            $confidence += 0.3;
            $factors[] = 'Multiple systems';
        }

        // Factor 4: Name similarity (15%)
        $nameSimilarity = $this->calculateNameSimilarity($users);
        $confidence += $nameSimilarity * 0.15;
        if ($nameSimilarity > 0.8) {
            $factors[] = 'High name similarity';
        }

        return [
            'users' => $users,
            'confidence' => min($confidence, 1.0),
            'factors' => $factors,
            'systems' => $systems,
            'recommendation' => $this->getRecommendation($confidence)
        ];
    }

    /**
     * Calculate email pattern similarity
     */
    private function calculateEmailSimilarity($emails)
    {
        if (count($emails) < 2) return 0;

        $localParts = array_map(function($email) {
            return explode('@', $email)[0];
        }, $emails);

        $similarities = [];
        for ($i = 0; $i < count($localParts); $i++) {
            for ($j = $i + 1; $j < count($localParts); $j++) {
                $similarity = similar_text($localParts[$i], $localParts[$j], $percent);
                $similarities[] = $percent / 100;
            }
        }

        return count($similarities) > 0 ? array_sum($similarities) / count($similarities) : 0;
    }

    /**
     * Calculate name similarity
     */
    private function calculateNameSimilarity($users)
    {
        if (count($users) < 2) return 0;

        $similarities = [];
        for ($i = 0; $i < count($users); $i++) {
            for ($j = $i + 1; $j < count($users); $j++) {
                $similarity = similar_text($users[$i]->name, $users[$j]->name, $percent);
                $similarities[] = $percent / 100;
            }
        }

        return count($similarities) > 0 ? array_sum($similarities) / count($similarities) : 0;
    }

    /**
     * Normalize name for comparison
     */
    private function normalizeName($name)
    {
        // Remove common prefixes/suffixes, convert to lowercase, remove punctuation
        $name = strtolower($name);
        $name = preg_replace('/[^a-zA-Z0-9\s]/', '', $name);
        $name = preg_replace('/\b(sdr|bapak|ibuk|mr|mrs|ms|dr|ir|eng|prof|ht)\b/', '', $name);
        $name = trim(preg_replace('/\s+/', ' ', $name));

        return $name;
    }

    /**
     * Get email domain
     */
    private function getEmailDomain($email)
    {
        $parts = explode('@', $email);
        return count($parts) > 1 ? $parts[1] : '';
    }

    /**
     * Get recommendation based on confidence
     */
    private function getRecommendation($confidence)
    {
        if ($confidence > 0.8) {
            return 'MERGE_HIGH'; // Definitely merge
        } elseif ($confidence > 0.6) {
            return 'MERGE_REVIEW'; // Review before merge
        } elseif ($confidence > 0.4) {
            return 'INVESTIGATE'; // Manual review needed
        } else {
            return 'IGNORE'; // Probably different people
        }
    }

    /**
     * Merge duplicate accounts
     */
    public function mergeAccounts(Request $request)
    {
        $request->validate([
            'master_user_id' => 'required|integer',
            'master_system' => 'required|string|in:balai,reguler,fg,tuk',
            'duplicate_users' => 'required|array',
            'duplicate_users.*.id' => 'required|integer',
            'duplicate_users.*.system' => 'required|string|in:balai,reguler,fg,tuk',
            'new_email' => 'required|email',
            'new_name' => 'required|string|max:255'
        ]);

        try {
            $masterUserId = $request->master_user_id;
            $masterSystem = $request->master_system;
            $newEmail = $request->new_email;
            $newName = $request->new_name;
            $duplicateUsers = $request->duplicate_users;

            // Update master account
            $masterConnection = $this->getSystemConnection($masterSystem);
            DB::connection($masterConnection)
                ->table('users')
                ->where('id', $masterUserId)
                ->update([
                    'email' => $newEmail,
                    'name' => $newName,
                    'updated_at' => now()
                ]);

            // Collect all roles from duplicates
            $allRoles = [];

            // Get master user role
            $masterUser = DB::connection($masterConnection)
                ->table('users')
                ->where('id', $masterUserId)
                ->first();

            if ($masterUser) {
                $allRoles[] = $masterUser->role;
            }

            // Process duplicates
            foreach ($duplicateUsers as $duplicate) {
                $dupConnection = $this->getSystemConnection($duplicate['system']);

                // Get role before deletion
                $dupUser = DB::connection($dupConnection)
                    ->table('users')
                    ->where('id', $duplicate['id'])
                    ->first();

                if ($dupUser) {
                    $allRoles[] = $dupUser->role;
                }

                // Archive duplicate user data (optional: backup table)
                $this->archiveUser($duplicate['id'], $duplicate['system']);

                // Delete duplicate
                DB::connection($dupConnection)
                    ->table('users')
                    ->where('id', $duplicate['id'])
                    ->delete();
            }

            // Update master user with combined roles
            $uniqueRoles = array_unique($allRoles);
            $rolesJson = json_encode($uniqueRoles);

            DB::connection($masterConnection)
                ->table('users')
                ->where('id', $masterUserId)
                ->update([
                    'role' => implode(', ', $uniqueRoles), // or use JSON if supported
                    'roles' => $rolesJson, // if you add roles column
                    'updated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Successfully merged ' . (count($duplicateUsers) + 1) . ' accounts',
                'master_account' => [
                    'email' => $newEmail,
                    'name' => $newName,
                    'system' => $masterSystem,
                    'combined_roles' => $uniqueRoles
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Error merging accounts: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error merging accounts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get connection name for system
     */
    private function getSystemConnection($system)
    {
        $connections = [
            'balai' => 'mysql_balai',
            'reguler' => 'mysql_reguler',
            'fg' => 'mysql_fg',
            'tuk' => 'mysql_tuk'
        ];

        return $connections[$system] ?? 'mysql';
    }

    /**
     * Archive user before deletion
     */
    private function archiveUser($userId, $system)
    {
        try {
            $connection = $this->getSystemConnection($system);

            // Check if archive table exists, create if not
            if (!DB::connection($connection)->getSchemaBuilder()->hasTable('users_archive')) {
                DB::connection($connection)->getSchemaBuilder()->create('users_archive', function ($table) {
                    $table->increments('id');
                    $table->string('name');
                    $table->string('email');
                    $table->string('role');
                    $table->string('password');
                    $table->timestamps();
                    $table->integer('original_id');
                    $table->string('archive_reason');
                    $table->timestamp('archived_at');
                });
            }

            // Copy user to archive
            $user = DB::connection($connection)->table('users')->where('id', $userId)->first();
            if ($user) {
                DB::connection($connection)->table('users_archive')->insert([
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'password' => $user->password,
                    'original_id' => $userId,
                    'archive_reason' => 'duplicate_account_merge',
                    'archived_at' => now(),
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at
                ]);
            }
        } catch (\Exception $e) {
            Log::error("Error archiving user {$userId} from {$system}: " . $e->getMessage());
        }
    }

    /**
     * Get statistics about duplicates
     */
    public function getStatistics()
    {
        try {
            $systems = ['balai' => 'mysql_balai', 'reguler' => 'mysql_reguler', 'fg' => 'mysql_fg', 'tuk' => 'mysql_tuk'];
            $stats = [];

            foreach ($systems as $systemName => $connection) {
                try {
                    $totalUsers = DB::connection($connection)->table('users')->count();
                    $uniqueEmails = DB::connection($connection)->table('users')->distinct('email')->count('email');
                    $duplicates = $totalUsers - $uniqueEmails;

                    $stats[$systemName] = [
                        'total_users' => $totalUsers,
                        'unique_emails' => $uniqueEmails,
                        'duplicate_emails' => $duplicates,
                        'duplicate_percentage' => $totalUsers > 0 ? round(($duplicates / $totalUsers) * 100, 2) : 0
                    ];
                } catch (\Exception $e) {
                    $stats[$systemName] = [
                        'error' => $e->getMessage()
                    ];
                }
            }

            return response()->json($stats);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}