import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { format, isAfter, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChartBarIcon, ClockIcon, CheckCircleIcon, XCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import ApplicationForm from '../components/ApplicationForm';
import ApplicationDetails from '../components/ApplicationDetails';
import JsonApplicationImport from '../components/JsonApplicationImport';

const Dashboard = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showJsonImport, setShowJsonImport] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState(null);
    const [filterType, setFilterType] = useState('all');

    const fetchApplications = async () => {
        setLoading(true);
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

    const handleFormSuccess = () => {
        setShowForm(false);
        setShowJsonImport(false);
        fetchApplications();
    };

    const handleDeleteSuccess = () => {
        setSelectedAppId(null);
        fetchApplications();
    };

    if (loading && applications.length === 0) {
        return <div className="animate-pulse flex space-x-4">Chargement des données...</div>;
    }

    const filteredApplications = applications.filter(app => {
        if (filterType !== 'all' && app.program_type !== filterType) return false;
        return true;
    });

    const stats = {
        total: filteredApplications.length,
        accepted: filteredApplications.filter(a => a.status === 'accepte').length,
        waiting: filteredApplications.filter(a => ['soumis', 'concours', 'attente'].includes(a.status)).length,
        rejected: filteredApplications.filter(a => a.status === 'refuse').length,
    };

    const upcomingDeadlines = filteredApplications
        .filter(a => a.deadline_date && (isAfter(parseISO(a.deadline_date), new Date()) || isToday(parseISO(a.deadline_date))))
        .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date))
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
                    <p className="mt-1 text-sm text-gray-500">Aperçu global de vos postulations.</p>
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

            <div className="flex items-center space-x-2">
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 p-5 flex items-center">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                        <ChartBarIcon className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500 truncate">Total Candidatures</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 p-5 flex items-center">
                    <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600">
                        <ClockIcon className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500 truncate">En Cours / Attente</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{stats.waiting}</p>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 p-5 flex items-center">
                    <div className="p-3 rounded-xl bg-green-50 text-green-600">
                        <CheckCircleIcon className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500 truncate">Acceptées</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{stats.accepted}</p>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 p-5 flex items-center">
                    <div className="p-3 rounded-xl bg-red-50 text-red-600">
                        <XCircleIcon className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500 truncate">Refusées</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{stats.rejected}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Prochaines Deadlines</h2>
                <div className="bg-white shadow-sm overflow-hidden rounded-2xl border border-gray-100">
                    <ul className="divide-y divide-gray-100">
                        {upcomingDeadlines.length === 0 ? (
                            <li className="p-6 text-center text-gray-500">Aucune deadline à venir.</li>
                        ) : (
                            upcomingDeadlines.map(app => (
                                <li 
                                    key={app.id} 
                                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedAppId(app.id)}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            {app.institution?.logo ? (
                                                <img src={app.institution.logo} alt="" className="h-10 w-10 rounded-full object-contain bg-white shadow-sm border border-gray-100 p-0.5" />
                                            ) : (
                                                <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-bold shadow-sm">
                                                    {app.institution?.acronym?.substring(0,2) || app.institution?.name?.substring(0, 2).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {app.institution.name} - {app.program_name}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                Statut : <span className="capitalize">{app.status}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                {format(parseISO(app.deadline_date), 'dd MMMM yyyy', { locale: fr })}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
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
                    onEdit={() => {}} // We'll handle edit in Kanban too, or leave it empty for now
                />
            )}
        </div>
    );
};

export default Dashboard;
