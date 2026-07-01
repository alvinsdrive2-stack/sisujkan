<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TestExternalDbConnection extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sso:test-db-connections';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test read-only connections to external databases';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $connections = [
            'mysql_balai' => 'lspgatensi_balai',
            'mysql_reguler' => 'lspgatensi_reguler',
            'mysql_fg' => 'lspgatensi_fg',
            'mysql_tuk' => 'lspgatensi_tuk_service'
        ];

        $this->info('Testing External Database Connections (READ-ONLY)');
        $this->line('============================================');

        foreach ($connections as $connection => $database) {
            $this->line("\nTesting connection to {$database}...");

            try {
                // Test connection
                DB::connection($connection)->getPdo();
                $this->info("✓ Connection successful");

                // Set read-only mode
                DB::connection($connection)->statement("SET SESSION TRANSACTION READ ONLY");
                $this->info("✓ Read-only mode enabled");

                // Test read operation
                $userCount = DB::connection($connection)->table('users')->count();
                $this->info("✓ Read operation successful - Found {$userCount} users");

                // Test specific email for nasiryusuf@lspgatensi.id
                $testUser = DB::connection($connection)
                    ->table('users')
                    ->where('email', 'nasiryusuf@lspgatensi.id')
                    ->first();

                if ($testUser) {
                    $this->info("✓ Test user found: {$testUser->name} ({$testUser->email})");
                } else {
                    $this->warn("⚠ Test user (nasiryusuf@lspgatensi.id) not found in {$database}");
                }

            } catch (\Exception $e) {
                $this->error("✗ Error connecting to {$database}: " . $e->getMessage());
            }
        }

        $this->line("\n============================================");
        $this->info('Connection tests completed!');
    }
}
