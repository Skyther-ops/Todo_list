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
    // Use 'Schema::table' to modify the existing 'task' table
    Schema::table('task', function (Blueprint $table) {
        // REMOVE $table->id() or any other duplicate columns here
        $table->string('priority')->default('Low')->after('due_date');
    });
}

public function down(): void
{
    Schema::table('task', function (Blueprint $table) {
        $table->dropColumn('priority');
    });
}
};
