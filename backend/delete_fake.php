<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Delete all documents to prevent orphaned files or db records
App\Models\Document::query()->delete();

// Delete all applications (the fake ones)
App\Models\Application::query()->delete();

// Optionnel : si je dois aussi supprimer les 3 écoles par défaut que j'avais créées avant le scraping.
// Je ne vais pas les supprimer car elles font peut-être partie des écoles scrapées, mais s'il y a des doublons on peut nettoyer.
// Les écoles par défaut s'appelaient : "Ecole Mohammadia d'Ingénieurs (EMI)", "Ecole Nationale Supérieure d'Informatique et d'Analyse des Systèmes (ENSIAS)", "Faculté des Sciences et Techniques (FST) - Mohammedia"
$default_institutions = [
    "Ecole Mohammadia d'Ingénieurs (EMI)",
    "Ecole Nationale Supérieure d'Informatique et d'Analyse des Systèmes (ENSIAS)",
    "Faculté des Sciences et Techniques (FST) - Mohammedia"
];

App\Models\Institution::whereIn('name', $default_institutions)->delete();

echo "Default applications, documents, and old institutions deleted.\n";
