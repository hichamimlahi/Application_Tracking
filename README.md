# Application Tracking (Candidatures CNC / Masters)

## 🎯 Objectif du projet
Cette application permet aux étudiants de suivre et de gérer efficacement leurs candidatures pour le Cycle d'Ingénieur ou les Masters.
Au lieu de simples notes, l'application structure les candidatures avec des événements précis (dates limites, concours, résultats), une checklist de documents à fournir et un suivi global des statuts. 
L'objectif est d'avoir un outil clair, qui rappelle les échéances et garantit qu'aucune candidature n'est oubliée ou incomplète.

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
   docker-compose exec backend php artisan migrate --seed
   ```
5. Accédez au frontend sur `http://localhost:5173` (ou port configuré) et l'API sur `http://localhost:8000`.

## 🧪 Compte Test

Après avoir exécuté les seeders (avec la commande ci-dessus), vous pouvez vous connecter avec le compte de test suivant :
- **Email** : test@test.com
- **Mot de passe** : password

## 📁 Structure Backend / Frontend

- **`/backend`** : Application Laravel. Fournit une API REST sécurisée par Sanctum. Contient les modèles (`Application`, `Institution`, `ApplicationEvent`, `ChecklistItem`, `Document`).
- **`/frontend`** : Application React + Vite + TailwindCSS. Communique avec l'API. Contient le tableau de bord, le calendrier et le suivi des candidatures.

## 🤖 Prompt JSON pour ChatGPT

Vous pouvez utiliser ChatGPT pour convertir n'importe quelle annonce de concours ou master en un JSON structuré, prêt à être importé dans l'application.
Copiez ce prompt dans ChatGPT avec le texte de l'annonce :

> Je vais te donner une annonce de concours ou d'admission en master.
> Extrais les informations et retourne-les **strictement** au format JSON suivant. Ne réponds rien d'autre que le JSON.
> 
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
>     "date_limite": "YYYY-MM-DD",
>     "date_preselection": "YYYY-MM-DD",
>     "date_concours": "YYYY-MM-DD",
>     "date_resultats": "YYYY-MM-DD",
>     "mode_candidature": "en_ligne ou papier",
>     "lien_candidature": "URL d'inscription"
>   },
>   "documents": [
>     "CIN",
>     "Relevés de notes",
>     "CV"
>   ],
>   "notes": "Remarques complémentaires."
> }
> ```
> Voici l'annonce : [Collez l'annonce ici]

## 📥 Workflow d'import d'annonce

1. Cliquez sur **Importer JSON** depuis le tableau de bord.
2. Collez le JSON généré par ChatGPT.
3. L'application lira le JSON et affichera un **Aperçu**.
4. Si l'institution n'existe pas, elle sera créée automatiquement.
5. Les dates limites, concours et résultats seront convertis en **Événements**.
6. Les documents seront ajoutés sous forme de **Checklist** (à faire).
7. Cliquez sur "Créer la candidature" pour valider l'import. Vous pourrez ensuite ajuster les détails depuis la vue détaillée de la candidature.