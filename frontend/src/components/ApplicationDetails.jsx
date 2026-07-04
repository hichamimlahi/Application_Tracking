import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import { 
    XMarkIcon, TrashIcon, CalendarDaysIcon, 
    DocumentTextIcon, PencilSquareIcon, LinkIcon,
    PlusIcon, DocumentArrowUpIcon, ChevronDownIcon, EyeIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircle } from '@heroicons/react/24/solid';

const STATUS_MAP = {
    'brouillon': { title: 'Brouillon / Annonce', color: 'bg-gray-100 text-gray-700 ring-gray-200' },
    'non_eligible': { title: 'Non Éligible', color: 'bg-rose-100 text-rose-700 ring-rose-200' },
    'soumis': { title: 'Postulé', color: 'bg-blue-100 text-blue-700 ring-blue-200' },
    'preselectionne': { title: 'Présélectionné', color: 'bg-purple-100 text-purple-700 ring-purple-200' },
    'non_preselectionne': { title: 'Non Présélectionné', color: 'bg-rose-100 text-rose-700 ring-rose-200' },
    'admis_oral': { title: 'Admis à l\'Oral', color: 'bg-indigo-100 text-indigo-700 ring-indigo-200' },
    'refuse_ecrit': { title: 'Refusé à l\'Écrit', color: 'bg-red-100 text-red-700 ring-red-200' },
    'accepte': { title: 'Admis Final', color: 'bg-green-100 text-green-700 ring-green-200' },
    'liste_attente': { title: 'Liste d\'Attente', color: 'bg-orange-100 text-orange-700 ring-orange-200' },
    'refuse_final': { title: 'Refusé Final', color: 'bg-red-100 text-red-700 ring-red-200' },
};

const DOC_TYPES = {
    'cv': 'CV',
    'motivation_letter': 'Lettre de motivation',
    'transcript': 'Relevé de notes',
    'receipt': 'Reçu / Preuve',
    'other': 'Autre document'
};

const EVENT_TYPES = {
    'exam': 'Concours',
    'preselection': 'Présélection',
    'deadline': 'Date Limite',
    'result': 'Résultats',
    'oral': 'Oral',
    'registration': 'Inscription',
    'other': 'Autre'
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
};
import { useApplications } from '../contexts/ApplicationsContext';

const ApplicationDetails = ({ applicationId, onClose, onEdit, onDeleteSuccess }) => {
    const { applications, setApplications } = useApplications();
    const globalApp = applications.find(a => a.id === applicationId);
    
    const [application, setApplication] = useState(globalApp || null);
    const [loading, setLoading] = useState(!globalApp);
    const [uploading, setUploading] = useState(false);
    
    const [uploadData, setUploadData] = useState({ file: null, type: 'cv' });
    const [newEvent, setNewEvent] = useState({ type: 'exam', title: '', event_date: '', notes: '' });
    const [newChecklist, setNewChecklist] = useState({ title: '', status: 'todo' });
    const [showNotes, setShowNotes] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (applicationId) {
            fetchApplication();
        }
    }, [applicationId]);

    const fetchApplication = async () => {
        try {
            const response = await axios.get(`/api/applications/${applicationId}`);
            const updatedApp = response.data.data;
            setApplication(updatedApp);
            // Sync with global context so Kanban/Calendar stay updated
            setApplications(prev => prev.map(a => a.id === applicationId ? updatedApp : a));
        } catch (err) {
            console.error(err);
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
        if (e.target.files && e.target.files[0]) {
            setUploadData({ ...uploadData, file: e.target.files[0] });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setUploadData({ ...uploadData, file: e.dataTransfer.files[0] });
        }
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
            await axios.post('/api/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setUploadData({ file: null, type: 'cv' });
            fetchApplication();
        } catch (err) {
            alert("Erreur lors du téléversement.");
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

    const handleToggleChecklist = async (item) => {
        const newStatus = item.status === 'todo' ? 'ready' : 'todo';
        try {
            await axios.put(`/api/checklist-items/${item.id}`, { status: newStatus });
            fetchApplication();
        } catch (err) {
            alert("Erreur.");
        }
    };

    const handleAddChecklist = async (e) => {
        e.preventDefault();
        if (!newChecklist.title) return;
        try {
            await axios.post('/api/checklist-items', { ...newChecklist, application_id: applicationId });
            setNewChecklist({ title: '', status: 'todo' });
            fetchApplication();
        } catch (err) {
            alert("Erreur.");
        }
    };

    const handleDeleteChecklist = async (itemId) => {
        if (!window.confirm("Supprimer cet élément ?")) return;
        try {
            await axios.delete(`/api/checklist-items/${itemId}`);
            fetchApplication();
        } catch (err) {
            alert("Erreur.");
        }
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.event_date) return;
        try {
            await axios.post('/api/application-events', { ...newEvent, application_id: applicationId });
            setNewEvent({ type: 'exam', title: '', event_date: '', notes: '' });
            fetchApplication();
        } catch (err) {
            alert("Erreur.");
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm("Supprimer cet événement ?")) return;
        try {
            await axios.delete(`/api/application-events/${eventId}`);
            fetchApplication();
        } catch (err) {
            alert("Erreur.");
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-opacity">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl flex items-center space-x-3">
                    <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Chargement...</span>
                </div>
            </div>
        );
    }

    if (!application) return null;

    const statusInfo = STATUS_MAP[application.status] || STATUS_MAP['brouillon'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden transform transition-all border border-gray-200 dark:border-gray-800">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start">
                    <div className="flex-1 pr-8">
                        <div className="flex items-center space-x-4 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ring-1 ring-inset ${statusInfo.color}`}>
                                {statusInfo.title}
                            </span>
                            {application.deadline_date && (
                                <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full ring-1 ring-inset ring-red-200">
                                    <CalendarDaysIcon className="w-4 h-4 mr-1.5" />
                                    DL: {formatDate(application.deadline_date)}
                                </span>
                            )}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                            {application.institution?.name}
                        </h2>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 font-medium flex items-center gap-2">
                            {application.program_name}
                            {application.admission_type === 'sur_titre' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                    🎓 Sur Titre
                                </span>
                            )}
                            {application.admission_type === 'sur_concours' && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                    Sur Concours
                                </span>
                            )}
                        </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <button onClick={() => onEdit(application)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Modifier">
                            <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button onClick={handleDelete} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Supprimer">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                        <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Fermer">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white dark:bg-gray-900">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content: Left Column */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* Checklist Section */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                                    <SolidCheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                                    Checklist & Prérequis
                                </h3>
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                                    <ul className="space-y-2 mb-4">
                                        {application.checklist_items?.length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">Aucune tâche ajoutée.</p>
                                        ) : (
                                            application.checklist_items?.map(item => {
                                                const isDone = item.status === 'ready' || item.status === 'sent';
                                                return (
                                                    <li key={item.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${isDone ? 'bg-white/50 dark:bg-gray-800/50 opacity-75' : 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700'}`}>
                                                        <label className="flex items-center cursor-pointer flex-1 group">
                                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${isDone ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'}`}>
                                                                {isDone && <SolidCheckCircle className="w-4 h-4 text-white" />}
                                                            </div>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isDone} 
                                                                onChange={() => handleToggleChecklist(item)}
                                                                className="hidden"
                                                            />
                                                            <span className={`text-sm font-medium ${isDone ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                                                {item.title}
                                                            </span>
                                                        </label>
                                                        <button onClick={() => handleDeleteChecklist(item.id)} className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </button>
                                                    </li>
                                                );
                                            })
                                        )}
                                    </ul>
                                    <form onSubmit={handleAddChecklist} className="flex gap-2">
                                        <input type="text" placeholder="Ajouter une tâche ou un document..." required value={newChecklist.title} onChange={e => setNewChecklist({...newChecklist, title: e.target.value})} className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                        <button type="submit" className="bg-gray-800 dark:bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                                            <PlusIcon className="w-5 h-5" />
                                        </button>
                                    </form>
                                </div>
                            </section>

                            {/* Events Section */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                                    <CalendarDaysIcon className="w-5 h-5 text-purple-500 mr-2" />
                                    Calendrier & Dates
                                </h3>
                                <div className="space-y-3">
                                    {application.events?.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">Aucun événement planifié.</p>
                                    ) : (
                                        application.events?.map(event => (
                                            <div key={event.id} className="group flex items-start justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:border-purple-300 dark:hover:border-purple-500 transition-colors">
                                                <div className="flex items-start">
                                                    <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg px-3 py-2 text-center mr-4 border border-purple-100 dark:border-purple-800/50 min-w-[70px]">
                                                        <span className="block text-xs font-bold uppercase">{EVENT_TYPES[event.type] || event.type}</span>
                                                        <span className="block text-sm font-semibold mt-0.5">{formatDate(event.event_date)}</span>
                                                    </div>
                                                    <div className="pt-1">
                                                        <span className="font-bold text-gray-900 dark:text-white">{event.title}</span>
                                                        {event.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{event.notes}</p>}
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDeleteEvent(event.id)} className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                    
                                    <form onSubmit={handleAddEvent} className="flex gap-2 items-start bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 mt-2">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex gap-2">
                                                <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none w-1/3">
                                                    {Object.entries(EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                                </select>
                                                <input type="text" placeholder="Titre de l'événement" required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="date" required value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} className="w-1/3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                                                <input type="text" placeholder="Notes (optionnel)" value={newEvent.notes} onChange={e => setNewEvent({...newEvent, notes: e.target.value})} className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none" />
                                            </div>
                                        </div>
                                        <button type="submit" className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors h-[42px] self-end px-4 font-medium text-sm">
                                            Ajouter
                                        </button>
                                    </form>
                                </div>
                            </section>

                        </div>

                        {/* Sidebar: Right Column */}
                        <div className="space-y-6">
                            
                            {/* Infos Section */}
                            <section className="bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/30">
                                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-4">Informations</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <span className="block text-xs font-semibold text-blue-700/70 dark:text-blue-400/70 uppercase">Méthode</span>
                                        <span className="block mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/30 inline-block shadow-sm">
                                            {application.submission_method === 'en_ligne' ? '🌐 En ligne' : '📄 Papier'}
                                        </span>
                                    </div>
                                    
                                    {application.portal_url && (
                                        <div>
                                            <span className="block text-xs font-semibold text-blue-700/70 dark:text-blue-400/70 uppercase">Portail</span>
                                            <a href={application.portal_url} target="_blank" rel="noreferrer" className="mt-1 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-white dark:bg-gray-800 shadow-sm px-3 py-2 rounded-lg border border-blue-100 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-500 transition-colors group w-fit">
                                                <LinkIcon className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
                                                Accéder au portail
                                            </a>
                                        </div>
                                    )}

                                    {application.documents?.some(d => d.document_type === 'receipt') && (
                                        <div>
                                            <span className="block text-xs font-semibold text-blue-700/70 dark:text-blue-400/70 uppercase">Justificatif</span>
                                            <a href={`http://localhost:8000/storage/${application.documents.find(d => d.document_type === 'receipt').file_path}`} target="_blank" rel="noreferrer" className="mt-1 flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-white dark:bg-gray-800 shadow-sm px-3 py-2 rounded-lg border border-indigo-100 dark:border-indigo-800/30 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors group w-fit">
                                                <EyeIcon className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
                                                Visionner le reçu
                                            </a>
                                        </div>
                                    )}

                                    {application.notes && (
                                        <div>
                                            <span className="block text-xs font-semibold text-blue-700/70 dark:text-blue-400/70 uppercase">Notes & Identifiants</span>
                                            <div className="mt-1 bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30 shadow-sm transition-all duration-300">
                                                <div className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed overflow-hidden transition-all duration-300 ${!showNotes && application.notes.length > 100 ? 'line-clamp-3' : ''}`}>
                                                    {application.notes}
                                                </div>
                                                {application.notes.length > 100 && (
                                                    <button 
                                                        onClick={() => setShowNotes(!showNotes)}
                                                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2 flex items-center uppercase tracking-wide transition-colors"
                                                    >
                                                        {showNotes ? 'Masquer' : 'Afficher plus'}
                                                        <ChevronDownIcon className={`w-3.5 h-3.5 ml-1 transition-transform duration-300 ${showNotes ? 'rotate-180' : ''}`} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Documents Section */}
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                                    <DocumentTextIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                                    Pièces jointes
                                </h3>
                                
                                <div className="space-y-2 mb-4">
                                    {application.documents?.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">Aucun fichier joint.</p>
                                    ) : (
                                        application.documents?.map(doc => (
                                            <div key={doc.id} className="group flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
                                                <div className="flex items-center overflow-hidden pr-2">
                                                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg mr-3 flex-shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                                                        <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                                                    </div>
                                                    <div className="truncate">
                                                        <span className="block text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                            {doc.title}
                                                        </span>
                                                        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                            {DOC_TYPES[doc.document_type] || doc.document_type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a href={`http://localhost:8000/storage/${doc.file_path}`} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 p-1.5 transition-colors mr-1" title="Visionner">
                                                        <EyeIcon className="w-4 h-4" />
                                                    </a>
                                                    <button onClick={() => handleDeleteDocument(doc.id)} className="text-gray-400 hover:text-red-500 p-1.5 transition-colors" title="Supprimer">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <form 
                                    onSubmit={handleUpload} 
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`p-4 rounded-xl border-2 border-dashed transition-all duration-200 ${isDragging ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-500 scale-[1.02]' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}
                                >
                                    <div className="space-y-3">
                                        <select
                                            value={uploadData.type}
                                            onChange={(e) => setUploadData({...uploadData, type: e.target.value})}
                                            className="w-full text-sm border-gray-200 dark:border-gray-700 rounded-lg py-2 px-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        >
                                            {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                        </select>
                                        
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="file-upload"
                                                required={!uploadData.file}
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <label 
                                                htmlFor="file-upload"
                                                className={`flex items-center justify-center w-full px-3 py-3 rounded-lg cursor-pointer transition-colors border border-dashed ${uploadData.file ? 'bg-blue-100/50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                            >
                                                <DocumentArrowUpIcon className={`w-5 h-5 mr-2 ${uploadData.file ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                                <span className="text-xs font-semibold truncate max-w-[200px]">
                                                    {uploadData.file ? uploadData.file.name : "Cliquez ou glissez un fichier ici"}
                                                </span>
                                            </label>
                                        </div>
                                        
                                        <button
                                            type="submit"
                                            disabled={uploading || !uploadData.file}
                                            className="w-full flex justify-center items-center py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            {uploading ? (
                                                <span className="flex items-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Upload...</span>
                                            ) : (
                                                <span className="flex items-center">Joindre le document</span>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </section>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicationDetails;
