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

        if (!institutionId) {
            throw new Error("Institution introuvable. Utilise institution_id, institution_acronym, sigle ou institution_name.");
        }

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

        return {
            institution_id: institutionId,
            program_name: programName,
            program_type: valueFrom(payload.program_type, payload.type, formationPayload.type) || 'cycle_ingenieur',
            status: 'brouillon',
            deadline_date: valueFrom(
                payload.deadline_date,
                payload.date_limite,
                payload.concours?.date_limite,
                payload.concours?.deadline_date
            ) || null,
            notes: buildNotes(payload),
        };
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const parsed = JSON.parse(jsonText);
            const payload = buildApplicationPayload(parsed);

            await axios.post('/api/applications', payload);
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || err.message || "JSON invalide.");
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

                        <textarea
                            value={jsonText}
                            onChange={(event) => setJsonText(event.target.value)}
                            rows={12}
                            spellCheck={false}
                            className="w-full rounded-lg border border-gray-300 bg-gray-950 p-4 font-mono text-sm text-gray-100 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                            L'import accepte un JSON simple ou detaille. Les champs en plus sont conserves dans les notes
                            avec le JSON original.
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
