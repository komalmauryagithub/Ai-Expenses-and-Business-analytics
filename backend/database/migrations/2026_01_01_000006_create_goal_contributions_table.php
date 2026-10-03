<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('goal_contributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financial_goal_id')->constrained('financial_goals')->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->date('contribution_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('financial_goal_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goal_contributions');
    }
};
