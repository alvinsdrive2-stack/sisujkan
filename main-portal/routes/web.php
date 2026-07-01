<?php

use App\Http\Controllers\Admin\DatabaseAnalysisController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\UserMappingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SSOAuthController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// SSO Routes - allow both guest and auth untuk menerima logout notification
Route::get('/', [SSOAuthController::class, 'showLoginForm'])->name('login');

Route::middleware('guest')->group(function () {
    Route::post('/login', [SSOAuthController::class, 'login'])
         ->middleware('readonly.db')
         ->name('login.submit');
});

// Route untuk redirect dari dashboard (tidak perlu guest middleware)
Route::get('/redirect-to-system', [SSOAuthController::class, 'redirectToSystem'])
     ->middleware('auth', 'readonly.db')
     ->name('sso.redirect');

Route::get('/pending-approval', [SSOAuthController::class, 'pendingApproval'])
     ->name('sso.pending.approval');


Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return view('dashboard');
    })->name('dashboard');

    // Optimized dashboard route
    Route::get('/dashboard-optimized', function () {
        return view('dashboard-optimized');
    })->name('dashboard.optimized');

    // Admin Routes
    Route::prefix('admin')->name('admin.')->middleware('role:admin,super_admin')->group(function () {
        Route::get('/database-analysis', [DatabaseAnalysisController::class, 'analyzeUsersTable'])
            ->name('database.analysis');

        Route::get('/users', [UserManagementController::class, 'index'])
            ->name('users.index');
        Route::post('/users/check', [UserManagementController::class, 'checkUser'])
            ->name('users.check');
        Route::get('/system-info/{system}', [UserManagementController::class, 'getSystemInfo'])
            ->name('system.info');
        Route::post('/users/create', [UserManagementController::class, 'createUser'])
            ->name('users.create');
        Route::get('/users/{system}', [UserManagementController::class, 'getUsers'])
            ->where('system', 'all|balai|reguler|fg|tuk')
            ->name('users.list');

        // User Management Enhanced Routes
        Route::get('/import-users', [UserManagementController::class, 'getImportUsers'])
            ->name('users.import.list');
        Route::post('/import-users', [UserManagementController::class, 'importUsers'])
            ->name('users.import');
        Route::get('/sso-users', [UserManagementController::class, 'getSSOUsers'])
            ->name('users.sso.list');
        Route::post('/mass-update', [UserManagementController::class, 'massUpdateUsers'])
            ->name('users.mass.update');
        Route::post('/create-main-account', [UserManagementController::class, 'createMainAccount'])
            ->name('users.create.main');
        Route::post('/bulk-update-names', [UserManagementController::class, 'bulkUpdateNames'])
            ->name('users.bulk.update.names');
        Route::post('/add-main-user', [UserManagementController::class, 'addMainUser'])
            ->name('users.add.main');
        Route::post('/update-sso-user-names', [UserManagementController::class, 'updateSSOUserNames'])
            ->name('users.update.sso.names');
        Route::get('/search-users-across-systems', [UserManagementController::class, 'searchUsersAcrossSystems'])
            ->name('users.search.all');
        Route::put('/sso-users/{id}', [UserManagementController::class, 'updateSSOUser'])
            ->name('users.sso.update');
        Route::delete('/sso-users/{id}', [UserManagementController::class, 'deleteSSOUser'])
            ->name('users.sso.delete');
        Route::post('/delete-users', [UserManagementController::class, 'deleteUsers'])
            ->name('users.delete');
        Route::put('/update-user/{id}', [UserManagementController::class, 'updateUser'])
            ->name('users.update');
        Route::post('/check-sso-name-exists', [UserManagementController::class, 'checkSSONameExists'])
            ->name('users.check.name');

        // Modular Account Distribution Routes
        Route::post('/sso-users/create-modular', [UserManagementController::class, 'createModularSSOUser'])
            ->name('users.sso.create.modular');
        Route::post('/sso-users/{id}/sync-systems', [UserManagementController::class, 'syncUserSystems'])
            ->name('users.sso.sync.systems');
        Route::get('/sso-users/{id}/system-access', [UserManagementController::class, 'getUserSystemAccess'])
            ->name('users.sso.system.access');

        // User Mapping Routes
        Route::get('/user-mapping', [UserMappingController::class, 'index'])
            ->name('user.mapping');
        Route::get('/user-mapping/manual', [UserMappingController::class, 'manual'])
            ->name('user.mapping.manual');
        Route::get('/user-mapping/statistics', [UserMappingController::class, 'getStatistics'])
            ->name('user.mapping.statistics');
        Route::get('/user-mapping/search', [UserMappingController::class, 'searchUsers'])
            ->name('user.mapping.search');
        Route::get('/user-mapping/duplicates', [UserMappingController::class, 'getPotentialDuplicates'])
            ->name('user.mapping.duplicates');
        Route::get('/user-mapping/user/{id}', [UserMappingController::class, 'getUserDetails'])
            ->name('user.mapping.details');
        Route::post('/user-mapping/save-master', [UserMappingController::class, 'saveMasterUser'])
            ->name('user.mapping.save.master');
        Route::post('/user-mapping/connect-account', [UserMappingController::class, 'connectAccount'])
            ->name('user.mapping.connect');
        Route::post('/user-mapping/disconnect', [UserMappingController::class, 'disconnectAccount'])
            ->name('user.mapping.disconnect');
        Route::post('/user-mapping/select-account', [UserMappingController::class, 'selectAccount'])
            ->name('user.mapping.select.account');
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Logout routes
    Route::get('/logout', [SSOAuthController::class, 'logout'])->name('logout.get');
    Route::post('/logout', [SSOAuthController::class, 'logout'])->name('logout');
});
