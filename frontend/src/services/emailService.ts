/**
 * Email Service - Handle Gmail integration and transaction sync
 */

import { encryptPassword } from '../utils/crypto';

const API_BASE_URL = 'http://127.0.0.1:8000';

export type DateRangeOption = '30_days' | '60_days' | '90_days' | '1_year';

interface EmailSyncResponse {
    status: string;
    emails_processed: number;
    transactions_found: number;
    duplicates_skipped?: number;
    message: string;
}

interface EmailStatusResponse {
    last_sync: string | null;
    total_emails_synced: number;
    total_transactions: number;
    sync_in_progress: boolean;
}

class EmailService {
    private baseUrl: string;
    private token: string | null = null;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    private async request<T>(endpoint: string, options: {
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        body?: Record<string, unknown>;
        headers?: Record<string, string>;
    } = {}): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config: RequestInit = {
            method: options.method || 'GET',
            headers,
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, config);

        if (!response.ok) {
            if (response.status === 401) {
                this.setToken(null);
                window.location.href = '/login';
            }
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Sync emails from Gmail with specified date range
     * Called after OAuth callback when user has connected their Gmail
     */
    async syncEmailsWithRange(
        dateRange: DateRangeOption = '30_days',
        maxEmails: number = 100
    ): Promise<EmailSyncResponse> {
        try {
            return await this.request<EmailSyncResponse>('/api/email/sync-with-range', {
                method: 'POST',
                body: {
                    date_range: dateRange,
                    max_emails: maxEmails
                }
            });
        } catch (error) {
            console.error('Email sync failed:', error);
            throw error;
        }
    }

    /**
     * Get email sync status for current user
     */
    async getEmailSyncStatus(): Promise<EmailStatusResponse> {
        try {
            return await this.request<EmailStatusResponse>('/api/email/status');
        } catch (error) {
            console.error('Failed to get email status:', error);
            throw error;
        }
    }

    /**
     * Preview recent email transactions
     */
    async previewEmailTransactions(limit: number = 10) {
        try {
            return await this.request<{
                total_emails: number;
                transactions: Array<{
                    email_id: string;
                    date: string;
                    amount: number;
                    trans_type: string;
                    merchant: string;
                    category: string | null;
                    category_confidence: number;
                }>;
            }>(`/api/email/preview?limit=${limit}`);
        } catch (error) {
            console.error('Failed to preview emails:', error);
            throw error;
        }
    }
}

export const emailService = new EmailService(API_BASE_URL);
export default emailService;
