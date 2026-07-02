import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PlusIcon, ViewColumnsIcon, DocumentArrowUpIcon, AcademicCapIcon, TrophyIcon, EyeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ApplicationForm from '../components/ApplicationForm';
import ApplicationDetails from '../components/ApplicationDetails';
import JsonApplicationImport from '../components/JsonApplicationImport';
const STATUSES = {
    'brouillon': { id: 'brouillon', title: 'Brouillon', border: 'border-t-gray-400', bg: 'bg-gray-50/80', dot: 'bg-gray-400' },
    'non_eligible': { id: 'non_eligible', title: 'Non Éligible', border: 'border-t-rose-800', bg: 'bg-rose-50/50', dot: 'bg-rose-800' },
    'soumis': { id: 'soumis', title: 'Postulé', border: 'border-t-blue-500', bg: 'bg-blue-50/50', dot: 'bg-blue-500' },
    'preselectionne': { id: 'preselectionne', title: 'Présélectionné', border: 'border-t-purple-500', bg: 'bg-purple-50/50', dot: 'bg-purple-500' },
    'non_preselectionne': { id: 'non_preselectionne', title: 'Non Présélectionné', border: 'border-t-rose-400', bg: 'bg-rose-50/50', dot: 'bg-rose-400' },
    'admis_oral': { id: 'admis_oral', title: 'Admis à l\'Oral', border: 'border-t-indigo-500', bg: 'bg-indigo-50/50', dot: 'bg-indigo-500' },
    'refuse_ecrit': { id: 'refuse_ecrit', title: 'Refusé Écrit', border: 'border-t-red-500', bg: 'bg-red-50/50', dot: 'bg-red-500' },
    'accepte': { id: 'accepte', title: 'Admis Final', border: 'border-t-green-500', bg: 'bg-green-50/50', dot: 'bg-green-500' },
    'liste_attente': { id: 'liste_attente', title: 'Liste d\'Attente', border: 'border-t-orange-400', bg: 'bg-orange-50/50', dot: 'bg-orange-400' },
    'refuse_final': { id: 'refuse_final', title: 'Refusé Final', border: 'border-t-red-800', bg: 'bg-red-50/50', dot: 'bg-red-800' },
};

const getAcronym = (name) => {
    if (!name) return '';
    const cleanName = name
        .replace(/['’]/g, ' ')
        .replace(/\b(de|des|d|l|la|le|les|et|en|pour)\b/gi, ' ');
    
    const words = cleanName.split(/[\s-]+/).filter(w => w.length > 0);
    return words.map(w => w[0].toUpperCase()).join('').substring(0, 4);
};

const Kanban = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showJsonImport, setShowJsonImport] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState(null);
    const [editingApp, setEditingApp] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [admissionFilter, setAdmissionFilter] = useState('all');
    const [currentPhase, setCurrentPhase] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const PHASES = {
        'all': { label: 'Toutes les étapes', icon: ViewColumnsIcon, columns: Object.keys(STATUSES) },
        'depot': { label: '1. Dépôt de dossier', icon: DocumentArrowUpIcon, columns: ['brouillon', 'soumis', 'non_eligible'] },
        'concours': { label: '2. Concours & Épreuves', icon: AcademicCapIcon, columns: ['preselectionne', 'admis_oral', 'non_preselectionne', 'refuse_ecrit'] },
        'resultats': { label: '3. Résultats Finaux', icon: TrophyIcon, columns: ['accepte', 'liste_attente', 'refuse_final'] }
    };

    const fetchApplications = async () => {
        try {
            const response = await axios.get('/api/applications');
            setApplications(response.data.data);
        } catch (error) {
            console.error("Failed to fetch applications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const updateApplicationStatus = async (appId, newStatus) => {
        try {
            await axios.put(`/api/applications/${appId}`, { status: newStatus });
        } catch (error) {
            console.error("Failed to update status", error);
            // In a real app, we would revert the optimistic update here on error
            fetchApplications();
        }
    };

    const onDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const appToMove = applications.find(a => a.id.toString() === draggableId);
        const newStatus = destination.droppableId;

        // Optimistic update
        const newApplications = Array.from(applications);
        const index = newApplications.findIndex(a => a.id.toString() === draggableId);
        newApplications[index] = { ...appToMove, status: newStatus };
        
        setApplications(newApplications);

        // API Call
        updateApplicationStatus(appToMove.id, newStatus);
    };

    const getAppsByStatus = (status) => {
        return applications.filter(app => {
            const safeStatus = STATUSES[app.status] ? app.status : 'brouillon';
            if (safeStatus !== status) return false;
            if (filterType !== 'all' && app.program_type !== filterType) return false;
            if (admissionFilter !== 'all' && app.admission_type !== admissionFilter) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchName = app.institution?.name?.toLowerCase().includes(query) || false;
                const matchAcronym = app.institution?.acronym?.toLowerCase().includes(query) || false;
                const matchProgram = app.program_name?.toLowerCase().includes(query) || false;
                if (!matchName && !matchAcronym && !matchProgram) return false;
            }
            return true;
        });
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingApp(null);
        fetchApplications();
    };

    const handleDeleteSuccess = () => {
        setSelectedAppId(null);
        fetchApplications();
    };

    if (loading && applications.length === 0) return <div className="animate-pulse">Chargement du Kanban...</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="mb-3 flex justify-between items-end">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Suivi Kanban</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Glissez-déposez vos candidatures pour mettre à jour leur statut.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search Bar moved to top */}
                    <div className="relative hidden md:block">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Rechercher une école..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 w-48 transition-all shadow-sm"
                        />
                    </div>
                    
                    <button
                        onClick={() => setShowJsonImport(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm font-medium text-xs"
                    >
                        Importer JSON
                    </button>
                    <button
                        onClick={() => {
                            setEditingApp(null);
                            setShowForm(true);
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm font-medium text-xs"
                    >
                        <PlusIcon className="w-4 h-4 mr-1.5" />
                        Nouvelle Candidature
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                {/* Premium Phases Navigation */}
                <div className="flex bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-1 rounded-xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 w-fit">
                    {Object.entries(PHASES).map(([phaseKey, phase]) => {
                        const Icon = phase.icon;
                        const isActive = currentPhase === phaseKey;
                        return (
                            <button
                                key={phaseKey}
                                onClick={() => setCurrentPhase(phaseKey)}
                                className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-300 overflow-hidden ${
                                    isActive
                                        ? 'text-blue-700 dark:text-blue-300 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/80 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-lg" />
                                )}
                                <Icon className={`relative z-10 w-4 h-4 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                                <span className="relative z-10 tracking-tight">{phase.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-3">
                    <div className="relative md:hidden">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Rechercher..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-32 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center space-x-1.5 pl-3 sm:pl-0 sm:border-none border-l border-gray-200 dark:border-gray-700 hidden sm:flex">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${filterType === 'all' ? 'bg-gray-800 dark:bg-gray-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm'}`}
                        >
                            Toutes
                        </button>
                        <button
                            onClick={() => setFilterType('cycle_ingenieur')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${filterType === 'cycle_ingenieur' ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm'}`}
                        >
                            Cycles d'ingénieur
                        </button>
                        <button
                            onClick={() => setFilterType('master')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${filterType === 'master' ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm'}`}
                        >
                            Masters
                        </button>
                    </div>

                    <div className="flex items-center space-x-1.5 border-l border-gray-200 dark:border-gray-700 pl-3 hidden lg:flex">
                        <button
                            onClick={() => setAdmissionFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${admissionFilter === 'all' ? 'bg-gray-800 dark:bg-gray-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm'}`}
                        >
                            Tous
                        </button>
                        <button
                            onClick={() => setAdmissionFilter('sur_titre')}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${admissionFilter === 'sur_titre' ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm'}`}
                        >
                            🎓 Sur Titre
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex items-stretch gap-4 pb-4 pt-2 px-2 min-w-max">
                        {Object.values(STATUSES)
                            .filter(column => PHASES[currentPhase].columns.includes(column.id))
                            .map(column => (
                            <Droppable key={column.id} droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`w-64 flex-shrink-0 rounded-[20px] flex flex-col shadow-sm border border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40 transition-all duration-300 ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400/60 dark:ring-blue-500/50 bg-blue-50/40 dark:bg-blue-900/20' : 'hover:shadow-md hover:border-gray-300/80 dark:hover:border-gray-600'}`}
                                    >
                                        {/* Sticky Header */}
                                        <div className="sticky top-0 z-10 rounded-t-[20px] overflow-hidden">
                                            {/* Colored top bar */}
                                            <div className={`h-1.5 w-full ${column.border.replace('border-t-', 'bg-')}`}></div>
                                            
                                            <div className="px-3 py-2.5 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center bg-white/80 dark:bg-gray-800/90 backdrop-blur-md shadow-sm">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`w-2 h-2 rounded-full shadow-sm ring-1 ring-white dark:ring-gray-800 ${column.dot}`}></span>
                                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 tracking-wider text-[11px] uppercase">{column.title}</h3>
                                                </div>
                                                <span className="text-[10px] font-bold bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-600">{getAppsByStatus(column.id).length}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="p-2 space-y-2.5 min-h-[100px]">
                                            {getAppsByStatus(column.id).map((app, index) => (
                                                <Draggable key={app.id.toString()} draggableId={app.id.toString()} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => setSelectedAppId(app.id)}
                                                            className={`bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 ${
                                                                snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500 rotate-2' : 'shadow-sm hover:shadow-md'
                                                            }`}
                                                        >
                                                            <div className="flex items-center space-x-2">
                                                                {app.institution?.logo ? (
                                                                    <img src={app.institution.logo} alt="" className="w-6 h-6 rounded-md object-contain bg-white dark:bg-gray-800 flex-shrink-0 shadow-sm border border-gray-100 dark:border-gray-700" />
                                                                ) : (
                                                                    <span className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                                                                        {app.institution?.acronym?.substring(0,3) || getAcronym(app.institution?.name).substring(0, 3)}
                                                                    </span>
                                                                )}
                                                                <div className="font-bold text-gray-800 dark:text-gray-100 leading-tight text-[13px] line-clamp-1">
                                                                    {app.institution?.acronym || getAcronym(app.institution?.name)}
                                                                </div>
                                                            </div>
                                                            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-snug">
                                                                {app.program_name}
                                                                {app.admission_type && (
                                                                    <span className="ml-1 inline-flex items-center">
                                                                        {app.admission_type === 'sur_titre' ? '🎓' : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="mt-3 flex items-center justify-between">
                                                                {app.deadline_date ? (
                                                                    <div className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 px-2 py-0.5 rounded-md flex items-center">
                                                                        <svg className="w-2.5 h-2.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        DL : {new Date(app.deadline_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </div>
                                                                ) : <div></div>}
                                                                
                                                                {app.documents?.some(d => d.document_type === 'receipt') && (
                                                                    <a 
                                                                        href={`http://localhost:8000/storage/${app.documents.find(d => d.document_type === 'receipt').file_path}`} 
                                                                        target="_blank" 
                                                                        rel="noreferrer" 
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 p-1 rounded-md transition-colors border border-indigo-100 dark:border-indigo-800/50 shadow-sm"
                                                                        title="Voir le reçu"
                                                                    >
                                                                        <EyeIcon className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </DragDropContext>
            </div>

            {showForm && (
                <ApplicationForm 
                    application={editingApp}
                    onClose={() => {
                        setShowForm(false);
                        setEditingApp(null);
                    }} 
                    onSuccess={handleFormSuccess} 
                />
            )}

            {showJsonImport && (
                <JsonApplicationImport
                    onClose={() => setShowJsonImport(false)}
                    onSuccess={handleFormSuccess}
                />
            )}

            {selectedAppId && (
                <ApplicationDetails 
                    applicationId={selectedAppId} 
                    onClose={() => setSelectedAppId(null)}
                    onDeleteSuccess={handleDeleteSuccess}
                    onEdit={(app) => {
                        setSelectedAppId(null);
                        setEditingApp(app);
                        setShowForm(true);
                    }}
                />
            )}
        </div>
    );
};

export default Kanban;
