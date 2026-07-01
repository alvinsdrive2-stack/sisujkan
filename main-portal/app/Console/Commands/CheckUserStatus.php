<?php

namespace App\Console\Commands;

use App\Models\SSOUser;
use App\Models\SSOUserSystem;
use Illuminate\Console\Command;

class CheckUserStatus extends Command
{
    protected $signature = 'sso:check-user {email}';
    protected $description = 'Check user SSO status and system access';

    public function handle()
    {
        $email = $this->argument('email');

        $user = SSOUser::where('email', $email)->first();

        if (!$user) {
            $this->error("User {$email} not found!");
            return;
        }

        $this->info("User: {$user->name} ({$user->email})");
        $this->info("Status: {$user->status}");
        $this->info("User ID: {$user->id}");
        $this->line("");

        $systems = SSOUserSystem::where('sso_user_id', $user->id)->get();

        $this->info("System Access:");
        foreach ($systems as $system) {
            $status = $system->is_approved ? '✅ APPROVED' : '❌ PENDING';
            $method = $system->approval_method ?? 'none';
            $this->line("  - {$system->system_name}: {$status} (method: {$method})");

            if ($system->approved_at) {
                $this->line("    Approved at: {$system->approved_at}");
            }
        }
    }
}