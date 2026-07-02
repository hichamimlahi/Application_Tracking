<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use App\Models\Application;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function index(Request $request)
    {
        $applications = $request->user()->applications()
            ->with(['institution', 'events', 'checklistItems', 'documents'])
            ->orderBy('deadline_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $applications,
        ]);
    }

    public function store(StoreApplicationRequest $request)
    {
        $validated = $request->validated();

        if (empty($validated['institution_id']) && !empty($validated['new_institution_name'])) {
            $institution = \App\Models\Institution::create([
                'name' => $validated['new_institution_name'],
                'acronym' => $validated['new_institution_acronym'] ?? null,
                'type' => in_array($validated['program_type'] ?? '', ['cycle_ingenieur', 'master']) ? $validated['program_type'] : 'cycle_ingenieur',
                'website_url' => $validated['new_institution_website'] ?? null,
            ]);
            $validated['institution_id'] = $institution->id;
        }

        $application = $request->user()->applications()->create([
            'institution_id' => $validated['institution_id'],
            'program_name' => $validated['program_name'],
            'program_type' => $validated['program_type'],
            'status' => $validated['status'] ?? 'brouillon',
            'submission_method' => $validated['submission_method'] ?? null,
            'portal_url' => $validated['portal_url'] ?? null,
            'deadline_date' => $validated['deadline_date'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        if (!empty($validated['events'])) {
            $application->events()->createMany($validated['events']);
        }

        if (!empty($validated['checklist_items'])) {
            $application->checklistItems()->createMany($validated['checklist_items']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Candidature creee avec succes',
            'data' => $application->load(['institution', 'events', 'checklistItems']),
        ], 201);
    }

    public function show(Request $request, Application $application)
    {
        if ($request->user()->id !== $application->user_id) {
            return response()->json(['success' => false, 'message' => 'Non autorise'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $application->load(['institution', 'documents', 'events', 'checklistItems']),
        ]);
    }

    public function update(UpdateApplicationRequest $request, Application $application)
    {
        $application->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Candidature mise a jour avec succes',
            'data' => $application->load(['institution', 'events', 'checklistItems']),
        ]);
    }

    public function destroy(Request $request, Application $application)
    {
        if ($request->user()->id !== $application->user_id) {
            return response()->json(['success' => false, 'message' => 'Non autorise'], 403);
        }

        $application->delete();

        return response()->json([
            'success' => true,
            'message' => 'Candidature supprimee avec succes',
        ]);
    }
}
