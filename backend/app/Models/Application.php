<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'institution_id',
        'program_name',
        'program_type',
        'admission_type',
        'status',
        'submission_method',
        'portal_url',
        'deadline_date',
        'notes',
    ];

    protected $casts = [
        'deadline_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(ApplicationEvent::class)->orderBy('event_date');
    }

    public function checklistItems(): HasMany
    {
        return $this->hasMany(ChecklistItem::class)->orderBy('position')->orderBy('id');
    }
}
