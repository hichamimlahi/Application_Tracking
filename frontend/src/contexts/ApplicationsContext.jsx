import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../lib/axios';
import { useAuth } from './AuthContext';

const ApplicationsContext = createContext();

export const useApplications = () => useContext(ApplicationsContext);

export const ApplicationsProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/applications');
            setApplications(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch applications', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch applications automatically when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchApplications();
        } else {
            setApplications([]);
        }
    }, [isAuthenticated]);

    return (
        <ApplicationsContext.Provider
            value={{
                applications,
                setApplications,
                loading,
                fetchApplications,
            }}
        >
            {children}
        </ApplicationsContext.Provider>
    );
};
