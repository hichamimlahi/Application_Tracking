<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        $applications = $request->user()->applications()->with('institution')->orderBy('deadline_date', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $applications
        ]);
    }

    public function store(StoreApplicationRequest $request)
    {
        $application = $request->user()->applications()->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Candidature créée avec succès',
            'data' => $application->load('institution')
        ], 201);
    }

    public function show(Request $request, Application $application)
    {
        if ($request->user()->id !== $application->user_id) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $application->load(['institution', 'documents'])
        ]);
    }

    public function update(UpdateApplicationRequest $request, Application $application)
    {
        // Authorization is handled in UpdateApplicationRequest

        $application->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Candidature mise à jour avec succès',
            'data' => $application->load('institution')
        ]);
    }

    public function destroy(Request $request, Application $application)
    {
        if ($request->user()->id !== $application->user_id) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        $application->delete();

        return response()->json([
            'success' => true,
            'message' => 'Candidature supprimée avec succès'
        ]);
    }
}
