<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChecklistItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'title',
        'status',
        'document_type',
        'position',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
