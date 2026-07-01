import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';

const STATUS_MAP = {
    'brouillon': { title: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
    'soumis': { title: 'Soumis', color: 'bg-blue-100 text-blue-800' },
    'concours': { title: 'Concours', color: 'bg-purple-100 text-purple-800' },
    'attente': { title: 'En Attente', color: 'bg-yellow-100 text-yellow-800' },
    'accepte': { title: 'Accepté', color: 'bg-green-100 text-green-800' },
    'refuse': { title: 'Refusé', color: 'bg-red-100 text-red-800' },
};

const ApplicationDetails = ({ applicationId, onClose, onEdit, onDeleteSuccess }) => {
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const [uploadData, setUploadData] = useState({
        file: null,
        type: 'cv'
    });

    useEffect(() => {
        if (applicationId) {
            fetchApplication();
        }
    }, [applicationId]);

    const fetchApplication = async () => {
        try {
            const response = await axios.get(`/api/applications/${applicationId}`);
            setApplication(response.data.data);
        } catch (err) {
            setError("Erreur lors du chargement des détails.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette candidature ?")) return;
        
        try {
            await axios.delete(`/api/applications/${applicationId}`);
            onDeleteSuccess();
        } catch (err) {
            alert("Erreur lors de la suppression.");
        }
    };

    const handleFileChange = (e) => {
        setUploadData({ ...uploadData, file: e.target.files[0] });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadData.file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('application_id', applicationId);
        formData.append('document_type', uploadData.type);
        formData.append('title', uploadData.file.name);
        formData.append('file', uploadData.file);

        try {
            await axios.post('/api/documents', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadData({ file: null, type: 'cv' });
            fetchApplication(); // Refresh the documents list
        } catch (err) {
            alert("Erreur lors du téléversement du document.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!window.confirm("Supprimer ce document ?")) return;
        
        try {
            await axios.delete(`/api/documents/${docId}`);
            fetchApplication();
        } catch (err) {
            alert("Erreur lors de la suppression du document.");
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                    <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
                    <div className="relative inline-block p-8 bg-white rounded-xl">Chargement...</div>
                </div>
            </div>
        );
    }

    if (!application) return null;

    const statusInfo = STATUS_MAP[application.status] || STATUS_MAP['brouillon'];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

                <div className="relative inline-block w-full max-w-3xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-xl sm:my-8 sm:p-6 sm:align-middle">
                    <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block flex space-x-2">
                        <button onClick={() => onEdit(application)} className="text-gray-400 bg-white rounded-md hover:text-blue-500 mr-2">
                            <span className="sr-only">Modifier</span>
                            ✏️
                        </button>
                        <button onClick={handleDelete} className="text-gray-400 bg-white rounded-md hover:text-red-500 mr-2">
                            <span className="sr-only">Supprimer</span>
                            🗑️
                        </button>
                        <button onClick={onClose} className="text-gray-400 bg-white rounded-md hover:text-gray-500">
                            <span className="sr-only">Fermer</span>
                            ✖
                        </button>
                    </div>

                    <div className="mt-3 text-left">
                        <h3 className="text-2xl font-bold text-gray-900">
                            {application.institution?.name}
                        </h3>
                        <p className="text-lg text-gray-600 mt-1">{application.program_name}</p>

                        <div className="mt-4 flex space-x-3 items-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                                {statusInfo.title}
                            </span>
                            {application.deadline_date && (
                                <span className="text-sm text-red-600 font-medium">
                                    ⏰ DL: {application.deadline_date}
                                </span>
                            )}
                        </div>

                        <div className="mt-6 border-t border-gray-200 pt-6">
                            <h4 className="text-lg font-medium text-gray-900">Détails</h4>
                            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Méthode de soumission</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{application.submission_method === 'en_ligne' ? 'En ligne' : 'Papier'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Portail</dt>
                                    <dd className="mt-1 text-sm text-blue-600">
                                        {application.portal_url ? (
                                            <a href={application.portal_url} target="_blank" rel="noreferrer" className="hover:underline">Lien d'accès</a>
                                        ) : '-'}
                                    </dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Notes & Identifiants</dt>
                                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded-md">
                                        {application.notes || 'Aucune note.'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <div className="mt-8 border-t border-gray-200 pt-6">
                            <h4 className="text-lg font-medium text-gray-900">Documents joints</h4>
                            
                            <ul className="mt-4 space-y-3">
                                {application.documents?.length === 0 ? (
                                    <p className="text-sm text-gray-500">Aucun document joint pour l'instant.</p>
                                ) : (
                                    application.documents?.map(doc => (
                                        <li key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <span className="text-xl mr-3">📄</span>
                                                <div>
                                                    <a href={`http://localhost:8000/storage/${doc.file_path}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                                                        {doc.title}
                                                    </a>
                                                    <p className="text-xs text-gray-500 capitalize">{doc.document_type ? doc.document_type.replace('_', ' ') : ''}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteDocument(doc.id)} className="text-sm text-red-600 hover:text-red-800">
                                                Supprimer
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>

                            <form onSubmit={handleUpload} className="mt-6 flex items-end space-x-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-blue-900">Nouveau document</label>
                                    <select
                                        value={uploadData.type}
                                        onChange={(e) => setUploadData({...uploadData, type: e.target.value})}
                                        className="mt-1 block w-full text-sm border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="cv">CV</option>
                                        <option value="motivation_letter">Lettre de motivation</option>
                                        <option value="transcript">Relevé de notes</option>
                                        <option value="other">Autre</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        required
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={uploading || !uploadData.file}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {uploading ? 'Upload...' : 'Ajouter'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicationDetails;
