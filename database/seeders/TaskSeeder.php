<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Task;
use Illuminate\Support\Facades\Hash;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create the "Test Admin" User
        // We capture this into a variable ($user) so we can give it tasks later
        $user = User::create([
            'name' => 'Test Admin',
            'email' => 'User1@gmail.com', // Make sure this matches your login
            'password' => Hash::make('password123'),
            'role' => 'User'
        ]);

        // 2. Create the "Admin" User
        // We don't need to save this to a variable since we aren't adding tasks to it yet
        User::create([
            'name' => 'Admin',
            'email' => 'Admin@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'admin'
        ]);

        // 3. Create Tasks for the "Test Admin" user we created above
        // notice we use '$user->tasks()->createMany', which works!
        $user->tasks()->createMany([
            [
                'title' => 'Fix Dashboard Layout',
                'description' => 'Fix the alignment of the login card and input fields.',
                'due_date' => now()->addDays(2),
                'priority' => 'High',
                'status' => 'todo',
                'is_pinned' => false
            ],
            [
                'title' => 'Setup PostgreSQL Migrations',
                'description' => 'Ensure the priority column exists in the task table.',
                'due_date' => now()->addDays(1),
                'priority' => 'Medium',
                'status' => 'in-progress',
                'is_pinned' => false
            ],
            [
                'title' => 'Connect React to Laravel',
                'description' => 'Verify that the API base URL is correct.',
                'due_date' => now()->subDay(),
                'priority' => 'Low',
                'status' => 'completed',
                'is_pinned' => true
            ]
        ]);
    }
}
