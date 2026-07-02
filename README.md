# Application Tracking (Candidatures CNC / Masters)

## 🎯 Objectif du projet
Cette application permet aux étudiants de suivre et de gérer efficacement leurs candidatures pour le Cycle d'Ingénieur ou les Masters.
L'application propose un suivi visuel (Kanban), un calendrier dynamique et une gestion détaillée (épreuves, pièces jointes, notes) pour s'assurer qu'aucune candidature n'est oubliée ou incomplète.

## ✨ Fonctionnalités Principales
- **Tableau Kanban Interactif** : Suivez vos candidatures par étapes (Brouillon, Dépôt, Concours, Résultats) avec un simple glisser-déposer (Drag & Drop).
- **Calendrier Dynamique & Filtres Avancés** : Visualisez toutes les dates importantes avec un panneau latéral de filtres multi-critères (par école avec barre de recherche interne, type de formation, admissions, etc.).
- **Import Intelligent par JSON** : Copiez-collez un texte d'annonce généré par IA, l'application extrait automatiquement les écoles, dates, épreuves et documents requis.
- **Mode Sombre (Dark Mode) Intégral** : Interface moderne, premium et confortable adaptée au mode sombre sur l'ensemble de l'application (tableaux, formulaires, modales, etc.).
- **Gestion des Pièces Jointes** : Espace dédié au Drag & Drop pour ajouter vos reçus de préinscription et documents PDF/Images directement sur chaque candidature.

## ⚙️ Installation Docker

L'application est conçue pour être lancée facilement avec Docker :

1. Clonez ce dépôt.
2. Assurez-vous d'avoir Docker et Docker Compose installés sur votre machine.
3. À la racine du projet, lancez :
   ```bash
   docker-compose up -d --build
   ```
4. Les migrations de la base de données peuvent être lancées avec :
   ```bash
   docker exec tracking_app php artisan migrate:fresh --seed
   ```
5. Accédez au frontend sur `http://localhost:5173` (ou port configuré) et l'API sur `http://localhost:8000`.

## 🧪 Compte Test

Après avoir exécuté les seeders (avec la commande ci-dessus), vous pouvez vous connecter avec le compte de test suivant :
- **Email** : test@test.com
- **Mot de passe** : password

## 🤖 Prompt JSON pour ChatGPT / Claude / Gemini

Pour importer très rapidement une annonce, copiez ce prompt dans une IA avec le texte du concours. Le JSON généré pourra être copié directement dans le bouton **"Importer JSON"** de l'application !

> **Prompt :**
> Transforme ce texte d'annonce de concours pour une école d'ingénieur/master en un fichier JSON strict. Ne réponds rien d'autre que le JSON.
> 
> **Instructions pour les DATES et les ÉPREUVES :**
> - Pour CHAQUE date trouvée (limite, preselection, concours, oral, entretien, inscription, etc.), crée une clé `date_NOM` avec la valeur `AAAA-MM-JJ` (ex: `"date_concours": "2026-07-15"`).
> - Si l'épreuve a des matières, horaires ou détails, crée une clé `details_NOM` juste en dessous (ex: `"details_concours": "Maths 8h-12h"`).
> 
> **Exemple de structure attendue :**
> ```json
> {
>   "institution": {
>     "sigle": "SIGLE",
>     "nom": "Nom complet de l'école",
>     "site_web": "Lien optionnel"
>   },
>   "formation": {
>     "nom": "Nom de la filière",
>     "type": "cycle_ingenieur ou master"
>   },
>   "concours": {
>     "titre": "Titre de l'annonce",
>     "type_admission": "sur_titre ou sur_concours",
>     "date_limite": "2026-07-10",
>     "date_concours": "2026-07-15",
>     "details_concours": "Écrit pour toutes les filières",
>     "date_entretien": "2026-07-21",
>     "details_entretien": "Uniquement pour Génie Civil",
>     "date_inscription_principale": "2026-07-22",
>     "mode_candidature": "En ligne puis dépôt papier le jour de l'écrit",
>     "lien_candidature": "URL d'inscription"
>   },
>   "documents": [
>     "CIN",
>     "Relevés de notes",
>     "CV"
>   ],
>   "notes": "Toute information complémentaire."
> }
> ```
> Voici l'annonce : [Collez l'annonce ici]

L'application lira dynamiquement n'importe quelle clé commençant par `date_` et `details_` pour générer le calendrier de manière intelligente !