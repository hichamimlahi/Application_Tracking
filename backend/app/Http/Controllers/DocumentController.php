<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Http\Requests\StoreDocumentRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function store(StoreDocumentRequest $request)
    {
        $validated = $request->validated();
        
        if (!empty($validated['application_id'])) {
            $application = \App\Models\Application::findOrFail($validated['application_id']);
            if ($application->user_id !== $request->user()->id) {
                return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
            }
        }

        $path = $request->file('file')->store('documents', 'public');

        $document = $request->user()->documents()->create([
            'application_id' => $validated['application_id'] ?? null,
            'title' => $validated['title'],
            'document_type' => $validated['document_type'] ?? null,
            'file_path' => $path,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document uploadé avec succès',
            'data' => $document
        ], 201);
    }

    public function destroy(Request $request, Document $document)
    {
        if ($request->user()->id !== $document->user_id) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        // Delete from storage
        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document supprimé avec succès'
        ]);
    }
}
