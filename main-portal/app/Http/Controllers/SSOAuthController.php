<?php

namespace App\Http\Controllers;

use App\Models\SSOUser;
use App\Models\SSOUserSystem;
use App\Services\SSOService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class SSOAuthController extends Controller
{
    protected $ssoService;

    public function __construct(SSOService $ssoService)
    {
        $this->ssoService = $ssoService;
    }

    /**
     * Show login form
     */
    public function showLoginForm()
    {
        // Jika user sudah login dan mendapatkan logout notification
        if (Auth::check() && request()->has('logout_from')) {
            // Get system name from request
            $systemName = request()->get('system_name', 'Sistem');

            // Show loading redirect page
            return view('auth.logout-loading', [
                'systemName' => $systemName,
                'redirectUrl' => route('dashboard')
            ]);
        }

        // Normal login flow
        $systems = $this->ssoService->getAvailableSystems();
        return view('auth.login', compact('systems'));
    }

    /**
     * Handle login request
     */
    public function login(Request $request)
    {
        // Log the incoming request
        \Log::info('SSO Login attempt', [
            'email' => $request->email,
            'has_password' => !empty($request->password)
        ]);

        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)
                        ->withInput($request->except('password'));
        }

        // Find existing SSO user
        $ssoUser = SSOUser::where('email', $request->email)->first();

        // If user doesn't exist, return error
        if (!$ssoUser) {
            return back()->withErrors([
                'email' => 'Email tidak terdaftar dalam sistem. Silakan hubungi administrator.'
            ])->withInput($request->except('password'));
        }

        // Verify password
        if (!Hash::check($request->password, $ssoUser->password)) {
            return back()->withErrors([
                'email' => 'Email atau password salah'
            ])->withInput($request->except('password'));
        }

        // Log the user in
        Auth::login($ssoUser);

        // Store password in session for dashboard access
        session(['sso_password' => $request->password]);

        // Auto-approve access to all systems for existing users
        $systems = ['balai', 'reguler', 'suisei', 'tuk'];
        foreach ($systems as $systemName) {
            SSOUserSystem::updateOrCreate(
                ['sso_user_id' => $ssoUser->id, 'system_name' => $systemName],
                [
                    'is_approved' => true,
                    'approval_method' => 'auto',
                    'approved_at' => now()
                ]
            );
        }

        \Log::info('User logged in successfully, redirecting to dashboard', [
            'email' => $ssoUser->email,
            'approved_systems' => $systems
        ]);

        // Redirect to dashboard to choose system
        return redirect()->route('dashboard');
    }

    /**
     * Redirect to target system from dashboard
     */
    public function redirectToSystem(Request $request)
    {
        Log::info('redirectToSystem called', [
            'system' => $request->get('system'),
            'has_session_sso_password' => session()->has('sso_password'),
            'is_authenticated' => Auth::check(),
            'session_id' => session()->getId()
        ]);

        $targetSystem = $request->get('system');

        // Return JSON for AJAX requests
        if ($request->expectsJson() || $request->get('ajax')) {
            try {
                $user = Auth::user();
                $accessResult = $this->ssoService->checkAndApproveUserAccess(
                    $user->id,
                    $targetSystem,
                    $user->email
                );

                if ($accessResult['status'] === 'multiple_matches') {
                    return response()->json($accessResult);
                } else if ($accessResult['status'] === 'approved') {
                    // Generate token and return redirect URL
                    $token = $this->ssoService->generateSSOToken(
                        $user->id,
                        $targetSystem
                    );

                    $systems = $this->ssoService->getAvailableSystems();
                    $targetUrl = $systems[$targetSystem]['url'];
                    $redirectUrl = "{$targetUrl}/sso/callback?token={$token}";

                    return response()->json([
                        'status' => 'approved',
                        'redirect_url' => $redirectUrl
                    ]);
                } else {
                    return response()->json([
                        'status' => 'error',
                        'message' => $accessResult['message'] ?? 'Access denied'
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('AJAX redirect error: ' . $e->getMessage());
                return response()->json([
                    'status' => 'error',
                    'message' => 'Terjadi kesalahan: ' . $e->getMessage()
                ]);
            }
        }

        // Quick debug response
        if ($request->get('debug')) {
            return response()->json([
                'authenticated' => Auth::check(),
                'user' => Auth::check() ? Auth::user()->toArray() : null,
                'system' => $targetSystem,
                'systems_available' => array_keys($this->ssoService->getAvailableSystems())
            ]);
        }

        if (!Auth::check()) {
            Log::error('User not authenticated in redirectToSystem');
            return redirect()->route('login')->with('error', 'Please login first.');
        }

        $user = Auth::user();
        Log::info('User authenticated', ['email' => $user->email, 'id' => $user->id]);

        // Get stored password from session
        $password = session('sso_password');

        if (!$password) {
            Log::error('SSO password not found in session');
            return redirect()->route('dashboard')
                ->with('error', 'Session expired. Please login again.');
        }

        // Check access to target system
        $accessResult = $this->ssoService->checkAndApproveUserAccess(
            $user->id,
            $targetSystem,
            $user->email
        );

        try {
            Log::info('Access result received', ['status' => $accessResult['status']]);

            // Get target system URL once for all cases
            $systems = $this->ssoService->getAvailableSystems();

            if (!isset($systems[$targetSystem])) {
                Log::error('System not found!', ['requested' => $targetSystem]);
                return redirect()->route('dashboard')
                    ->with('error', 'Invalid system selected');
            }

            if ($accessResult['status'] === 'approved') {
                Log::info('Access approved, generating token...');

                // Generate SSO token
                $token = $this->ssoService->generateSSOToken(
                    $user->id,
                    $targetSystem
                );

                Log::info('Available systems', ['systems' => array_keys($systems)]);
                Log::info('Target system requested', ['system' => $targetSystem]);

                $targetUrl = $systems[$targetSystem]['url'];
                Log::info('Target URL resolved', ['url' => $targetUrl]);

                // Full redirect URL
                $redirectUrl = "{$targetUrl}/sso/callback?token={$token}";
                Log::info('About to redirect to', ['url' => $redirectUrl]);

                // Show loading bridge page first
                return view('auth.loading-bridge', [
                    'systemName' => $systems[$targetSystem]['name'],
                    'redirectUrl' => $redirectUrl
                ]);
            } else if ($accessResult['status'] === 'multiple_matches') {
                // Show account selection modal
                return view('auth.account-selection', [
                    'system' => $systems[$targetSystem],
                    'matches' => $accessResult['matches'],
                    'system_name' => $targetSystem,
                    'sso_name' => $accessResult['sso_name'],
                    'sso_user_id' => $user->id,
                    'message' => $accessResult['message']
                ]);
            } else {
                // Debug logging
                Log::warning('Access not approved', [
                    'status' => $accessResult['status'],
                    'message' => $accessResult['message']
                ]);

                // Show pending approval page
                return redirect()->route('sso.pending.approval', [
                    'system' => $targetSystem,
                    'email' => $user->email,
                    'searched_name' => $user->name
                ])->with('warning', $accessResult['message']);
            }
        } catch (\Exception $e) {
            Log::error('Exception in redirectToSystem', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->route('dashboard')
                ->with('error', 'An error occurred: ' . $e->getMessage());
        }
    }

    /**
     * Show pending approval page
     */
    public function pendingApproval(Request $request)
    {
        $systemName = $request->get('system');
        $email = $request->get('email');
        $searchedName = $request->get('searched_name');
        $systems = $this->ssoService->getAvailableSystems();

        return view('auth.pending-approval', [
            'system' => $systems[$systemName] ?? null,
            'email' => $email,
            'searched_name' => $searchedName
        ]);
    }

    /**
     * Handle logout
     */
    public function logout(Request $request)
    {
        $fromSystem = $request->get('from');
        $message = 'Logged out successfully';

        if ($fromSystem) {
            $systemNames = [
                'balai' => 'Sistem Balai',
                'reguler' => 'Sistem Reguler',
                'suisei' => 'Sistem Suisei',
                'tuk' => 'Sistem Verifikasi TUK'
            ];

            if (isset($systemNames[$fromSystem])) {
                $message = "Anda telah logout dari {$systemNames[$fromSystem]}";
            }
        }

        Auth::logout();
        session()->invalidate();
        session()->regenerateToken();

        return redirect()->route('login')
            ->with('success', $message);
    }
}
