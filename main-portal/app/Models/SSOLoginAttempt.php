<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SSOLoginAttempt extends Model
{
    use HasFactory;

    protected $table = 'sso_login_attempts';
    protected $fillable = [
        'sso_user_id',
        'email',
        'system_name',
        'status',
        'ip_address',
        'user_agent',
        'error_message'
    ];

    protected $casts = [
        'sso_user_id' => 'integer'
    ];

    public function ssoUser()
    {
        return $this->belongsTo(SSOUser::class, 'sso_user_id');
    }
}
