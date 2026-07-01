<?php

namespace App\Http\Controllers;

use App\Models\Institution;
use Illuminate\Http\Request;

class InstitutionController extends Controller
{
    public function index()
    {
        $institutions = Institution::all();

        return response()->json([
            'success' => true,
            'data' => $institutions
        ]);
    }

    public function show(Institution $institution)
    {
        return response()->json([
            'success' => true,
            'data' => $institution
        ]);
    }
}
