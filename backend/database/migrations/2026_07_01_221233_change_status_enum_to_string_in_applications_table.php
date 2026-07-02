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
        // Drop the check constraint created by the enum in PostgreSQL
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-adding the check constraint would go here if needed, but not strictly necessary for rollback
    }
};
