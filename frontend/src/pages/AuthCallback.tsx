import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../services/api';
import emailService from '../services/emailService';
import ConsentModal from '../components/ConsentModal';

const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [showConsent, setShowConsent] = useState(false);
    const [error, setError] = useState('');
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');
        const needsConsent = searchParams.get('needs_consent') === 'true';
        const errorParam = searchParams.get('error');

        if (errorParam) {
            navigate(`/login?error=${errorParam}`);
            return;
        }

        if (token) {
            api.setToken(token);
            emailService.setToken(token);

            if (needsConsent) {
                setShowConsent(true);
            } else {
                // Check if we need to sync emails
                const dateRange = sessionStorage.getItem('email_date_range') || '30_days';
                handleEmailSync(dateRange as any);
            }
        } else {
            navigate('/login?error=no_token');
        }
    }, [searchParams, navigate]);

    const handleEmailSync = async (dateRange: '30_days' | '60_days' | '90_days' | '1_year') => {
        setSyncing(true);
        try {
            const result = await emailService.syncEmailsWithRange(dateRange, 100);
            sessionStorage.removeItem('email_date_range');

            // Show success and redirect
            navigate('/', {
                state: {
                    message: `Successfully synced ${result.transactions_found} transactions!`,
                    type: 'success'
                }
            });
        } catch (err) {
            console.error('Email sync failed:', err);
            setError('Failed to sync emails. You can try again later.');
            setSyncing(false);
        }
    };

    const handleConsentSuccess = () => {
        // After consent, check if we need to sync emails
        const dateRange = sessionStorage.getItem('email_date_range') || '30_days';
        handleEmailSync(dateRange as any);
    };

    if (showConsent) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <ConsentModal isOpen={true} onSuccess={handleConsentSuccess} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">
                {syncing ? 'Syncing your emails...' : 'Completing authentication...'}
            </p>
            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
    );
};

export default AuthCallback;
