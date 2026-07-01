import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PlusIcon } from '@heroicons/react/24/outline';
import ApplicationForm from '../components/ApplicationForm';
import ApplicationDetails from '../components/ApplicationDetails';
import JsonApplicationImport from '../components/JsonApplicationImport';

const STATUSES = {
    'brouillon': { id: 'brouillon', title: 'Brouillon', border: 'border-t-gray-400', bg: 'bg-gray-50/80', dot: 'bg-gray-400' },
    'soumis': { id: 'soumis', title: 'Soumis', border: 'border-t-blue-500', bg: 'bg-blue-50/50', dot: 'bg-blue-500' },
    'concours': { id: 'concours', title: 'Concours', border: 'border-t-purple-500', bg: 'bg-purple-50/50', dot: 'bg-purple-500' },
    'attente': { id: 'attente', title: 'En Attente', border: 'border-t-yellow-400', bg: 'bg-yellow-50/50', dot: 'bg-yellow-400' },
    'accepte': { id: 'accepte', title: 'Accepté', border: 'border-t-green-500', bg: 'bg-green-50/50', dot: 'bg-green-500' },
    'refuse': { id: 'refuse', title: 'Refusé', border: 'border-t-red-500', bg: 'bg-red-50/50', dot: 'bg-red-500' },
};

const Kanban = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showJsonImport, setShowJsonImport] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState(null);
    const [filterType, setFilterType] = useState('all');

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
            if (app.status !== status) return false;
            if (filterType !== 'all' && app.program_type !== filterType) return false;
            return true;
        });
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setShowJsonImport(false);
        fetchApplications();
    };

    const handleDeleteSuccess = () => {
        setSelectedAppId(null);
        fetchApplications();
    };

    if (loading && applications.length === 0) return <div className="animate-pulse">Chargement du Kanban...</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Suivi Kanban</h1>
                    <p className="mt-1 text-sm text-gray-500">Glissez-déposez vos candidatures pour mettre à jour leur statut.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowJsonImport(true)}
                        className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                    >
                        Importer JSON
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Nouvelle Candidature
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-2 mb-6">
                <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                >
                    Toutes
                </button>
                <button
                    onClick={() => setFilterType('cycle_ingenieur')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterType === 'cycle_ingenieur' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                >
                    Cycles d'ingénieur
                </button>
                <button
                    onClick={() => setFilterType('master')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterType === 'master' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                >
                    Masters
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full items-start gap-4 pb-4 pt-2">
                        {Object.values(STATUSES).map(column => (
                            <Droppable key={column.id} droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 min-w-0 rounded-2xl flex flex-col border-t-4 shadow-sm border border-gray-200/60 ${column.border} ${column.bg} ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400/50 bg-blue-50/30' : ''}`}
                                        style={{ maxHeight: '100%' }}
                                    >
                                        <div className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-white/40 rounded-t-xl">
                                            <div className="flex items-center space-x-2">
                                                <span className={`w-2 h-2 rounded-full ${column.dot}`}></span>
                                                <h3 className="font-semibold text-gray-800 tracking-wide text-sm uppercase">{column.title}</h3>
                                            </div>
                                            <span className="text-xs font-medium bg-white px-2 py-1 rounded-full text-gray-500 shadow-sm border border-gray-100">{getAppsByStatus(column.id).length}</span>
                                        </div>
                                        
                                        <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px] custom-scrollbar">
                                            {getAppsByStatus(column.id).map((app, index) => (
                                                <Draggable key={app.id.toString()} draggableId={app.id.toString()} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => setSelectedAppId(app.id)}
                                                            className={`bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-blue-300 transition-all duration-200 ${
                                                                snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500 rotate-2' : 'shadow-sm hover:shadow-md'
                                                            }`}
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                {app.institution?.logo ? (
                                                                    <img src={app.institution.logo} alt="" className="w-8 h-8 rounded-md object-contain bg-white flex-shrink-0 shadow-sm border border-gray-100" />
                                                                ) : (
                                                                    <span className="w-8 h-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                                        {app.institution?.acronym?.substring(0,2) || app.institution?.name?.substring(0, 2).toUpperCase()}
                                                                </span>
                                                                )}
                                                                <div className="font-semibold text-gray-800 leading-tight">
                                                                    {app.institution?.acronym ? `${app.institution.acronym}` : app.institution?.name}
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-gray-500 mt-1 line-clamp-2">{app.program_name}</div>
                                                            {app.deadline_date && (
                                                                <div className="mt-4 flex items-center">
                                                                    <div className="text-[11px] font-semibold text-red-600 bg-red-50/80 border border-red-100 px-2.5 py-1 rounded-md flex items-center">
                                                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        {new Date(app.deadline_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </div>
                                                                </div>
                                                            )}
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
                    onClose={() => setShowForm(false)} 
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
                        // Open the edit form and pass the app. For now we just close details.
                        setSelectedAppId(null);
                        // Optional: setShowForm(true) and pass the app object
                    }}
                />
            )}
        </div>
    );
};

export default Kanban;
