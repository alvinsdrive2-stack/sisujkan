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
        Schema::create('sso_login_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sso_user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('email');
            $table->enum('system_name', ['balai', 'reguler', 'suisei', 'tuk']);
            $table->enum('status', ['success', 'failed', 'pending_approval']);
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('error_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sso_login_attempts');
    }
};
