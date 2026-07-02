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
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, XMarkIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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
        programTypes: [],
        admissionTypes: [],
        statuses: [],
        eventTypes: [],
        institutionIds: [],
    });
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
    const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
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
            if (filters.programTypes.length > 0 && !filters.programTypes.includes(event.programType)) return false;
            if (filters.admissionTypes.length > 0 && !filters.admissionTypes.includes(event.admissionType)) return false;
            if (filters.statuses.length > 0 && !filters.statuses.includes(event.status)) return false;
            if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.type)) return false;
            
            if (filters.institutionIds.length > 0) {
                const eventInstId = event.institution?.id?.toString();
                const isIncluded = filters.institutionIds.some(groupIds => {
                    const idsArray = groupIds.split(',');
                    return idsArray.includes(eventInstId);
                });
                if (!isIncluded) return false;
            }
            
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
                const name = app.institution.acronym || app.institution.name;
                if (!map.has(name)) {
                    map.set(name, []);
                }
                const ids = map.get(name);
                if (!ids.includes(app.institution.id.toString())) {
                    ids.push(app.institution.id.toString());
                }
            }
        });
        return Array.from(map.entries())
            .map(([name, ids]) => ({ id: ids.join(','), name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [applications]);

    const monthEvents = filteredEvents.filter((event) => isSameMonth(parseISO(event.date), currentMonth));
    const upcomingEvents = filteredEvents.filter((event) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return parseISO(event.date) >= today;
    }).slice(0, 8);

    const updateFilterSingle = (name, value) => {
        setFilters((current) => ({
            ...current,
            [name]: value === 'all' ? [] : [value],
        }));
    };

    const toggleFilter = (category, value) => {
        setFilters(prev => {
            const current = prev[category];
            if (current.includes(value)) {
                return { ...prev, [category]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [category]: [...current, value] };
            }
        });
    };

    const removeFilter = (category, value) => {
        setFilters(prev => ({ ...prev, [category]: prev[category].filter(v => v !== value) }));
    };

    const clearFilters = () => {
        setFilters({
            programTypes: [],
            admissionTypes: [],
            statuses: [],
            eventTypes: [],
            institutionIds: [],
        });
    };

    const getFilterLabel = (category, value) => {
        if (category === 'programTypes') return value === 'cycle_ingenieur' ? "Cycle d'ingénieur" : 'Master';
        if (category === 'admissionTypes') return value === 'sur_titre' ? 'Sur Titre' : 'Sur Concours';
        if (category === 'statuses') return STATUS_LABELS[value] || value;
        if (category === 'eventTypes') return EVENT_TYPES[value]?.label || value;
        if (category === 'institutionIds') return uniqueInstitutions.find(i => i.id === value)?.name || value;
        return value;
    };
    
    const activeFiltersCount = Object.values(filters).reduce((acc, curr) => acc + curr.length, 0);

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
                        onClick={() => setIsFilterPanelOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mr-2"
                    >
                        <FunnelIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">Avancés</span>
                        {activeFiltersCount > 0 && (
                            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-xs font-bold text-blue-700 dark:text-blue-400">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

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
                    value={filters.institutionIds.length === 1 ? filters.institutionIds[0] : 'all'}
                    onChange={(event) => updateFilterSingle('institutionIds', event.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm"
                >
                    <option value="all">Toutes les écoles</option>
                    {uniqueInstitutions.map((inst) => (
                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                </select>

                <select
                    value={filters.programTypes.length === 1 ? filters.programTypes[0] : 'all'}
                    onChange={(event) => updateFilterSingle('programTypes', event.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm"
                >
                    <option value="all">Toutes les formations</option>
                    <option value="cycle_ingenieur">Cycle d'ingénieur</option>
                    <option value="master">Master</option>
                </select>

                <select
                    value={filters.admissionTypes.length === 1 ? filters.admissionTypes[0] : 'all'}
                    onChange={(event) => updateFilterSingle('admissionTypes', event.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm"
                >
                    <option value="all">Toutes les admissions</option>
                    <option value="sur_titre">Sur Titre</option>
                    <option value="sur_concours">Sur Concours</option>
                </select>

                <select
                    value={filters.statuses.length === 1 ? filters.statuses[0] : 'all'}
                    onChange={(event) => updateFilterSingle('statuses', event.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm"
                >
                    <option value="all">Tous les statuts</option>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>

                <select
                    value={filters.eventTypes.length === 1 ? filters.eventTypes[0] : 'all'}
                    onChange={(event) => updateFilterSingle('eventTypes', event.target.value)}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 shadow-sm"
                >
                    <option value="all">Toutes les dates</option>
                    {Object.entries(EVENT_TYPES).map(([value, info]) => (
                        <option key={value} value={value}>{info.label}</option>
                    ))}
                </select>
            </div>

            {activeFiltersCount > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                    {Object.entries(filters).map(([category, values]) => (
                        values.map(value => (
                            <span key={`${category}-${value}`} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                                {getFilterLabel(category, value)}
                                <button onClick={() => removeFilter(category, value)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </span>
                        ))
                    ))}
                    <button onClick={clearFilters} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline ml-2">
                        Tout effacer
                    </button>
                </div>
            )}

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
            {isFilterPanelOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsFilterPanelOpen(false)} />
                    <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                        <div className="w-screen max-w-md transform transition-transform">
                            <div className="flex h-full flex-col bg-white dark:bg-gray-800 shadow-xl">
                                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-6 py-4">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filtres</h2>
                                    <button
                                        onClick={() => setIsFilterPanelOpen(false)}
                                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 transition-colors"
                                    >
                                        <XMarkIcon className="h-6 w-6" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                    <div className="space-y-8">
                                        
                                        {/* Écoles */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Écoles</h3>
                                            <div className="relative mb-3">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Rechercher une école..."
                                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    value={schoolSearchQuery}
                                                    onChange={(e) => setSchoolSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                                {uniqueInstitutions
                                                    .filter(inst => inst.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()))
                                                    .map(inst => (
                                                        <label key={inst.id} className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-blue-500"
                                                                checked={filters.institutionIds.includes(inst.id)}
                                                                onChange={() => toggleFilter('institutionIds', inst.id)}
                                                            />
                                                            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{inst.name}</span>
                                                        </label>
                                                    ))}
                                            </div>
                                        </div>

                                        {/* Formations */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Formations</h3>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                                        checked={filters.programTypes.includes('cycle_ingenieur')}
                                                        onChange={() => toggleFilter('programTypes', 'cycle_ingenieur')} />
                                                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Cycle d'ingénieur</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                                        checked={filters.programTypes.includes('master')}
                                                        onChange={() => toggleFilter('programTypes', 'master')} />
                                                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Master</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Admissions */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Admissions</h3>
                                            <div className="space-y-2">
                                                <label className="flex items-center">
                                                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                                        checked={filters.admissionTypes.includes('sur_titre')}
                                                        onChange={() => toggleFilter('admissionTypes', 'sur_titre')} />
                                                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Sur Titre</span>
                                                </label>
                                                <label className="flex items-center">
                                                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                                        checked={filters.admissionTypes.includes('sur_concours')}
                                                        onChange={() => toggleFilter('admissionTypes', 'sur_concours')} />
                                                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Sur Concours</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Types d'événements */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Types d'événements</h3>
                                            <div className="space-y-2">
                                                {Object.entries(EVENT_TYPES).map(([value, info]) => (
                                                    <label key={value} className="flex items-center">
                                                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                                            checked={filters.eventTypes.includes(value)}
                                                            onChange={() => toggleFilter('eventTypes', value)} />
                                                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{info.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Statuts */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Statuts</h3>
                                            <div className="space-y-2">
                                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                                    <label key={value} className="flex items-center">
                                                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                                            checked={filters.statuses.includes(value)}
                                                            onChange={() => toggleFilter('statuses', value)} />
                                                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                                <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={clearFilters}
                                            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Tout effacer
                                        </button>
                                        <button
                                            onClick={() => setIsFilterPanelOpen(false)}
                                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            Afficher les résultats
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
