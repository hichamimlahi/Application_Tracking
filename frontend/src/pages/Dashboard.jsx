import React, { useEffect, useState } from 'react';
import axios from '../lib/axios';
import { format, isAfter, isToday, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChartBarIcon, ClockIcon, CheckCircleIcon, XCircleIcon, PlusIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';
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
        waiting: filteredApplications.filter(a => ['soumis', 'preselectionne', 'admis_oral', 'liste_attente'].includes(a.status)).length,
        rejected: filteredApplications.filter(a => ['non_eligible', 'non_preselectionne', 'refuse_ecrit', 'refuse_final'].includes(a.status)).length,
    };

    const upcomingDeadlines = filteredApplications
        .filter(a => a.deadline_date && (isAfter(parseISO(a.deadline_date), new Date()) || isToday(parseISO(a.deadline_date))))
        .sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date))
        .slice(0, 5);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Aperçu global de vos postulations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowJsonImport(true)}
                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm font-medium"
                    >
                        Importer JSON
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-sm font-medium"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Nouvelle Candidature
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-gray-800 dark:bg-gray-700 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}
                >
                    Toutes
                </button>
                <button
                    onClick={() => setFilterType('cycle_ingenieur')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterType === 'cycle_ingenieur' ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}
                >
                    Cycles d'ingénieur
                </button>
                <button
                    onClick={() => setFilterType('master')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterType === 'master' ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}`}
                >
                    Masters
                </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center transition-colors">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <ChartBarIcon className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total Candidatures</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center transition-colors">
                    <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500">
                        <ClockIcon className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">En Cours / Attente</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.waiting}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center transition-colors">
                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        <CheckCircleIcon className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Acceptées</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.accepted}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center transition-colors">
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        <XCircleIcon className="h-8 w-8" />
                    </div>
                    <div className="ml-5">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Refusées</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Prochaines Deadlines</h2>
                <div className="bg-white dark:bg-gray-800 shadow-sm overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 transition-colors">
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {upcomingDeadlines.length === 0 ? (
                            <li className="p-6 text-center text-gray-500 dark:text-gray-400">Aucune deadline à venir.</li>
                        ) : (
                            upcomingDeadlines.map(app => (
                                <li 
                                    key={app.id} 
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedAppId(app.id)}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            {app.institution?.logo ? (
                                                <img src={app.institution.logo} alt="" className="h-10 w-10 rounded-full object-contain bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 p-0.5" />
                                            ) : (
                                                <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-bold shadow-sm">
                                                    <BuildingLibraryIcon className="w-5 h-5" />
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {app.institution.name} - {app.program_name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                Statut : <span className="capitalize">{app.status}</span>
                                            </p>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
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
