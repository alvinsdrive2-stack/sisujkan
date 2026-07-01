<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DatabaseAnalysisController extends Controller
{
    public function analyzeUsersTable()
    {
        $databases = [
            'balai' => 'mysql_balai',
            'reguler' => 'mysql_reguler',
            'fg' => 'mysql_fg',
            'tuk' => 'mysql_tuk'
        ];

        $results = [];

        foreach ($databases as $key => $connection) {
            try {
                // Get table structure
                $structure = DB::connection($connection)
                    ->select("DESCRIBE users");

                // Get sample data
                $sampleData = DB::connection($connection)
                    ->table('users')
                    ->limit(3)
                    ->get();

                // Get unique roles
                $roles = DB::connection($connection)
                    ->table('users')
                    ->select('role')
                    ->distinct()
                    ->pluck('role')
                    ->filter()
                    ->toArray();

                // Get total records
                $totalUsers = DB::connection($connection)
                    ->table('users')
                    ->count();

                $results[$key] = [
                    'connection' => $connection,
                    'structure' => $structure,
                    'sample_data' => $sampleData,
                    'roles' => $roles,
                    'total_users' => $totalUsers,
                    'status' => 'success'
                ];

            } catch (\Exception $e) {
                $results[$key] = [
                    'connection' => $connection,
                    'error' => $e->getMessage(),
                    'status' => 'error'
                ];
                Log::error("Failed to analyze {$key} database: " . $e->getMessage());
            }
        }

        return view('admin.database-analysis', compact('results'));
    }
}