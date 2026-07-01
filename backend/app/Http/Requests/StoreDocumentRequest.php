<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
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
            'application_id' => 'nullable|exists:applications,id',
            'title' => 'required|string|max:255',
            'document_type' => 'nullable|string|max:255',
            'file' => 'required|file|mimes:pdf,jpeg,png,jpg|max:5120', // Max 5MB
        ];
    }
}
