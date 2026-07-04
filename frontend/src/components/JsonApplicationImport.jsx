import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';

const CHATGPT_PROMPT = `Tu es un assistant expert en extraction de données structurées. Ton objectif est de lire des documents ou des textes d'avis de concours (universités, écoles d'ingénieurs, masters, etc.) et d'en extraire les informations clés pour générer un objet JSON strict et bien formaté.

Règles d'extraction et de formatage obligatoires :

1. Type d'admission (type_admission) : Dans l'objet concours, tu dois ajouter un champ "type_admission". Sa valeur par défaut est "sur_concours". Toutefois, si le texte analysé mentionne explicitement "sur titre" ou "au titre", la valeur de ce champ doit obligatoirement être "sur_titre".

2. Nom de la formation (formation.nom) : Si la candidature est qualifiée de "sur titre", tu dois impérativement ajouter la mention "(Accès sur titre)" à la fin de la valeur du champ formation.nom.

3. Acronymes et Villes (IMPORTANT) : Pour les établissements de type FST, ENSA, ENSAM et FS (Facultés des Sciences), tu dois TOUJOURS inclure la ville dans le sigle et le nom pour éviter les confusions (Exemples : sigle: "FST Mohammedia", nom: "Faculté des Sciences et Techniques Mohammedia"). Pour les autres établissements uniques (ex: EMI, INPT), utilise le sigle normal.

4. Valeurs manquantes : Si une information n'est pas mentionnée, utilise null pour les strings ou [] pour les listes. Ne jamais inventer d'informations.

5. Format des dates : Extrais les dates au format standard "YYYY-MM-DD" dans les champs date_*. Les précisions supplémentaires vont dans details_*.

Structure JSON attendue (renvoie UNIQUEMENT le JSON) :
{
  "institution": {
    "sigle": "Acronyme (avec la ville pour FST/ENSA/ENSAM/FS)",
    "nom": "Nom complet",
    "ville": "Ville",
    "site_web": "URL"
  },
  "formation": {
    "nom": "Nom de la formation (avec ' (Accès sur titre)' si applicable)",
    "type": "cycle_ingenieur, master, licence",
    "niveau": "Niveau d'accès",
    "specialite": "Filières proposées",
    "places": "Nombre de places"
  },
  "concours": {
    "titre": "Titre exact de l'avis",
    "annee": "Année (ex: 2026-2027)",
    "type_admission": "sur_titre ou sur_concours",
    "date_ouverture": "YYYY-MM-DD",
    "details_ouverture": "Précisions",
    "date_limite": "YYYY-MM-DD",
    "details_limite": "Précisions",
    "date_preselection": "YYYY-MM-DD",
    "details_preselection": "Détails",
    "date_concours": "YYYY-MM-DD",
    "details_concours": "Détails",
    "date_resultats_ecrit": "YYYY-MM-DD",
    "details_resultats_ecrit": "Détails",
    "date_oral": "YYYY-MM-DD",
    "details_oral": "Détails",
    "date_entretien": "YYYY-MM-DD",
    "details_entretien": "Détails",
    "date_resultats": "YYYY-MM-DD",
    "details_resultats": "Détails",
    "date_inscription_principale": "YYYY-MM-DD",
    "details_inscription_principale": "Détails",
    "date_inscription_attente": "YYYY-MM-DD",
    "details_inscription_attente": "Détails",
    "mode_candidature": "Mode de candidature",
    "lien_candidature": "URL de préinscription",
    "procedure": "Résumé court des étapes"
  },
  "conditions": ["Condition 1", "Condition 2"],
  "documents": ["Document 1", "Document 2"],
  "epreuves": ["Epreuve 1", "Epreuve 2"],
  "frais": "Frais si mentionnés, sinon null",
  "contact": {
    "email": "Email",
    "telephone": "Téléphone",
    "adresse": "Adresse"
  },
  "notes": "Toute autre information importante"
}
`;

const SAMPLE_JSON = `{
  "institution": {
    "sigle": "ENSIAS",
    "nom": "Ecole Nationale Superieure d'Informatique et d'Analyse des Systemes",
    "ville": "Rabat",
    "site_web": "https://www.ensias.ma"
  },
  "formation": {
    "nom": "Genie logiciel",
    "type": "cycle_ingenieur",
    "niveau": "1ere annee cycle ingenieur"
  },
  "concours": {
    "titre": "Concours d'acces au cycle ingenieur",
    "annee": "2026-2027",
    "date_limite": "2026-07-15",
    "date_concours": "2026-07-25",
    "mode_candidature": "en_ligne",
    "lien_candidature": "https://..."
  },
  "conditions": [
    "Etre titulaire d'un DEUG, DEUST, DUT, BTS ou equivalent",
    "Avoir valide les modules requis"
  ],
  "documents": [
    "Copie CIN",
    "Releves de notes",
    "Diplome ou attestation de reussite"
  ],
  "frais": "100 DH",
  "contact": {
    "email": "contact@ecole.ma",
    "telephone": "+212..."
  },
  "notes": "Verifier les dates sur le site officiel."
}`;

const JsonApplicationImport = ({ onClose, onSuccess }) => {
    const [institutions, setInstitutions] = useState([]);
    const [jsonText, setJsonText] = useState(SAMPLE_JSON);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [previews, setPreviews] = useState([]);
    const [copiedPrompt, setCopiedPrompt] = useState(false);

    const [applications, setApplications] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [instRes, appRes] = await Promise.all([
                    axios.get('/api/institutions'),
                    axios.get('/api/applications')
                ]);
                setInstitutions(instRes.data.data || []);
                setApplications(appRes.data.data || []);
            } catch (err) {
                setError("Impossible de charger les données requises.");
            }
        };

        fetchData();
    }, []);

    const normalize = (value) => String(value || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const valueFrom = (...values) => {
        return values.find((value) => value !== undefined && value !== null && value !== '') || '';
    };

    const findInstitutionId = (payload) => {
        if (payload.institution_id) {
            return payload.institution_id;
        }

        const institutionPayload = payload.institution || payload.ecole || payload.school || {};
        const institutionKey = normalize(
            payload.institution_acronym ||
            payload.acronym ||
            payload.sigle ||
            payload.institution_name ||
            payload.institution ||
            payload.ecole ||
            payload.school ||
            institutionPayload.sigle ||
            institutionPayload.acronym ||
            institutionPayload.nom ||
            institutionPayload.name ||
            institutionPayload.nom_complet
        );

        if (!institutionKey) {
            return null;
        }

        const institution = institutions.find((item) => {
            return normalize(item.acronym) === institutionKey ||
                normalize(item.name) === institutionKey ||
                normalize(`${item.acronym} - ${item.name}`) === institutionKey;
        });

        return institution?.id || null;
    };

    const formatValue = (value) => {
        if (Array.isArray(value)) {
            return value.length ? value.map((item) => `- ${formatValue(item)}`).join('\n') : '';
        }

        if (value && typeof value === 'object') {
            return Object.entries(value)
                .filter(([, itemValue]) => itemValue !== undefined && itemValue !== null && itemValue !== '')
                .map(([key, itemValue]) => `${key}: ${formatValue(itemValue)}`)
                .join('\n');
        }

        return String(value ?? '');
    };

    const cleanUrl = (urlStr) => {
        if (!urlStr) return null;
        let clean = String(urlStr);
        const mdMatch = clean.match(/\[.*?\]\((.*?)\)/);
        if (mdMatch) {
            clean = mdMatch[1];
        }
        
        // Extract the first word that looks like a domain/url
        const words = clean.split(/[\s,;]+/);
        let firstUrl = words.find(w => w.includes('.'));
        if (!firstUrl) return null;
        
        if (!/^https?:\/\//i.test(firstUrl)) {
            firstUrl = 'https://' + firstUrl;
        }
        
        try {
            new URL(firstUrl);
            return firstUrl;
        } catch {
            return null;
        }
    };

    const mapSubmissionMethod = (methodStr) => {
        if (!methodStr) return null;
        const normalized = String(methodStr).toLowerCase().replace(/[^a-z]/g, '');
        if (normalized.includes('enligne') || normalized.includes('internet') || normalized.includes('web')) {
            return 'en_ligne';
        }
        if (normalized.includes('papier') || normalized.includes('courrier') || normalized.includes('poste') || normalized.includes('postal')) {
            return 'papier';
        }
        return null;
    };

    const buildNotes = (payload) => {
        const sections = [];
        const concours = payload.concours || {};
        const formation = payload.formation || payload.programme_detail || {};

        const addSection = (title, value) => {
            const formatted = formatValue(value);
            if (formatted.trim()) {
                sections.push(`${title}\n${formatted}`);
            }
        };

        addSection('Annonce', {
            titre: valueFrom(payload.title, payload.titre, concours.titre),
            annee: valueFrom(payload.year, payload.annee, concours.annee),
            niveau: valueFrom(payload.niveau, formation.niveau),
            places: valueFrom(payload.places, concours.places, formation.places),
            frais: valueFrom(payload.frais, payload.fees, concours.frais),
        });

        addSection('Dates', {
            date_limite: valueFrom(payload.deadline_date, payload.date_limite, concours.date_limite),
            date_concours: valueFrom(payload.date_concours, concours.date_concours),
            date_resultats: valueFrom(payload.date_resultats, concours.date_resultats),
            calendrier: valueFrom(payload.calendrier, concours.calendrier),
        });

        addSection('Candidature', {
            mode: valueFrom(payload.submission_method, payload.mode_candidature, concours.mode_candidature),
            lien: valueFrom(payload.portal_url, payload.lien_candidature, concours.lien_candidature),
            procedure: valueFrom(payload.procedure, concours.procedure),
        });

        addSection('Conditions', valueFrom(payload.conditions, payload.conditions_admission, concours.conditions));
        addSection('Documents', valueFrom(payload.documents, payload.documents_requis, concours.documents));
        addSection('Epreuves', valueFrom(payload.epreuves, payload.examens, concours.epreuves));
        addSection('Contact', valueFrom(payload.contact, concours.contact));
        addSection('Notes', valueFrom(payload.notes, payload.remarques, concours.notes));

        sections.push(`JSON original\n${JSON.stringify(payload, null, 2)}`);

        return sections.join('\n\n');
    };

    const buildApplicationPayload = (payload) => {
        const formationPayload = payload.formation || payload.programme_detail || {};
        const institutionId = findInstitutionId(payload);
        const institutionPayload = payload.institution || payload.ecole || payload.school || {};

        const programName = valueFrom(
            payload.program_name,
            payload.programme,
            payload.filiere,
            formationPayload.nom,
            formationPayload.name,
            formationPayload.filiere
        );

        if (!programName) {
            throw new Error("Le JSON doit contenir program_name, programme ou filiere.");
        }

        const deadlineDate = valueFrom(
            payload.deadline_date,
            payload.date_limite,
            payload.concours?.date_limite,
            payload.concours?.deadline_date
        ) || null;

        const events = [];
        
        // Dynamic extraction of any YYYY-MM-DD date in the JSON
        const extractDates = (obj, prefix = '') => {
            if (!obj || typeof obj !== 'object') return;
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
                    const lkey = key.toLowerCase();
                    let type = 'other';
                    let title = key.replace(/date_/i, '').replace(/_/g, ' ');
                    title = title.charAt(0).toUpperCase() + title.slice(1);
                    
                    if (lkey.includes('limite') || lkey.includes('deadline')) {
                        type = 'deadline';
                        title = 'Date limite';
                    } else if (lkey.includes('preselection') || lkey.includes('admissibilite')) {
                        type = 'preselection';
                        title = 'Présélection';
                    } else if (lkey.includes('concours') || lkey.includes('ecrit') || lkey.includes('exam')) {
                        type = 'exam';
                        if (!lkey.includes('ecrit')) title = 'Concours';
                    } else if (lkey.includes('resultat') || lkey.includes('admis')) {
                        type = 'result';
                        title = 'Résultats';
                    } else if (lkey.includes('oral') || lkey.includes('entretien')) {
                        type = 'oral';
                        title = 'Entretien / Oral';
                    } else if (lkey.includes('inscription') || lkey.includes('registration')) {
                        type = 'registration';
                    }
                    
                    // Extract specific details if available
                    let notes = '';
                    const baseKey = key.replace(/date_/i, '');
                    notes = obj[`details_${baseKey}`] || obj[`notes_${baseKey}`] || '';
                    if (!notes && type === 'exam') {
                        notes = formatValue(obj.epreuves || obj.epreuve || '');
                    }
                    if (!notes && type === 'oral') {
                        notes = formatValue(obj.details_oral || obj.details_entretien || obj.epreuves_oral || '');
                    }
                    if (!notes && typeof obj[baseKey] === 'string' && obj[baseKey] !== value) {
                        notes = obj[baseKey];
                    }
                    
                    // Prevent duplicates
                    if (!events.some(e => e.event_date === value.trim() && e.type === type)) {
                        events.push({ type, title: title || 'Date importante', event_date: value.trim(), notes: String(notes).trim() });
                    }
                } else if (typeof value === 'object') {
                    extractDates(value, key);
                }
            }
        };

        extractDates(payload);

        // Ensure deadline_date is set correctly if it was mapped via other keys
        if (!events.some(e => e.type === 'deadline') && deadlineDate) {
            events.push({ type: 'deadline', title: 'Date limite', event_date: deadlineDate });
        }

        const documents = payload.documents || payload.documents_requis || payload.concours?.documents || [];
        const checklist_items = Array.isArray(documents) 
            ? documents.map((doc, index) => ({ title: doc, status: 'todo', position: index }))
            : [];

        const instNameToMatch = institutionPayload.nom || institutionPayload.name || institutionPayload.sigle;
        const isDuplicate = applications.some(app => {
            const sameInst = institutionId 
                ? app.institution_id === institutionId 
                : (normalize(app.institution?.name) === normalize(instNameToMatch) || 
                   normalize(app.institution?.acronym) === normalize(institutionPayload.sigle || institutionPayload.acronym));
            
            return sameInst && normalize(app.program_name) === normalize(programName);
        });

        return {
            isDuplicate,
            institution_id: institutionId,
            new_institution_name: !institutionId ? (institutionPayload.nom || institutionPayload.name || institutionPayload.sigle || 'Nouvelle Institution') : null,
            new_institution_acronym: !institutionId ? (institutionPayload.sigle?.trim() || institutionPayload.acronym?.trim() || null) : null,
            new_institution_website: !institutionId ? cleanUrl(institutionPayload.site_web || institutionPayload.website) : null,
            program_name: programName,
            program_type: valueFrom(payload.program_type, payload.type, formationPayload.type) || 'cycle_ingenieur',
            admission_type: valueFrom(payload.admission_type, payload.type_admission, payload.concours?.type_admission, payload.concours?.admission_type) || '',
            status: 'brouillon',
            submission_method: mapSubmissionMethod(valueFrom(payload.submission_method, payload.mode_candidature, payload.concours?.mode_candidature)) || 'en_ligne',
            portal_url: cleanUrl(valueFrom(payload.portal_url, payload.lien_candidature, payload.concours?.lien_candidature)),
            deadline_date: deadlineDate,
            notes: buildNotes(payload),
            events,
            checklist_items,
        };
    };

    useEffect(() => {
        try {
            let parsed = JSON.parse(jsonText);
            if (!Array.isArray(parsed)) {
                parsed = [parsed];
            }
            const payloads = [];
            for (const p of parsed) {
                const payload = buildApplicationPayload(p);
                if (!payload.isDuplicate) {
                    const selfDuplicate = payloads.some(existing => 
                        (existing.institution_id === payload.institution_id || normalize(existing.new_institution_name) === normalize(payload.new_institution_name)) && 
                        normalize(existing.program_name) === normalize(payload.program_name)
                    );
                    if (selfDuplicate) payload.isDuplicate = true;
                }
                payloads.push(payload);
            }
            setPreviews(payloads);
            setError('');
        } catch (e) {
            setPreviews([]);
            // don't set error on parse fail to allow typing
        }
    }, [jsonText, institutions, applications]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const validPreviews = previews.filter(p => !p.isDuplicate);
        
        if (validPreviews.length === 0) {
            if (previews.length > 0) {
                setError("Toutes les candidatures du JSON existent déjà. Aucune action n'a été effectuée.");
            } else {
                setError("Aucune candidature valide à importer.");
            }
            return;
        }

        setLoading(true);

        try {
            for (const payload of validPreviews) {
                await axios.post('/api/applications', payload);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Erreur lors de la création d'une des candidatures.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center">
                <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm" onClick={onClose}></div>

                <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 p-6 text-left shadow-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Importer une candidature JSON</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                La candidature sera creee automatiquement avec le statut brouillon.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md bg-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <span className="sr-only">Fermer</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400">{error}</div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <textarea
                                    value={jsonText}
                                    onChange={(event) => setJsonText(event.target.value)}
                                    rows={15}
                                    spellCheck={false}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-950 dark:bg-gray-900 p-4 font-mono text-sm text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 custom-scrollbar"
                                />
                                <div className="mt-3 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        L'import accepte un JSON simple ou détaillé.
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(CHATGPT_PROMPT);
                                            setCopiedPrompt(true);
                                            setTimeout(() => setCopiedPrompt(false), 2000);
                                        }}
                                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
                                    >
                                        {copiedPrompt ? (
                                            <>
                                                <CheckIcon className="w-3.5 h-3.5 mr-1.5" />
                                                Prompt Copié !
                                            </>
                                        ) : (
                                            <>
                                                <DocumentDuplicateIcon className="w-3.5 h-3.5 mr-1.5" />
                                                Copier le Prompt ChatGPT
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4 max-h-[22rem] overflow-y-auto custom-scrollbar">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Aperçu ({previews.length} candidature{previews.length > 1 ? 's' : ''})</h4>
                                {previews.length > 0 ? (
                                    <div className="space-y-6">
                                        {previews.map((preview, index) => (
                                            <div key={index} className="space-y-3 text-sm pb-4 border-b border-gray-200 dark:border-gray-600 last:border-0 last:pb-0 text-gray-700 dark:text-gray-300">
                                                <div>
                                                    <span className="font-medium text-gray-900 dark:text-white">Institution : </span>
                                                    {preview.institution_id ? (
                                                        <span className="text-green-600 dark:text-green-400">Existante (ID: {preview.institution_id})</span>
                                                    ) : (
                                                        <span className="text-orange-600 dark:text-orange-400">Nouvelle : {preview.new_institution_name}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-900 dark:text-white">Programme : </span>
                                                    <span>{preview.program_name} ({preview.program_type})</span>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {preview.events.length} événement(s), {preview.checklist_items.length} document(s) à préparer.
                                                </div>
                                                {preview.isDuplicate && (
                                                    <div className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-2 rounded border border-red-100 dark:border-red-800/50">
                                                        ⚠️ Cette candidature existe déjà (elle sera ignorée lors de l'import).
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-gray-400 dark:text-gray-500 italic">JSON invalide ou incomplet pour l'aperçu. Assurez-vous d'avoir au moins un program_name.</div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading || previews.filter(p => !p.isDuplicate).length === 0}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Création...' : (() => {
                                    const validCount = previews.filter(p => !p.isDuplicate).length;
                                    return validCount > 1 ? `Créer ${validCount} candidatures` : (validCount === 1 ? 'Créer la candidature' : 'Aucune à créer');
                                })()}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JsonApplicationImport;
