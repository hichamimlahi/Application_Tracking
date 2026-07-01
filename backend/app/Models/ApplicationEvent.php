<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'type',
        'title',
        'event_date',
        'notes',
    ];

    protected $casts = [
        'event_date' => 'date',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}
