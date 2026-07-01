<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\ChecklistItem;
use Illuminate\Http\Request;

class ChecklistItemController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'application_id' => 'required|exists:applications,id',
            'title' => 'required|string|max:255',
            'status' => 'nullable|in:todo,ready,sent',
            'document_type' => 'nullable|string|max:255',
            'position' => 'nullable|integer|min:0',
        ]);

        $application = Application::findOrFail($validated['application_id']);

        if ($request->user()->id !== $application->user_id) {
            return response()->json(['success' => false, 'message' => 'Non autorise'], 403);
        }

        $item = $application->checklistItems()->create($validated);

        return response()->json([
            'success' => true,
            'data' => $item,
        ], 201);
    }

    public function update(Request $request, ChecklistItem $checklistItem)
    {
        if ($request->user()->id !== $checklistItem->application->user_id) {
            return response()->json(['success' => false, 'message' => 'Non autorise'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:todo,ready,sent',
            'document_type' => 'nullable|string|max:255',
            'position' => 'nullable|integer|min:0',
        ]);

        $checklistItem->update($validated);

        return response()->json([
            'success' => true,
            'data' => $checklistItem,
        ]);
    }

    public function destroy(Request $request, ChecklistItem $checklistItem)
    {
        if ($request->user()->id !== $checklistItem->application->user_id) {
            return response()->json(['success' => false, 'message' => 'Non autorise'], 403);
        }

        $checklistItem->delete();

        return response()->json(['success' => true]);
    }
}
