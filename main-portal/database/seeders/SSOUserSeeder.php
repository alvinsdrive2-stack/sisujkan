<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SSOUser;
use App\Models\SSOUserSystem;
use Illuminate\Support\Facades\Hash;

class SSOUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update SSO user for nasiryusuf@lspgatensi.id
        $ssoUser = SSOUser::updateOrCreate(
            ['email' => 'nasiryusuf@lspgatensi.id'],
            [
                'name' => 'Nasir Yusuf',
                'password' => Hash::make('password'), // Default password
                'email_verified_at' => now(),
                'status' => 'active',
            ]
        );

        $this->command->info('SSO User created/updated: ' . $ssoUser->email);

        // Approve access to all systems manually (without checking external databases)
        $systems = ['balai', 'reguler', 'suisei', 'tuk'];

        foreach ($systems as $systemName) {
            SSOUserSystem::updateOrCreate(
                [
                    'sso_user_id' => $ssoUser->id,
                    'system_name' => $systemName
                ],
                [
                    'system_user_id' => null, // Will be mapped when user logs in
                    'is_approved' => true,
                    'approval_method' => 'auto', // Change to auto since we're pre-approving
                    'approved_at' => now(),
                ]
            );

            $this->command->info("✓ Approved access to {$systemName} system");
        }

        // Create some additional test users
        $testUsers = [
            [
                'name' => 'Admin Balai',
                'email' => 'admin@balai.com',
                'password' => 'password',
                'systems' => ['balai']
            ],
            [
                'name' => 'Admin Reguler',
                'email' => 'admin@reguler.com',
                'password' => 'password',
                'systems' => ['reguler']
            ],
            [
                'name' => 'Admin FG',
                'email' => 'admin@fg.com',
                'password' => 'password',
                'systems' => ['suisei']
            ],
            [
                'name' => 'Admin TUK',
                'email' => 'admin@tuk.com',
                'password' => 'password',
                'systems' => ['tuk']
            ],
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@sso.com',
                'password' => 'password',
                'systems' => ['balai', 'reguler', 'suisei', 'tuk']
            ]
        ];

        foreach ($testUsers as $userData) {
            $user = SSOUser::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => Hash::make($userData['password']),
                    'email_verified_at' => now(),
                    'status' => 'active',
                ]
            );

            foreach ($userData['systems'] as $systemName) {
                SSOUserSystem::updateOrCreate(
                    [
                        'sso_user_id' => $user->id,
                        'system_name' => $systemName
                    ],
                    [
                        'system_user_id' => null,
                        'is_approved' => true,
                        'approval_method' => 'manual',
                        'approved_at' => now(),
                    ]
                );
            }
        }

        $this->command->info('Created ' . count($testUsers) . ' test users with approved access');
        $this->command->info('');
        $this->command->info('Login Credentials:');
        $this->command->info('Email: nasiryusuf@lspgatensi.id | Password: password');
        $this->command->info('Email: superadmin@sso.com | Password: password');
        $this->command->info('Email: admin@balai.com | Password: password');
        $this->command->info('Email: admin@reguler.com | Password: password');
        $this->command->info('Email: admin@fg.com | Password: password');
        $this->command->info('Email: admin@tuk.com | Password: password');
    }
}