<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class AnalyzeUsersRoles extends Command
{
    protected $signature = 'sso:analyze-users-roles';
    protected $description = 'Analyze all users and roles from 4 databases';

    public function handle()
    {
        $this->info('Analyzing users and roles from 4 databases...');
        $this->line('========================================');

        $databases = [
            'balai' => 'mysql_balai',
            'reguler' => 'mysql_reguler',
            'suisei' => 'mysql_fg',
            'tuk' => 'mysql_tuk'
        ];

        $allUsers = [];
        $allRoles = [];
        $databaseStats = [];

        foreach ($databases as $dbName => $connection) {
            try {
                // Get all users with roles
                $users = DB::connection($connection)
                    ->table('users')
                    ->select('email', 'name', 'role', 'created_at', 'updated_at')
                    ->orderBy('created_at', 'desc')
                    ->get();

                $databaseStats[$dbName] = [
                    'total_users' => count($users),
                    'unique_roles' => [],
                    'role_distribution' => []
                ];

                foreach ($users as $user) {
                    // Store user data
                    if (!isset($allUsers[$user->email])) {
                        $allUsers[$user->email] = [
                            'name' => $user->name ?? 'N/A',
                            'roles' => []
                        ];
                    }

                    if ($user->role && !in_array($user->role, $allUsers[$user->email]['roles'])) {
                        $allUsers[$user->email]['roles'][] = [
                            'database' => $dbName,
                            'role' => $user->role
                        ];
                    }

                    // Collect role statistics
                    if ($user->role) {
                        if (!isset($databaseStats[$dbName]['role_distribution'][$user->role])) {
                            $databaseStats[$dbName]['role_distribution'][$user->role] = 0;
                        }
                        $databaseStats[$dbName]['role_distribution'][$user->role]++;

                        if (!in_array($user->role, $databaseStats[$dbName]['unique_roles'])) {
                            $databaseStats[$dbName]['unique_roles'][] = $user->role;
                        }

                        if (!isset($allRoles[$user->role])) {
                            $allRoles[$user->role] = [
                                'databases' => [],
                                'count' => 0
                            ];
                        }

                        if (!in_array($dbName, $allRoles[$user->role]['databases'])) {
                            $allRoles[$user->role]['databases'][] = $dbName;
                        }
                        $allRoles[$user->role]['count']++;
                    }
                }

                $this->info("✓ {$dbName}: {$databaseStats[$dbName]['total_users']} users");

            } catch (\Exception $e) {
                $this->error("✗ Error connecting to {$dbName}: " . $e->getMessage());
            }
        }

        $this->line('========================================');
        $this->info('Total unique users: ' . count($allUsers));

        // Save detailed user list to file
        $this->saveUserList($allUsers);

        // Display database statistics
        $this->displayDatabaseStats($databaseStats);

        // Display roles analysis
        $this->displayRolesAnalysis($allRoles);
    }

    private function saveUserList($users)
    {
        $userList = "# Users List from All 4 Databases\n";
        $userList .= "# Generated on: " . now()->format('Y-m-d H:i:s') . "\n\n";
        $userList .= "Email,Name,Databases,Roles\n";

        foreach ($users as $email => $data) {
            $databases = [];
            $roles = [];

            foreach ($data['roles'] as $roleData) {
                $databases[] = $roleData['database'];
                $roles[] = $roleData['database'] . ':' . $roleData['role'];
            }

            $userList .= $email . ',' .
                        str_replace(',', ';', $data['name']) . ',' .
                        implode(';', $databases) . ',' .
                        implode(' | ', $roles) . "\n";
        }

        $filePath = storage_path('app/users_list_' . date('Y-m-d_H-i-s') . '.csv');
        File::put($filePath, $userList);

        $this->info("\n📄 Detailed user list saved to: " . $filePath);
    }

    private function displayDatabaseStats($stats)
    {
        $this->line("\n" . str_repeat('=', 60));
        $this->info('📊 DATABASE STATISTICS');
        $this->line(str_repeat('=', 60));

        foreach ($stats as $dbName => $data) {
            $this->line("\n🏢 " . strtoupper($dbName) . " DATABASE:");
            $this->line("   Total Users: " . $data['total_users']);
            $this->line("   Unique Roles: " . count($data['unique_roles']));

            $this->line("\n   Role Distribution:");
            foreach ($data['role_distribution'] as $role => $count) {
                $percentage = round(($count / $data['total_users']) * 100, 2);
                $this->line("   - {$role}: {$count} users ({$percentage}%)");
            }
        }
    }

    private function displayRolesAnalysis($roles)
    {
        $this->line("\n" . str_repeat('=', 60));
        $this->info('👥 ROLES ANALYSIS');
        $this->line(str_repeat('=', 60));

        $this->line("\n📈 ROLES BY FREQUENCY:");
        arsort($roles);
        $count = 0;
        foreach ($roles as $role => $data) {
            $this->line(sprintf("%-30s %5d users %s",
                $role,
                $data['count'],
                implode(', ', $data['databases'])
            ));
            $count++;
        }

        // Find unique roles across all databases
        $uniqueRoles = array_keys($roles);
        $this->line("\n🎯 SUMMARY:");
        $this->line("Total unique roles across all databases: " . count($uniqueRoles));

        // Show most common roles
        $commonRoles = array_filter($roles, function($data) {
            return count($data['databases']) >= 2;
        });

        if (!empty($commonRoles)) {
            $this->line("\n🔄 Roles found in multiple databases:");
            foreach ($commonRoles as $role => $data) {
                $this->line("   - {$role}: " . count($data['databases']) . " databases");
            }
        }
    }
}
