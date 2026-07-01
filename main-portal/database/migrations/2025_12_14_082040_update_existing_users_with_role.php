<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing users with default role 'user'
        DB::table('sso_users')
            ->whereNull('role')
            ->update(['role' => 'user']);

        // Set first user as admin (you can change this email)
        DB::table('sso_users')
            ->where('email', 'like', '%@%')
            ->limit(1) // Only for demonstration - update this for your specific admin email
            ->update(['role' => 'admin']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // You can optionally revert the role changes
        // DB::table('sso_users')
        //     ->where('role', 'user')
        //     ->update(['role' => null]);
    }
};