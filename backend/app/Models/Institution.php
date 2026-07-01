<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Institution extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'acronym',
        'type',
        'website_url',
        'location',
        'logo',
    ];

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }
}
