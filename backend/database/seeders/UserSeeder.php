<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Demo Admin Account
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Demo Administrator',
                'password' => Hash::make('AdminPassword123!'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // Demo Regular User Account
        User::firstOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Demo User',
                'password' => Hash::make('UserPassword123!'),
                'role' => 'user',
                'email_verified_at' => now(),
            ]
        );
    }
}
