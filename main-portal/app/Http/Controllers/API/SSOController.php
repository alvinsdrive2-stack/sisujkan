<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\SSOService;
use Illuminate\Http\Request;

class SSOController extends Controller
{
    protected $ssoService;

    public function __construct(SSOService $ssoService)
    {
        $this->ssoService = $ssoService;
    }

    /**
     * Verify SSO token
     */
    public function verify(Request $request)
    {
        $request->validate(['token' => 'required']);

        $verification = $this->ssoService->verifySSOToken($request->token);

        if (!$verification) {
            return response()->json([
                'error' => 'Invalid or expired token'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'sso_user' => [
                    'id' => $verification['sso_user']->id,
                    'email' => $verification['sso_user']->email,
                    'name' => $verification['sso_user']->name
                ],
                'user_data' => $verification['user_data'],
                'system' => $verification['system']
            ]
        ]);
    }

    /**
     * Handle SSO logout from external systems
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

        // Clear any SSO sessions if needed
        // ...

        return response()->json([
            'success' => true,
            'message' => $message,
            'redirect_url' => route('login') . ($fromSystem ? "?from={$fromSystem}" : '')
        ]);
    }
}
