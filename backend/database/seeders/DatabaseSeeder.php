<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Institution;
use App\Models\Application;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create a test user
        $user = User::factory()->create([
            'name' => 'Étudiant Test',
            'email' => 'etudiant@maroc.ma',
            'password' => 'password123',
        ]);

        // 2. Load Institutions from JSON
        $json = file_get_contents(database_path('data/ecoles.json'));
        $data = json_decode($json, true);

        foreach ($data['ecoles'] as $ecole) {
            Institution::create([
                'name' => $ecole['nom_complet'],
                'acronym' => $ecole['sigle'],
                'type' => 'cycle_ingenieur', // Using default cycle_ingenieur based on the JSON
                'website_url' => $ecole['site_web'],
                'location' => $ecole['ville'],
                'logo' => $ecole['logo'] ?? null,
            ]);
        }
    }
}
