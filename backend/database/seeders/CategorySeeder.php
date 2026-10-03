<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $expenseCategories = [
            'Food',
            'Transport',
            'Shopping',
            'Bills',
            'Rent',
            'Healthcare',
            'Education',
            'Entertainment',
            'Travel',
            'Utilities',
            'Business',
            'Other',
        ];

        foreach ($expenseCategories as $name) {
            Category::firstOrCreate([
                'user_id' => null,
                'name' => $name,
                'type' => 'expense',
            ]);
        }

        $incomeCategories = [
            'Salary',
            'Freelance',
            'Business',
            'Investment',
            'Bonus',
            'Other',
        ];

        foreach ($incomeCategories as $name) {
            Category::firstOrCreate([
                'user_id' => null,
                'name' => $name,
                'type' => 'income',
            ]);
        }
    }
}
