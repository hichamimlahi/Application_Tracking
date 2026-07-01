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
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const EVENT_TYPES = {
    deadline: { label: 'Date limite', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
    exam: { label: 'Concours', color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    result: { label: 'Resultats', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
    other: { label: 'Autre date', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
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
            status: application.status,
        };

        if (application.deadline_date) {
            events.push({
                ...base,
                id: `${application.id}-deadline`,
                type: 'deadline',
                title: 'Date limite',
                date: application.deadline_date,
            });
        }

        const originalJson = parseOriginalJson(application.notes);

        DATE_KEYS.forEach(({ key, type, label }) => {
            const value = readNestedValue(originalJson, key);

            if (isIsoDate(value) && value !== application.deadline_date) {
                events.push({
                    ...base,
                    id: `${application.id}-${key}`,
                    type,
                    title: label,
                    date: value,
                });
            }
        });

        return events;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
};

const Calendar = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [filters, setFilters] = useState({
        programType: 'all',
        status: 'all',
        eventType: 'all',
    });

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
            if (filters.status !== 'all' && event.status !== filters.status) return false;
            if (filters.eventType !== 'all' && event.type !== filters.eventType) return false;
            return true;
        });
    }, [allEvents, filters]);

    const monthDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        return eachDayOfInterval({
            start: startOfWeek(monthStart, { weekStartsOn: 1 }),
            end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
        });
    }, [currentMonth]);

    const monthEvents = filteredEvents.filter((event) => isSameMonth(parseISO(event.date), currentMonth));
    const upcomingEvents = filteredEvents.filter((event) => parseISO(event.date) >= startOfMonth(currentMonth)).slice(0, 8);

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
                    <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
                    <p className="mt-1 text-sm text-gray-500">Toutes les dates importantes de vos candidatures.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-50"
                    >
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                        <CalendarDaysIcon className="h-5 w-5" />
                        Aujourd'hui
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm hover:bg-gray-50"
                    >
                        <ChevronRightIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select
                    value={filters.programType}
                    onChange={(event) => updateFilter('programType', event.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
                >
                    <option value="all">Toutes les formations</option>
                    <option value="cycle_ingenieur">Cycles d'ingenieur</option>
                    <option value="master">Masters</option>
                </select>

                <select
                    value={filters.status}
                    onChange={(event) => updateFilter('status', event.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
                >
                    <option value="all">Tous les statuts</option>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>

                <select
                    value={filters.eventType}
                    onChange={(event) => updateFilter('eventType', event.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
                >
                    <option value="all">Toutes les dates</option>
                    {Object.entries(EVENT_TYPES).map(([value, info]) => (
                        <option key={value} value={value}>{info.label}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-5 py-4">
                        <h2 className="text-lg font-semibold capitalize text-gray-900">
                            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                        </h2>
                    </div>

                    <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 text-center text-xs font-semibold uppercase text-gray-500">
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
                                    className={`min-h-[8rem] border-b border-r border-gray-100 p-2 ${
                                        isSameMonth(day, currentMonth) ? 'bg-white' : 'bg-gray-50 text-gray-400'
                                    }`}
                                >
                                    <div className="text-sm font-medium">{format(day, 'd')}</div>
                                    <div className="mt-2 space-y-1">
                                        {dayEvents.slice(0, 3).map((event) => (
                                            <div
                                                key={event.id}
                                                className={`truncate rounded-md border px-2 py-1 text-[11px] font-medium ${EVENT_TYPES[event.type].color}`}
                                                title={`${event.title} - ${event.institution?.acronym || event.institution?.name} - ${event.programName}`}
                                            >
                                                {event.institution?.acronym || event.institution?.name}: {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <div className="text-[11px] font-medium text-gray-500">+{dayEvents.length - 3} autres</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">Prochaines dates</h2>
                    <div className="mt-4 space-y-3">
                        {upcomingEvents.length === 0 ? (
                            <p className="text-sm text-gray-500">Aucune date avec ces filtres.</p>
                        ) : (
                            upcomingEvents.map((event) => (
                                <div key={event.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${EVENT_TYPES[event.type].color}`}>
                                            {EVENT_TYPES[event.type].label}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-600">
                                            {format(parseISO(event.date), 'dd MMM yyyy', { locale: fr })}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-gray-900">
                                        {event.institution?.acronym || event.institution?.name}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600">{event.programName}</p>
                                    <p className="mt-2 text-xs capitalize text-gray-500">
                                        {STATUS_LABELS[event.status] || event.status}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Calendar;
