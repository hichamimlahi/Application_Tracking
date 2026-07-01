import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';

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
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const response = await axios.get('/api/institutions');
                setInstitutions(response.data.data || []);
            } catch (err) {
                setError("Impossible de charger la liste des institutions.");
            }
        };

        fetchInstitutions();
    }, []);

    const normalize = (value) => String(value || '').trim().toLowerCase();

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
        clean = clean.trim();
        if (!clean) return null;
        if (!/^https?:\/\//i.test(clean)) {
            clean = 'https://' + clean;
        }
        return clean;
    };

    const mapSubmissionMethod = (methodStr) => {
        if (!methodStr) return null;
        const normalized = String(methodStr).toLowerCase().replace(/[^a-z]/g, '');
        if (normalized.includes('enligne') || normalized.includes('internet') || normalized.includes('web')) {
            return 'en_ligne';
        }
        if (normalized.includes('papier') || normalized.includes('courrier') || normalized.includes('poste')) {
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
        if (deadlineDate) events.push({ type: 'deadline', title: 'Date limite', event_date: deadlineDate });
        const preselectionDate = valueFrom(payload.date_preselection, payload.concours?.date_preselection);
        if (preselectionDate) events.push({ type: 'preselection', title: 'Présélection', event_date: preselectionDate });
        const examDate = valueFrom(payload.date_concours, payload.concours?.date_concours);
        if (examDate) events.push({ type: 'exam', title: 'Concours', event_date: examDate });
        const resultDate = valueFrom(payload.date_resultats, payload.concours?.date_resultats);
        if (resultDate) events.push({ type: 'result', title: 'Résultats', event_date: resultDate });

        const documents = payload.documents || payload.documents_requis || payload.concours?.documents || [];
        const checklist_items = Array.isArray(documents) 
            ? documents.map((doc, index) => ({ title: doc, status: 'todo', position: index }))
            : [];

        return {
            institution_id: institutionId,
            new_institution_name: !institutionId ? (institutionPayload.nom || institutionPayload.name || institutionPayload.sigle || 'Nouvelle Institution') : null,
            new_institution_acronym: !institutionId ? (institutionPayload.sigle?.trim() || institutionPayload.acronym?.trim() || null) : null,
            new_institution_website: !institutionId ? cleanUrl(institutionPayload.site_web || institutionPayload.website) : null,
            program_name: programName,
            program_type: valueFrom(payload.program_type, payload.type, formationPayload.type) || 'cycle_ingenieur',
            status: 'brouillon',
            submission_method: mapSubmissionMethod(valueFrom(payload.submission_method, payload.mode_candidature, payload.concours?.mode_candidature)),
            portal_url: cleanUrl(valueFrom(payload.portal_url, payload.lien_candidature, payload.concours?.lien_candidature)),
            deadline_date: deadlineDate,
            notes: buildNotes(payload),
            events,
            checklist_items,
        };
    };

    useEffect(() => {
        try {
            const parsed = JSON.parse(jsonText);
            const payload = buildApplicationPayload(parsed);
            setPreview(payload);
            setError('');
        } catch (err) {
            setPreview(null);
        }
    }, [jsonText, institutions]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!preview) {
            setError("JSON invalide ou données manquantes.");
            return;
        }

        setError('');
        setLoading(true);

        try {
            await axios.post('/api/applications', preview);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Erreur lors de la création.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 text-left shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Importer une candidature JSON</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                La candidature sera creee automatiquement avec le statut brouillon.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md bg-white text-gray-400 hover:text-gray-600"
                        >
                            <span className="sr-only">Fermer</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <textarea
                                    value={jsonText}
                                    onChange={(event) => setJsonText(event.target.value)}
                                    rows={15}
                                    spellCheck={false}
                                    className="w-full rounded-lg border border-gray-300 bg-gray-950 p-4 font-mono text-sm text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <div className="mt-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                                    L'import accepte un JSON simple ou détaillé. Les événements et documents sont extraits.
                                </div>
                            </div>
                            
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 max-h-[22rem] overflow-y-auto">
                                <h4 className="font-semibold text-gray-700 mb-2">Aperçu</h4>
                                {preview ? (
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="font-medium">Institution : </span>
                                            {preview.institution_id ? (
                                                <span className="text-green-600">Existante (ID: {preview.institution_id})</span>
                                            ) : (
                                                <span className="text-orange-600">Nouvelle : {preview.new_institution_name}</span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-medium">Programme : </span>
                                            <span>{preview.program_name} ({preview.program_type})</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">Evénements ({preview.events.length}) : </span>
                                            <ul className="list-disc pl-5 mt-1">
                                                {preview.events.map((e, i) => <li key={i}>{e.title} - {e.event_date}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <span className="font-medium">Documents à préparer ({preview.checklist_items.length}) : </span>
                                            <ul className="list-disc pl-5 mt-1">
                                                {preview.checklist_items.map((c, i) => <li key={i}>{c.title}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 italic">JSON invalide ou incomplet pour l'aperçu. Assurez-vous d'avoir au moins un program_name.</div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                {loading ? 'Creation...' : 'Creer la candidature'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default JsonApplicationImport;
