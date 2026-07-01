<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class SSOUser extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'sso_users';
    protected $fillable = ['name', 'email', 'password', 'status', 'role'];
    protected $hidden = ['password', 'remember_token'];

    public function userSystems()
    {
        return $this->hasMany(SSOUserSystem::class, 'sso_user_id');
    }

    public function loginAttempts()
    {
        return $this->hasMany(SSOLoginAttempt::class, 'sso_user_id');
    }
}
