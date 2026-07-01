<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CountDuplicateEmails extends Command
{
    protected $signature = 'sso:count-duplicate-emails';
    protected $description = 'Count users with same email across all 4 databases';

    public function handle()
    {
        $this->info('Checking duplicate emails across 4 databases...');
        $this->line('===========================================');

        $databases = [
            'balai' => 'mysql_balai',
            'reguler' => 'mysql_reguler',
            'suisei' => 'mysql_fg',
            'tuk' => 'mysql_tuk'
        ];

        $allEmails = [];
        $emailCounts = [];
        $systemUserCounts = [];

        // Collect all emails from all databases
        foreach ($databases as $dbName => $connection) {
            try {
                $users = DB::connection($connection)->table('users')->select('email')->get();
                $systemUserCounts[$dbName] = count($users);

                foreach ($users as $user) {
                    $email = $user->email;
                    if (!isset($emailCounts[$email])) {
                        $emailCounts[$email] = 0;
                    }
                    $emailCounts[$email]++;

                    if (!isset($allEmails[$email])) {
                        $allEmails[$email] = [];
                    }
                    $allEmails[$email][] = $dbName;
                }

                $this->line("✓ {$dbName}: {$systemUserCounts[$dbName]} users");

            } catch (\Exception $e) {
                $this->error("✗ Error connecting to {$dbName}: " . $e->getMessage());
                $systemUserCounts[$dbName] = 0;
            }
        }

        $this->line('===========================================');
        $this->info('Total unique emails: ' . count($emailCounts));

        // Count duplicates
        $duplicateCounts = [];
        for ($i = 2; $i <= 4; $i++) {
            $duplicateCounts[$i] = 0;
        }

        foreach ($emailCounts as $email => $count) {
            if ($count >= 2) {
                $duplicateCounts[$count]++;
            }
        }

        $this->line("\nDuplicate Analysis:");
        $this->line('- Emails in 2 databases: ' . ($duplicateCounts[2] ?? 0));
        $this->line('- Emails in 3 databases: ' . ($duplicateCounts[3] ?? 0));
        $this->line('- Emails in all 4 databases: ' . ($duplicateCounts[4] ?? 0));

        // Show total accounts that can access multiple systems
        $totalMultiSystem = 0;
        foreach ($duplicateCounts as $count => $num) {
            if ($count >= 2) {
                $totalMultiSystem += $num;
            }
        }

        $this->line("\n" . str_repeat('=', 50));
        $this->info('📊 SUMMARY');
        $this->line(str_repeat('=', 50));
        $this->info("Total accounts that can access multiple systems: {$totalMultiSystem}");
        $this->line("- Access to 2 systems: " . ($duplicateCounts[2] ?? 0) . " accounts");
        $this->line("- Access to 3 systems: " . ($duplicateCounts[3] ?? 0) . " accounts");
        $this->line("- Access to all 4 systems: " . ($duplicateCounts[4] ?? 0) . " accounts");

        // Top 10 most duplicated emails
        $this->line("\nTop 10 emails with most system access:");
        arsort($emailCounts);
        $count = 0;
        foreach ($emailCounts as $email => $count) {
            if ($count >= 2 && $count < 10) {
                $systems = implode(', ', $allEmails[$email]);
                $this->line("- {$email}: {$count} systems ({$systems})");
                $count++;
                if ($count >= 10) break;
            }
        }
    }
}