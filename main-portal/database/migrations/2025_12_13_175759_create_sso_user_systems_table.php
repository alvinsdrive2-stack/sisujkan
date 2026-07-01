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
        Schema::create('sso_user_systems', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sso_user_id')->constrained()->onDelete('cascade');
            $table->enum('system_name', ['balai', 'reguler', 'suisei', 'tuk']);
            $table->bigInteger('system_user_id')->nullable();
            $table->boolean('is_approved')->default(false);
            $table->enum('approval_method', ['auto', 'manual', 'admin'])->default('manual');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
            $table->unique(['sso_user_id', 'system_name'], 'unique_user_system');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sso_user_systems');
    }
};
