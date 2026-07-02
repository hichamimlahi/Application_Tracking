<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateApplicationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $application = $this->route('application');
        return $application && $this->user()->id === $application->user_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'institution_id' => 'sometimes|exists:institutions,id',
            'program_name' => 'sometimes|required|string|max:255',
            'program_type' => 'sometimes|required|in:cycle_ingenieur,master',
            'admission_type' => 'nullable|in:sur_titre,sur_concours',
            'status' => 'sometimes|required|in:brouillon,non_eligible,soumis,preselectionne,non_preselectionne,admis_oral,refuse_ecrit,accepte,liste_attente,refuse_final',
            'submission_method' => 'nullable|in:en_ligne,papier',
            'portal_url' => 'nullable|url|max:255',
            'deadline_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ];
    }
}
