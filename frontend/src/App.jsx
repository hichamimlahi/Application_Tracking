import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ApplicationsProvider } from './contexts/ApplicationsContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Calendar from './pages/Calendar';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return <div className="flex h-screen items-center justify-center">Chargement...</div>;
    }
    
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    {/* Add Register Route here later if needed */}
                    
                    <Route path="/" element={
                        <ProtectedRoute>
                            <ApplicationsProvider>
                                <Layout />
                            </ApplicationsProvider>
                        </ProtectedRoute>
                    }>
                        <Route index element={<Dashboard />} />
                        <Route path="kanban" element={<Kanban />} />
                        <Route path="calendar" element={<Calendar />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
