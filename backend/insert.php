<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$schools = [
    'EHTP', 'EMI', 'ENSEM', 'ENSIAS', 'INPT', 'INSEA',
    'FST Al Hoceima', 'FST Béni Mellal', 'FST Errachidia', 'FST Fès', 'FST Marrakech', 'FST Mohammedia', 'FST Settat', 'FST Tanger',
    'ENSA Agadir', 'ENSA Berrechid', 'ENSA El Jadida', 'ENSA Fès', 'ENSA Kénitra', 'ENSA Oujda', 'ENSA Safi', 'ENSA Tanger',
    'ENSAM Casa', 'ENSAM Meknès', 'ENSAM Rabat'
];

foreach($schools as $school) {
    App\Models\Institution::firstOrCreate(
        ['name' => $school],
        ['type' => 'cycle_ingenieur', 'location' => 'Maroc', 'website_url' => '']
    );
}

echo "Schools inserted successfully.\n";
