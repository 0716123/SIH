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
        // Admin Account
        User::firstOrCreate(
            ['email' => 'admin@sip.org'],
            [
                'name'           => 'System Administrator',
                'password'       => Hash::make('Admin@12345'),
                'role'           => 'admin',
                'phone'          => '+91 9876543210',
                'specialization' => 'System Administration',
                'license_number' => 'ADM-001',
                'is_active'      => true,
            ]
        );

        // Lead Doctor 1
        User::firstOrCreate(
            ['email' => 'dr.rajesh@sip.org'],
            [
                'name'           => 'Dr. Rajesh Patel',
                'password'       => Hash::make('Doctor@12345'),
                'role'           => 'doctor',
                'phone'          => '+91 9823456789',
                'specialization' => 'General Medicine & Infectious Diseases',
                'license_number' => 'GMC-GUJ-48291',
                'is_active'      => true,
            ]
        );

        // Specialist Doctor 2
        User::firstOrCreate(
            ['email' => 'dr.priya@sip.org'],
            [
                'name'           => 'Dr. Priya Sharma',
                'password'       => Hash::make('Doctor@12345'),
                'role'           => 'doctor',
                'phone'          => '+91 9712345678',
                'specialization' => 'Pulmonology & Critical Care',
                'license_number' => 'GMC-GUJ-51042',
                'is_active'      => true,
            ]
        );

        // Specialist Doctor 3
        User::firstOrCreate(
            ['email' => 'dr.anand@sip.org'],
            [
                'name'           => 'Dr. Anand Desai',
                'password'       => Hash::make('Doctor@12345'),
                'role'           => 'doctor',
                'phone'          => '+91 9898012345',
                'specialization' => 'Cardiology',
                'license_number' => 'GMC-GUJ-39872',
                'is_active'      => true,
            ]
        );

        // Reception / Staff Account
        User::firstOrCreate(
            ['email' => 'staff@sip.org'],
            [
                'name'           => 'Clinical Staff / Reception',
                'password'       => Hash::make('Staff@12345'),
                'role'           => 'staff',
                'phone'          => '+91 9123456780',
                'specialization' => 'Outpatient Desk & Records',
                'license_number' => 'REC-104',
                'is_active'      => true,
            ]
        );
    }
}
