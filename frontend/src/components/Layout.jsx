import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { HomeIcon, ViewColumnsIcon, ArrowRightOnRectangleIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

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
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <div className={`${collapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out bg-white shadow-lg flex flex-col relative`}>
                
                {/* Toggle Button */}
                <button 
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 z-10 text-gray-500"
                >
                    {collapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
                </button>

                <div className={`p-6 border-b border-gray-100 flex items-center ${collapsed ? 'justify-center px-0' : 'justify-center'}`}>
                    <h1 className={`font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent transition-all ${collapsed ? 'text-xl' : 'text-2xl'}`}>
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
                                            ? 'bg-blue-50 text-blue-700 shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <item.icon className={`${collapsed ? 'mx-0' : 'mr-3'} h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                                    {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className={`p-4 border-t border-gray-100 ${collapsed ? 'px-2' : ''}`}>
                    {!collapsed ? (
                        <div className="flex items-center p-4 bg-gray-50 rounded-xl mb-4">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3 truncate">
                                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center mb-4">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg" title={user?.name}>
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        title={collapsed ? "Déconnexion" : ""}
                        className={`flex items-center justify-center py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors ${collapsed ? 'px-0 w-full' : 'px-4 w-full'}`}
                    >
                        <ArrowRightOnRectangleIcon className={`w-5 h-5 flex-shrink-0 ${collapsed ? 'mr-0' : 'mr-2'}`} />
                        {!collapsed && <span>Déconnexion</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-8 w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
