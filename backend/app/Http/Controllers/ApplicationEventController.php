<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\ApplicationEvent;
use Illuminate\Http\Request;

class ApplicationEventController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'application_id' => 'required|exists:applications,id',
            'type' => 'required|in:deadline,exam,result,oral,written,interview,registration,other',
            'title' => 'required|string|max:255',
            'event_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $application = Application::findOrFail($validated['application_id']);

        if ($request->user()->id !== $application->user_id) {
            return response()->json(['success' => false, 'message' => 'Non autorise'], 403);
        }

        $event = $application->events()->create($validated);

        return response()->json([
            'success' => true,
            'data' => $event,
        ], 201);
    }

    public function update(Request $request, ApplicationEvent $applicationEvent)
    {
        if ($request->user()->id !== $applicationEvent->application->user_id) {
            return response()->json(['success' => false, 'message' => 'Non autorise'], 403);
        }

        $validated = $request->validate([
            'type' => 'sometimes|in:deadline,exam,result,oral,written,interview,registration,other',
            'title' => 'sometimes|string|max:255',
            'event_date' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        $applicationEvent->update($validated);

        return response()->json([
            'success' => true,
            'data' => $applicationEvent,
        ]);
    }

    public function destroy(Request $request, ApplicationEvent $applicationEvent)
    {
        if ($request->user()->id !== $applicationEvent->application->user_id) {
            return response()->json(['success' => false, 'message' => 'Non autorise'], 403);
        }

        $applicationEvent->delete();

        return response()->json(['success' => true]);
    }
}
