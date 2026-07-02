import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';

const STATUSES = [
    { id: 'brouillon', name: 'Brouillon / Annonce' },
    { id: 'non_eligible', name: 'Non éligible' },
    { id: 'soumis', name: 'Postulé' },
    { id: 'preselectionne', name: 'Présélectionné' },
    { id: 'non_preselectionne', name: 'Non présélectionné' },
    { id: 'admis_oral', name: 'Admis à l\'Oral' },
    { id: 'refuse_ecrit', name: 'Refusé à l\'Écrit' },
    { id: 'accepte', name: 'Admis Final' },
    { id: 'liste_attente', name: 'Liste d\'Attente' },
    { id: 'refuse_final', name: 'Refusé Final' },
];

const SUBMISSION_METHODS = [
    { id: 'en_ligne', name: 'En Ligne' },
    { id: 'papier', name: 'Papier (Courrier)' },
];

const ApplicationForm = ({ application = null, onClose, onSuccess }) => {
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [formData, setFormData] = useState({
        institution_id: application?.institution_id || '',
        program_name: application?.program_name || '',
        program_type: application?.program_type || 'cycle_ingenieur',
        status: application?.status || 'brouillon',
        submission_method: application?.submission_method || 'en_ligne',
        portal_url: application?.portal_url || '',
        deadline_date: application?.deadline_date || '',
        notes: application?.notes || '',
    });

    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const response = await axios.get('/api/institutions');
                setInstitutions(response.data.data || []);
            } catch (err) {
                console.error("Failed to fetch institutions", err);
            }
        };
        fetchInstitutions();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (application && application.id) {
                await axios.put(`/api/applications/${application.id}`, formData);
            } else {
                await axios.post('/api/applications', formData);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue lors de la sauvegarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <div className="relative inline-block w-full max-w-2xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-xl sm:my-8 sm:p-6 sm:align-middle">
                    <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                        <button
                            type="button"
                            className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none"
                            onClick={onClose}
                        >
                            <span className="sr-only">Fermer</span>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="sm:flex sm:items-start">
                        <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
                            <h3 className="text-xl font-bold leading-6 text-gray-900">
                                {application ? 'Modifier la candidature' : 'Nouvelle candidature'}
                            </h3>
                            
                            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                                {error && (
                                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>
                                )}

                                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                    <div className="sm:col-span-1">
                                        <label htmlFor="program_type" className="block text-sm font-medium text-gray-700">Type de formation</label>
                                        <select
                                            id="program_type"
                                            name="program_type"
                                            required
                                            value={formData.program_type}
                                            onChange={handleChange}
                                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                                        >
                                            <option value="cycle_ingenieur">Cycle d'Ingénieur</option>
                                            <option value="master">Master</option>
                                        </select>
                                    </div>

                                    <div className="sm:col-span-1 relative">
                                        <label htmlFor="institution_id" className="block text-sm font-medium text-gray-700">Institution</label>
                                        <div className="mt-1 relative">
                                            <button
                                                type="button"
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            >
                                                <span className="flex items-center">
                                                    {formData.institution_id ? (
                                                        <>
                                                            {institutions.find(i => i.id == formData.institution_id)?.logo ? (
                                                                <img src={institutions.find(i => i.id == formData.institution_id).logo} alt="" className="flex-shrink-0 h-6 w-6 rounded-md mr-3 object-contain" />
                                                            ) : (
                                                                <span className="flex-shrink-0 h-6 w-6 rounded-md bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 mr-3">
                                                                    {institutions.find(i => i.id == formData.institution_id)?.acronym?.substring(0,2) || '??'}
                                                                </span>
                                                            )}
                                                            <span className="block truncate">{institutions.find(i => i.id == formData.institution_id)?.name}</span>
                                                        </>
                                                    ) : (
                                                        <span className="block truncate text-gray-500">Sélectionnez une institution</span>
                                                    )}
                                                </span>
                                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                            </button>

                                            {isDropdownOpen && (
                                                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                                    {institutions.map((inst) => (
                                                        <li
                                                            key={inst.id}
                                                            className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                                                            onClick={() => {
                                                                setFormData({ ...formData, institution_id: inst.id });
                                                                setIsDropdownOpen(false);
                                                            }}
                                                        >
                                                            <div className="flex items-center">
                                                                {inst.logo ? (
                                                                    <img src={inst.logo} alt="" className="flex-shrink-0 h-6 w-6 rounded-md object-contain bg-white" />
                                                                ) : (
                                                                    <span className="flex-shrink-0 h-6 w-6 rounded-md bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                                        {inst.acronym?.substring(0,2) || inst.name.substring(0,2)}
                                                                    </span>
                                                                )}
                                                                <span className="ml-3 block truncate font-medium">
                                                                    {inst.acronym ? `${inst.acronym} - ` : ''}{inst.name}
                                                                </span>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="program_name" className="block text-sm font-medium text-gray-700">Nom du Programme / Filière</label>
                                        <input
                                            type="text"
                                            name="program_name"
                                            id="program_name"
                                            required
                                            value={formData.program_name}
                                            onChange={handleChange}
                                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                                            placeholder="Ex: Génie Logiciel"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Statut</label>
                                        <select
                                            id="status"
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                                        >
                                            {STATUSES.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="submission_method" className="block text-sm font-medium text-gray-700">Méthode de soumission</label>
                                        <select
                                            id="submission_method"
                                            name="submission_method"
                                            value={formData.submission_method}
                                            onChange={handleChange}
                                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                                        >
                                            {SUBMISSION_METHODS.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="portal_url" className="block text-sm font-medium text-gray-700">Lien du portail de candidature (Optionnel)</label>
                                        <input
                                            type="url"
                                            name="portal_url"
                                            id="portal_url"
                                            value={formData.portal_url}
                                            onChange={handleChange}
                                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                                            placeholder="https://..."
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="deadline_date" className="block text-sm font-medium text-gray-700">Date limite</label>
                                        <input
                                            type="date"
                                            name="deadline_date"
                                            id="deadline_date"
                                            value={formData.deadline_date}
                                            onChange={handleChange}
                                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                                        />
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes / Remarques</label>
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            rows={3}
                                            value={formData.notes}
                                            onChange={handleChange}
                                            className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
                                            placeholder="Identifiants de connexion, documents manquants..."
                                        />
                                    </div>
                                </div>

                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicationForm;
