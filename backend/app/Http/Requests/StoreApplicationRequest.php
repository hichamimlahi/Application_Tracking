<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'institution_id' => 'nullable|exists:institutions,id',
            'new_institution_name' => 'required_without:institution_id|string|max:255',
            'new_institution_acronym' => 'nullable|string|max:255',
            'new_institution_website' => 'nullable|url|max:255',
            'program_name' => 'required|string|max:255',
            'program_type' => 'required|in:cycle_ingenieur,master',
            'status' => 'nullable|in:brouillon,non_eligible,soumis,preselectionne,non_preselectionne,admis_oral,refuse_ecrit,accepte,liste_attente,refuse_final',
            'submission_method' => 'nullable|in:en_ligne,papier',
            'portal_url' => 'nullable|url|max:255',
            'deadline_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'events' => 'nullable|array',
            'events.*.type' => 'required_with:events|string',
            'events.*.title' => 'required_with:events|string|max:255',
            'events.*.event_date' => 'required_with:events|date',
            'events.*.notes' => 'nullable|string',
            'checklist_items' => 'nullable|array',
            'checklist_items.*.title' => 'required_with:checklist_items|string|max:255',
            'checklist_items.*.status' => 'nullable|in:todo,ready,sent',
            'checklist_items.*.document_type' => 'nullable|string|max:255',
            'checklist_items.*.position' => 'nullable|integer',
        ];
    }
}
