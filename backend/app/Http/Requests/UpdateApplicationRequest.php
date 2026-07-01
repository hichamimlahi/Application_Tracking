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
            'program_name' => 'sometimes|string|max:255',
            'program_type' => 'sometimes|in:cycle_ingenieur,master',
            'status' => 'sometimes|in:brouillon,soumis,concours,attente,accepte,refuse',
            'deadline_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ];
    }
}
