<?php

namespace App\Services;

use App\Models\SSOUser;
use App\Models\SSOUserSystem;
use App\Models\SSOLoginAttempt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class SSOService
{
    protected $connections = [
        'balai' => 'mysql_balai',
        'reguler' => 'mysql_reguler',
        'suisei' => 'mysql_fg',  // Suisei uses FG database
        'tuk' => 'mysql_tuk'
    ];

    /**
     * Check if name exists in target system using multiple matching methods (READ-ONLY)
     */
    public function checkNameInTargetSystem($name, $email, $systemName)
    {
        if (!isset($this->connections[$systemName])) {
            \Log::warning("Unknown system: {$systemName}");
            return null;
        }

        try {
            // Set connection to read-only mode
            DB::connection($this->connections[$systemName])->statement("SET SESSION TRANSACTION READ ONLY");

            // Method 1: Exact name match - collect all exact matches
            $exactMatches = DB::connection($this->connections[$systemName])
                ->table('users')
                ->where('name', $name)
                ->get(['id', 'name', 'email', 'role']);

            if ($exactMatches->count() > 0) {
                if ($exactMatches->count() === 1) {
                    \Log::info("Exact name match found in {$systemName}: {$name}");
                    return $exactMatches->first();
                } else {
                    \Log::info("Multiple exact matches found in {$systemName}: " . $exactMatches->count() . " matches for '{$name}'");
                    $matchedUsers = [];
                    foreach ($exactMatches as $user) {
                        $matchedUsers[] = (object) [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'role' => $user->role,
                            'match_type' => 'exact'
                        ];
                    }
                    return (object) [
                        'multiple_matches' => true,
                        'matches' => $matchedUsers,
                        'count' => count($matchedUsers)
                    ];
                }
            }

            // Method 2: Enhanced name matching with stricter logic
            $nameWords = $this->getNameWords($name);
            $users = DB::connection($this->connections[$systemName])
                ->table('users')
                ->select(['id', 'name', 'email', 'role'])
                ->get();

            $matchedUsers = [];
            foreach ($users as $dbUser) {
                $dbUserWords = $this->getNameWords($dbUser->name);

                // Enhanced matching logic
                if ($this->isStrictNameMatch($name, $dbUser->name, $nameWords, $dbUserWords)) {
                    \Log::info("Strict name match found in {$systemName}: '{$name}' → '{$dbUser->name}'");
                    $matchedUsers[] = (object) [
                        'id' => $dbUser->id,
                        'name' => $dbUser->name,
                        'email' => $dbUser->email,
                        'role' => $dbUser->role,
                        'match_type' => 'strict'
                    ];
                }
            }

            if (count($matchedUsers) === 0) {
                \Log::info("No name match found in {$systemName}: {$name}");
                return null;
            } elseif (count($matchedUsers) === 1) {
                \Log::info("Single match found in {$systemName}: '{$name}' → '{$matchedUsers[0]->name}'");
                return $matchedUsers[0];
            } else {
                \Log::info("Multiple matches found in {$systemName}: " . count($matchedUsers) . " matches for '{$name}'");
                return (object) [
                    'multiple_matches' => true,
                    'matches' => $matchedUsers,
                    'count' => count($matchedUsers)
                ];
            }

        } catch (\Exception $e) {
            \Log::error("Database READ error for {$systemName}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Legacy method - backward compatibility
     */
    public function checkEmailInTargetSystem($email, $systemName)
    {
        // For backward compatibility, try email first, then name
        try {
            // Set connection to read-only mode
            DB::connection($this->connections[$systemName])->statement("SET SESSION TRANSACTION READ ONLY");

            // Try email match first
            $user = DB::connection($this->connections[$systemName])
                ->table('users')
                ->where('email', $email)
                ->first(['id', 'name', 'email', 'role']);

            if ($user) {
                \Log::info("Email match found in {$systemName}: {$email}");
                return $user;
            }

            // If email not found, get the name from SSO user and try name matching
            $ssoUser = SSOUser::where('email', $email)->first();
            if ($ssoUser) {
                return $this->checkNameInTargetSystem($ssoUser->name, $email, $systemName);
            }

            return null;

        } catch (\Exception $e) {
            \Log::error("Database READ error for {$systemName}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Normalize name for comparison
     */
    private function normalizeName($name)
    {
        // Convert to lowercase and remove special characters
        $name = strtolower($name);

        // Remove common titles
        $name = preg_replace('/\b(sdr|bapak|ibuk|mr|mrs|ms|dr|ir|eng|prof|ht|st|darti)\b/', '', $name);

        // Remove punctuation and extra spaces
        $name = preg_replace('/[^a-zA-Z0-9\s]/', '', $name);
        $name = preg_replace('/\s+/', ' ', $name);

        return trim($name);
    }

    /**
     * Get words from name (filter common titles)
     */
    private function getNameWords($name)
    {
        // Convert to lowercase and split into words
        $name = strtolower($name);

        // Remove common titles and words
        $commonWords = ['sdr', 'bapak', 'ibuk', 'mr', 'mrs', 'ms', 'dr', 'ir', 'eng', 'prof', 'ht', 'st', 'darti'];
        $words = explode(' ', $name);

        // Filter out common words and empty strings
        $filteredWords = [];
        foreach ($words as $word) {
            $word = trim($word);
            if (strlen($word) >= 2 && !in_array($word, $commonWords)) {
                $filteredWords[] = $word;
            }
        }

        return $filteredWords;
    }

    /**
     * Enhanced name matching for Indonesian names with better logic
     */
    private function isStrictNameMatch($name1, $name2, $words1, $words2)
    {
        // Exact normalized match first
        $normalizedName1 = $this->normalizeName($name1);
        $normalizedName2 = $this->normalizeName($name2);
        if ($normalizedName1 === $normalizedName2) {
            \Log::info("Exact normalized match: {$name1} = {$name2}");
            return true;
        }

        // Enhanced logic for Indonesian names
        return $this->isIndonesianNameMatch($name1, $name2, $words1, $words2);
    }

    /**
     * Special matching for Indonesian name patterns
     */
    private function isIndonesianNameMatch($name1, $name2, $words1, $words2)
    {
        // Extract core names and initials
        $coreName1 = $this->extractCoreName($name1, $words1);
        $coreName2 = $this->extractCoreName($name2, $words2);

        // Match core names
        $coreMatch = $this->matchCoreNames($coreName1, $coreName2);

        // Additional checks for Indonesian patterns
        $additionalMatch = $this->checkIndonesianPatterns($name1, $name2, $words1, $words2);

        $isMatch = $coreMatch || $additionalMatch;

        if ($isMatch) {
            \Log::info("Indonesian name match: '{$name1}' vs '{$name2}' - CORE: " . json_encode($coreMatch) . " PATTERNS: " . json_encode($additionalMatch));
        }

        return $isMatch;
    }

    /**
     * Extract core name parts (remove titles, initials, etc.)
     */
    private function extractCoreName($name, $words)
    {
        $core = [];
        foreach ($words as $word) {
            // Skip single letters (likely initials)
            if (strlen($word) == 1 && preg_match('/[A-Z]/', $word)) {
                continue;
            }

            // Skip common Indonesian titles and degrees
            if (in_array(strtolower($word), ['s', 'kom', 'st', 'darti', 'mm'])) {
                continue;
            }

            $core[] = strtolower($word);
        }

        return array_unique($core);
    }

    /**
     * Match core names between two name sets - MUCH MORE STRICT
     */
    private function matchCoreNames($core1, $core2)
    {
        if (empty($core1) || empty($core2)) {
            return false;
        }

        // CRITICAL: Require at least 2 common words for safety
        $commonWords = array_intersect($core1, $core2);
        if (count($commonWords) < 2) {
            return false;
        }

        // CRITICAL: Require 100% match for shorter name, 90%+ for longer
        $percentage1 = count($commonWords) / count($core1);
        $percentage2 = count($commonWords) / count($core2);

        $minWords = min(count($core1), count($core2));
        $maxWords = max(count($core1), count($core2));

        // Extra strict requirements for cross-system safety
        if ($minWords === 2) {
            // For 2-word names, both must match exactly
            return ($percentage1 === 1.0 && $percentage2 === 1.0);
        } else {
            // For longer names, require 90%+ match
            return ($percentage1 >= 0.9 && $percentage2 >= 0.9);
        }
    }

    /**
     * Check Indonesian-specific name patterns - Strict but Smart
     */
    private function checkIndonesianPatterns($name1, $name2, $words1, $words2)
    {
        // Pattern 1: Initial matching + word match (N. + Nasir)
        $initialMatch1 = $this->matchInitialWithWordRequirement($words1, $words2);
        $initialMatch2 = $this->matchInitialWithWordRequirement($words2, $words1);

        // Pattern 2: Conservative word matching
        $wordMatch = $this->conservativeWordMatching($words1, $words2);

        return $initialMatch1 || $initialMatch2 || $wordMatch;
    }

    /**
     * Very conservative word matching to prevent false positives
     */
    private function conservativeWordMatching($words1, $words2)
    {
        // Must have at least 2 words in both names
        if (count($words1) < 2 || count($words2) < 2) {
            return false;
        }

        $exactMatches = 0;
        foreach ($words1 as $word1) {
            foreach ($words2 as $word2) {
                // Only allow exact word matches OR very close matches (1 char diff)
                $word1 = strtolower(trim($word1));
                $word2 = strtolower(trim($word2));

                if ($word1 === $word2) {
                    $exactMatches++;
                    break;
                }

                // Allow 1 character difference only for longer words (5+ chars)
                if (strlen($word1) >= 5 && strlen($word2) >= 5) {
                    $distance = levenshtein($word1, $word2);
                    if ($distance <= 1) {
                        $exactMatches++;
                        break;
                    }
                }
            }
        }

        // Require ALL words from shorter name to match
        $shorterCount = min(count($words1), count($words2));
        return $exactMatches >= $shorterCount && $exactMatches >= 2;
    }

    /**
     * Safe initial matching with word requirement
     * "N. Nasir" will match to "Nasir" but NOT "N." alone
     */
    private function matchInitialWithWordRequirement($words1, $words2)
    {
        $hasInitial = false;
        $initialLetter = '';

        // Find initial in first name
        foreach ($words1 as $word1) {
            if (strlen($word1) == 2 && $word1[1] == '.') {
                $hasInitial = true;
                $initialLetter = strtolower($word1[0]);
                break;
            }
        }

        if (!$hasInitial) {
            return false; // No initial found
        }

        // Look for at least one word in second name that starts with the initial
        $hasWordMatch = false;
        foreach ($words2 as $word2) {
            if (strlen($word2) >= 3 && strtolower($word2[0]) === $initialLetter) {
                $hasWordMatch = true;
                break;
            }
        }

        // CRITICAL: Must have BOTH initial AND word match
        return $hasInitial && $hasWordMatch;
    }

    /**
     * Check if two words are similar (with some tolerance)
     */
    private function isWordSimilar($word1, $word2)
    {
        // Exact match
        if ($word1 === $word2) {
            return true;
        }

        // Levenshtein distance for close matches
        $distance = levenshtein($word1, $word2);
        $maxLength = max(strlen($word1), strlen($word2));

        // Allow 1 character difference for short words, 2 for longer words
        $allowedDistance = $maxLength <= 4 ? 1 : 2;

        return $distance <= $allowedDistance && $distance / $maxLength <= 0.3;
    }

    /**
     * Check user access to system and generate token directly (no approval needed)
     */
    public function checkAndApproveUserAccess($ssoUserId, $systemName, $email)
    {
        // Get SSO user details
        $ssoUser = SSOUser::find($ssoUserId);
        if (!$ssoUser) {
            Log::error("SSO User not found: {$ssoUserId}");
            return [
                'status' => 'error',
                'message' => 'User tidak ditemukan'
            ];
        }

        Log::info("Checking access for user {$ssoUser->name} ({$email}) to {$systemName}", ['sso_user_id' => $ssoUserId]);

        // Log login attempt
        SSOLoginAttempt::create([
            'sso_user_id' => $ssoUserId,
            'email' => $email,
            'system_name' => $systemName,
            'status' => 'success',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent()
        ]);

        // Check if name exists in target system using multiple matching methods
        $targetUser = $this->checkNameInTargetSystem($ssoUser->name, $email, $systemName);

        if ($targetUser) {
            // Store the access record for tracking
            if (isset($targetUser->multiple_matches) && $targetUser->multiple_matches) {
                // Handle multiple matches - show account selection
                Log::info("Multiple matches found for {$ssoUser->name} in {$systemName}: {$targetUser->count} matches");

                return [
                    'status' => 'multiple_matches',
                    'message' => "Ditemukan {$targetUser->count} akun dengan nama mirip di " . ucfirst($systemName) . ". Silakan pilih akun yang akan digunakan.",
                    'matches' => $targetUser->matches,
                    'count' => $targetUser->count,
                    'sso_name' => $ssoUser->name
                ];
            } else {
                // Single match - auto approve and store system user ID
                $matchType = $targetUser->match_type ?? 'exact';

                SSOUserSystem::updateOrCreate(
                    ['sso_user_id' => $ssoUserId, 'system_name' => $systemName],
                    [
                        'system_user_id' => $targetUser->id,
                        'is_approved' => true,
                        'approval_method' => 'auto',
                        'approved_at' => now()
                    ]
                );

                Log::info("Direct access granted for {$ssoUser->name} → {$targetUser->name} ({$matchType}) in {$systemName}");

                return [
                    'status' => 'approved',
                    'message' => "Nama ditemukan di " . ucfirst($systemName) . ". Akses langsung diberikan.",
                    'user_data' => $targetUser,
                    'match_type' => $matchType,
                    'matched_name' => $targetUser->name
                ];
            }
        } else {
            // No name match found - still allow access but mark as no mapping
            Log::info("No name match found for {$ssoUser->name} in {$systemName}, but allowing access");

            SSOUserSystem::updateOrCreate(
                ['sso_user_id' => $ssoUserId, 'system_name' => $systemName],
                [
                    'system_user_id' => null,
                    'is_approved' => true,
                    'approval_method' => 'auto',
                    'approved_at' => now()
                ]
            );

            return [
                'status' => 'approved',
                'message' => 'Akses langsung diberikan ke ' . ucfirst($systemName) . ' (tanpa pemetaan akun).',
                'user_data' => null,
                'direct_access' => true
            ];
        }
    }

    /**
     * Get human-readable message for match type
     */
    private function getMatchTypeMessage($matchType)
    {
        $messages = [
            'exact' => 'nama yang sama persis',
            'normalized' => 'nama yang mirip (abaikan kapital dan spasi)',
            'partial' => 'sebagian nama yang cocok',
            'similar_parts' => 'nama dengan kemiripan kata'
        ];

        return $messages[$matchType] ?? 'metode pencocokan nama';
    }

    /**
     * Generate SSO token
     */
    public function generateSSOToken($ssoUserId, $systemName)
    {
        $token = Str::random(60);

        // Store token in cache with 1 hour expiry
        $tokenData = [
            'sso_user_id' => $ssoUserId,
            'system_name' => $systemName,
            'expires_at' => now()->addHour()
        ];

        cache([
            "sso_token_{$token}" => $tokenData
        ], 3600);

        Log::info("SSO Token generated", [
            'token' => substr($token, 0, 10) . '...',
            'user_id' => $ssoUserId,
            'system' => $systemName,
            'expires_at' => $tokenData['expires_at']
        ]);

        return $token;
    }

    /**
     * Verify SSO token
     */
    public function verifySSOToken($token)
    {
        $cached = cache("sso_token_{$token}");

        if (!$cached || now()->greaterThan($cached['expires_at'])) {
            return null;
        }

        $ssoUser = SSOUser::find($cached['sso_user_id']);

        if (!$ssoUser) {
            return null;
        }

        // Check if user has access to the system
        $userSystem = SSOUserSystem::where([
            'sso_user_id' => $ssoUser->id,
            'system_name' => $cached['system_name'],
            'is_approved' => true
        ])->first();

        if (!$userSystem) {
            return null;
        }

        // Get user data from target system using stored system_user_id
        $targetUserData = null;
        if ($userSystem->system_user_id) {
            try {
                $connection = $this->connections[$cached['system_name']] ?? null;
                if ($connection) {
                    $targetUserData = DB::connection($connection)
                        ->table('users')
                        ->where('id', $userSystem->system_user_id)
                        ->first(['id', 'name', 'email', 'role']);

                    \Log::info("Retrieved specific user data for SSO verification", [
                        'sso_user_id' => $ssoUser->id,
                        'system' => $cached['system_name'],
                        'system_user_id' => $userSystem->system_user_id,
                        'target_user' => $targetUserData ? $targetUserData->name : 'not found'
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error("Error retrieving target user data: " . $e->getMessage());
            }
        }

        return [
            'sso_user' => $ssoUser,
            'system' => $cached['system_name'],
            'user_data' => $targetUserData
        ];
    }

    /**
     * Get all available systems
     */
    public function getAvailableSystems()
    {
        return [
            'balai' => [
                'name' => 'Sistem Balai',
                'url' => env('BALAI_URL', 'http://localhost:8001'),
                'description' => 'Manajemen Balai dan Sertifikasi'
            ],
            'reguler' => [
                'name' => 'Sistem Reguler',
                'url' => env('REGULER_URL', 'http://localhost:8002'),
                'description' => 'Sistem untuk Regular Users'
            ],
            'suisei' => [
                'name' => 'Sistem FG/Suisei',
                'url' => env('FG_SUISEI_URL', 'http://localhost:8003'),
                'description' => 'Fresh Graduate Management'
            ],
            'tuk' => [
                'name' => 'Sistem TUK',
                'url' => env('TUK_URL', 'http://localhost:8004'),
                'description' => 'Verifikasi TUK'
            ]
        ];
    }
}