import React, { useEffect, useMemo, useState } from 'react';
import axios from '../lib/axios';
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    parseISO,
    startOfMonth,
    startOfWeek,
    subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, XMarkIcon } from '@heroicons/react/24/outline';

const getAcronym = (name) => {
    if (!name) return '';
    const cleanName = name
        .replace(/['’]/g, ' ')
        .replace(/\b(de|des|d|l|la|le|les|et|en|pour)\b/gi, ' ');
    
    const words = cleanName.split(/[\s-]+/).filter(w => w.length > 0);
    return words.map(w => w[0].toUpperCase()).join('').substring(0, 4);
};

const EVENT_TYPES = {
    deadline: { label: 'Date limite', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50', dot: 'bg-red-500' },
    exam: { label: 'Concours / Écrit', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50', dot: 'bg-purple-500' },
    preselection: { label: 'Présélection', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/50', dot: 'bg-orange-500' },
    oral: { label: 'Entretien / Oral', color: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/50', dot: 'bg-teal-500' },
    result: { label: 'Résultats / Admis', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50', dot: 'bg-green-500' },
    registration: { label: 'Inscription', color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50', dot: 'bg-indigo-500' },
    other: { label: 'Autre date', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50', dot: 'bg-blue-500' },
};

const STATUS_LABELS = {
    brouillon: 'Brouillon',
    soumis: 'Soumis',
    concours: 'Concours',
    attente: 'En attente',
    accepte: 'Accepte',
    refuse: 'Refuse',
};

const DATE_KEYS = [
    { key: 'date_concours', type: 'exam', label: 'Date concours' },
    { key: 'date_resultats', type: 'result', label: 'Date resultats' },
    { key: 'date_oral', type: 'exam', label: 'Date oral' },
    { key: 'date_ecrit', type: 'exam', label: 'Date ecrit' },
    { key: 'date_entretien', type: 'exam', label: 'Date entretien' },
];

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const readNestedValue = (source, key) => {
    if (!source || typeof source !== 'object') return null;

    if (source[key]) return source[key];

    for (const value of Object.values(source)) {
        if (value && typeof value === 'object') {
            const nested = readNestedValue(value, key);
            if (nested) return nested;
        }
    }

    return null;
};

const parseOriginalJson = (notes) => {
    if (!notes?.includes('JSON original')) return null;

    const jsonText = notes.slice(notes.indexOf('JSON original') + 'JSON original'.length).trim();

    try {
        return JSON.parse(jsonText);
    } catch {
        return null;
    }
};

const collectEvents = (applications) => {
    return applications.flatMap((application) => {
        const events = [];
        const base = {
            appId: application.id,
            institution: application.institution,
            programName: application.program_name,
            programType: application.program_type,
            admissionType: application.admission_type,
            status: application.status,
        };

        if (application.events && application.events.length > 0) {
            application.events.forEach(e => {
                events.push({
                    ...base,
                    id: `${application.id}-${e.id}`,
                    type: e.type,
                    title: e.title,
                    date: e.event_date,
                });
            });
        } else if (application.deadline_date) {
            events.push({
                ...base,
                id: `${application.id}-deadline`,
                type: 'deadline',
                title: 'Date limite',
                date: application.deadline_date,
            });
        }

        return events;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
};

const Calendar = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [filters, setFilters] = useState({
        programType: 'all',
        admissionType: 'all',
        status: 'all',
        eventType: 'all',
        institutionId: 'all',
    });
    const [hideRejected, setHideRejected] = useState(false);
    const [selectedDayEvents, setSelectedDayEvents] = useState(null);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await axios.get('/api/applications');
                setApplications(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch applications', error);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    const allEvents = useMemo(() => collectEvents(applications), [applications]);

    const filteredEvents = useMemo(() => {
        return allEvents.filter((event) => {
            if (filters.programType !== 'all' && event.programType !== filters.programType) return false;
            if (filters.admissionType !== 'all' && event.admissionType !== filters.admissionType) return false;
            if (filters.status !== 'all' && event.status !== filters.status) return false;
            if (filters.eventType !== 'all' && event.type !== filters.eventType) return false;
            if (filters.institutionId !== 'all' && event.institution?.id?.toString() !== filters.institutionId) return false;
            
            if (hideRejected) {
                const rejectedStatuses = ['non_eligible', 'non_preselectionne', 'refuse_ecrit', 'refuse_final'];
                if (rejectedStatuses.includes(event.status)) {
                    return false;
                }
            }
            
            return true;
        });
    }, [allEvents, filters, hideRejected]);

    const monthDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        return eachDayOfInterval({
            start: startOfWeek(monthStart, { weekStartsOn: 1 }),
            end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
        });
    }, [currentMonth]);

    const uniqueInstitutions = useMemo(() => {
        const map = new Map();
        applications.forEach(app => {
            if (app.institution) {
                map.set(app.institution.id.toString(), app.institution.acronym || app.institution.name);
            }
        });
        return Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [applications]);

    const monthEvents = filteredEvents.filter((event) => isSameMonth(parseISO(event.date), currentMonth));
    const upcomingEvents = filteredEvents.filter((event) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return parseISO(event.date) >= today;
    }).slice(0, 8);

    const updateFilter = (name, value) => {
        setFilters((current) => ({ ...current, [name]: value }));
    };

    if (loading) {
        return <div className="animate-pulse">Chargement du calendrier...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendrier</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Toutes les dates importantes de vos candidatures.</p>
                </div>

                <div className="flex items-center gap-2">
                    <label className="flex items-center cursor-pointer group mr-4">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={hideRejected} 
                                onChange={(e) => setHideRejected(e.target.checked)} 
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${hideRejected ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${hideRejected ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                        <div className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors hidden sm:block">
                            Masquer les refus
                        </div>
                    </label>

                    <button
                        type="button"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        <CalendarDaysIcon className="h-5 w-5" />
                        Aujourd'hui
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        <ChevronRightIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-5 items-center mb-6">
                <select
                    value={filters.institutionId}
                    onChange={(event) => updateFilter('institutionId', event.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm"
                >
                    <option value="all">Toutes les écoles</option>
                    {uniqueInstitutions.map((inst) => (
                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                </select>

                <select
                    value={filters.programType}
                    onChange={(event) => updateFilter('programType', event.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm"
                >
                    <option value="all">Toutes les formations</option>
                    <option value="cycle_ingenieur">Cycle d'ingénieur</option>
                    <option value="master">Master</option>
                </select>

                <select
                    value={filters.admissionType}
                    onChange={(event) => updateFilter('admissionType', event.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm"
                >
                    <option value="all">Toutes les admissions</option>
                    <option value="sur_titre">Sur Titre</option>
                    <option value="sur_concours">Sur Concours</option>
                </select>

                <select
                    value={filters.status}
                    onChange={(event) => updateFilter('status', event.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm"
                >
                    <option value="all">Tous les statuts</option>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>

                <select
                    value={filters.eventType}
                    onChange={(event) => updateFilter('eventType', event.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm"
                >
                    <option value="all">Toutes les dates</option>
                    {Object.entries(EVENT_TYPES).map(([value, info]) => (
                        <option key={value} value={value}>{info.label}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <section className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                    <div className="border-b border-gray-100 dark:border-gray-700 px-5 py-4">
                        <h2 className="text-lg font-semibold capitalize text-gray-900 dark:text-white">
                            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                        </h2>
                    </div>

                    <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                            <div key={day} className="px-2 py-3">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {monthDays.map((day) => {
                            const dayEvents = monthEvents.filter((event) => isSameDay(parseISO(event.date), day));

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`min-h-[8rem] border-b border-r border-gray-100 dark:border-gray-700 p-2 ${
                                        isSameDay(day, new Date()) 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-inset ring-blue-500 dark:ring-blue-400' 
                                            : isSameMonth(day, currentMonth) 
                                                ? 'bg-white dark:bg-gray-800' 
                                                : 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500'
                                    }`}
                                >
                                    <div className={`text-sm font-medium ${isSameDay(day, new Date()) ? 'text-blue-700 dark:text-blue-400' : 'dark:text-gray-300'}`}>
                                        {format(day, 'd')}
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        {dayEvents.slice(0, 3).map((event) => (
                                            <div
                                                key={event.id}
                                                className={`truncate rounded-md border px-2 py-1 text-[11px] font-medium ${EVENT_TYPES[event.type]?.color || EVENT_TYPES.other.color}`}
                                                title={`${event.title} - ${event.institution?.name} - ${event.programName}`}
                                            >
                                                {event.admissionType === 'sur_titre' && '🎓 '}
                                                {event.institution?.acronym || getAcronym(event.institution?.name)} - {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <button 
                                                onClick={() => setSelectedDayEvents({ date: day, events: dayEvents })}
                                                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline w-full text-left"
                                            >
                                                +{dayEvents.length - 3} autres
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <aside className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Prochaines dates</h2>
                    <div className="mt-4 space-y-3">
                        {upcomingEvents.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Aucune date avec ces filtres.</p>
                        ) : (
                            upcomingEvents.map((event) => (
                                <div key={event.id} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${EVENT_TYPES[event.type].color}`}>
                                            {EVENT_TYPES[event.type].label}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                            {format(parseISO(event.date), 'dd MMM yyyy', { locale: fr })}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <span>{event.institution?.acronym || event.institution?.name}</span>
                                    </p>
                                    <div className="mt-1 flex items-center justify-between text-gray-600 dark:text-gray-400">
                                        <span className="text-sm">{event.programName}</span>
                                        {event.admissionType && (
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${event.admissionType === 'sur_titre' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                                                {event.admissionType === 'sur_titre' ? '🎓 Titre' : 'Concours'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-2 text-xs capitalize text-gray-500 dark:text-gray-400">
                                        {STATUS_LABELS[event.status] || event.status}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </div>

            {selectedDayEvents && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Événements du {format(selectedDayEvents.date, 'dd MMMM yyyy', { locale: fr })}
                            </h3>
                            <button
                                onClick={() => setSelectedDayEvents(null)}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            {selectedDayEvents.events.map(event => (
                                <div key={event.id} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${EVENT_TYPES[event.type]?.color || EVENT_TYPES.other.color}`}>
                                            {EVENT_TYPES[event.type]?.label || 'Autre'}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <span>{event.institution?.name || event.institution?.acronym}</span>
                                    </p>
                                    <div className="mt-1 flex items-center justify-between text-gray-600 dark:text-gray-400">
                                        <span className="text-sm">{event.programName}</span>
                                        {event.admissionType && (
                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold ${event.admissionType === 'sur_titre' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                                                {event.admissionType === 'sur_titre' ? '🎓 Titre' : 'Concours'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-2 text-xs capitalize text-gray-500 dark:text-gray-400">
                                        {STATUS_LABELS[event.status] || event.status}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
