import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { HomeIcon, ViewColumnsIcon, ArrowRightOnRectangleIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, PlusIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import JsonApplicationImport from './JsonApplicationImport';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [showJsonImport, setShowJsonImport] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    React.useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Tableau de bord', href: '/', icon: HomeIcon },
        { name: 'Kanban Candidatures', href: '/kanban', icon: ViewColumnsIcon },
        { name: 'Calendrier', href: '/calendar', icon: CalendarDaysIcon },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-200">
            {/* Sidebar */}
            <div className={`${collapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 shadow-lg flex flex-col relative`}>
                
                {/* Toggle Button */}
                <button 
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 z-10 text-gray-500 dark:text-gray-400"
                >
                    {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
                </button>

                <div className={`p-6 border-b border-gray-100 dark:border-gray-700 flex items-center ${collapsed ? 'justify-center px-0' : 'justify-center'}`}>
                    <h1 className={`font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent transition-all ${collapsed ? 'text-xl' : 'text-2xl'}`}>
                        {collapsed ? 'TA' : 'Traking App'}
                    </h1>
                </div>
                
                <div className="flex-1 overflow-y-auto py-4 overflow-x-hidden">
                    <nav className={`px-4 space-y-2 ${collapsed ? 'px-2' : ''}`}>
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    title={collapsed ? item.name : ''}
                                    className={`flex items-center py-3 text-sm font-medium rounded-xl transition-all duration-200 ${collapsed ? 'justify-center px-0' : 'px-4'} ${
                                        isActive
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <item.icon className={`${collapsed ? 'mx-0' : 'mr-3'} h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                                    {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className={`p-4 border-t border-gray-100 dark:border-gray-700 ${collapsed ? 'px-2' : ''}`}>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        title={collapsed ? (isDarkMode ? "Mode Clair" : "Mode Sombre") : ""}
                        className={`w-full flex items-center mb-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 ${collapsed ? 'justify-center px-0' : 'px-4'}`}
                    >
                        {isDarkMode ? (
                            <SunIcon className={`${collapsed ? 'mx-0' : 'mr-3'} h-5 w-5 flex-shrink-0 text-yellow-500`} />
                        ) : (
                            <MoonIcon className={`${collapsed ? 'mx-0' : 'mr-3'} h-5 w-5 flex-shrink-0 text-gray-500`} />
                        )}
                        {!collapsed && <span className="whitespace-nowrap">{isDarkMode ? 'Mode Clair' : 'Mode Sombre'}</span>}
                    </button>

                    <button
                        onClick={() => setShowJsonImport(true)}
                        title={collapsed ? "Importer JSON" : ""}
                        className={`w-full flex items-center mb-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 bg-blue-50/50 text-blue-700 border border-blue-100 hover:bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50 dark:hover:bg-blue-900/50 ${collapsed ? 'justify-center px-0' : 'px-4'}`}
                    >
                        <PlusIcon className={`${collapsed ? 'mx-0' : 'mr-3'} h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400`} />
                        {!collapsed && <span className="whitespace-nowrap">Importer JSON</span>}
                    </button>

                    {!collapsed ? (
                        <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-4">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3 truncate">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center mb-4">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg" title={user?.name}>
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        title={collapsed ? "Déconnexion" : ""}
                        className={`flex items-center justify-center py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 ${collapsed ? 'px-0 w-full' : 'px-4 w-full'}`}
                    >
                        <ArrowRightOnRectangleIcon className={`w-5 h-5 flex-shrink-0 ${collapsed ? 'mr-0' : 'mr-2'}`} />
                        {!collapsed && <span>Déconnexion</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full bg-gray-50 dark:bg-gray-900">
                <main className="flex-1 overflow-x-hidden overflow-y-auto w-full p-8">
                    <Outlet />
                </main>
            </div>

            {showJsonImport && (
                <JsonApplicationImport
                    onClose={() => setShowJsonImport(false)}
                    onSuccess={() => { setShowJsonImport(false); window.location.reload(); }}
                />
            )}
        </div>
    );
};

export default Layout;
