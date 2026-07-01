<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SSOUserSystem extends Model
{
    use HasFactory;

    protected $table = 'sso_user_systems';
    protected $fillable = [
        'sso_user_id',
        'system_name',
        'system_user_id',
        'is_approved',
        'approval_method',
        'approved_at',
        'approved_by',
        'last_login_at'
    ];

    protected $casts = [
        'is_approved' => 'boolean',
        'approved_at' => 'datetime',
        'last_login_at' => 'datetime'
    ];

    public function ssoUser()
    {
        return $this->belongsTo(SSOUser::class, 'sso_user_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(SSOUser::class, 'approved_by');
    }
}
