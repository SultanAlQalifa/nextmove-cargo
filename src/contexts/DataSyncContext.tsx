import React, { createContext, useContext, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

type SyncTable =
    | 'rfq_requests'
    | 'rfq_offers'
    | 'quote_requests'
    | 'quotes'
    | 'consolidations'
    | 'shipments'
    | 'transactions'
    | 'profiles'
    | 'wallets'
    | 'referrals'
    | 'testimonials'
    | 'faqs'
    | 'blog_posts'
    | 'fee_configs'
    | 'system_settings'
    | 'platform_settings'
    | 'coupons'
    | 'point_history';

interface DataSyncContextType {
    subscribe: (table: SyncTable, callback: () => void) => () => void;
}

const DataSyncContext = createContext<DataSyncContextType | undefined>(undefined);

export const DataSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, refreshProfile } = useAuth();

    const handlePayload = useCallback((payload: any, table: SyncTable) => {
        // console.log(`Realtime update on ${table}:`, payload);

        // Auto-refresh profile if it changes for the current user
        if (table === 'profiles' && payload.new?.id === user?.id) {
            refreshProfile();
        }

        const event = new CustomEvent(`nx:sync:${table}`, { detail: payload });
        window.dispatchEvent(event);

        // Also dispatch a global refresh event
        window.dispatchEvent(new CustomEvent('nx:sync:all', { detail: { table, payload } }));
    }, [user, refreshProfile]);

    useEffect(() => {
        if (!user) return;

        // We create one channel for all user-related changes
        // Filters are applied based on table relationships where possible
        // Note: Profiles, Transactions, Shipments, etc usually have a user_id or client_id

        const channel = supabase
            .channel('global-data-sync')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'rfq_requests' },
                (payload) => handlePayload(payload, 'rfq_requests')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'rfq_offers' },
                (payload) => handlePayload(payload, 'rfq_offers')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'quote_requests' },
                (payload) => handlePayload(payload, 'quote_requests')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'quotes' },
                (payload) => handlePayload(payload, 'quotes')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'consolidations' },
                (payload) => handlePayload(payload, 'consolidations')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'shipments' },
                (payload) => handlePayload(payload, 'shipments')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'transactions' },
                (payload) => handlePayload(payload, 'transactions')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                (payload) => handlePayload(payload, 'profiles')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'wallets' },
                (payload) => handlePayload(payload, 'wallets')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'referrals' },
                (payload) => handlePayload(payload, 'referrals')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'testimonials' },
                (payload) => handlePayload(payload, 'testimonials')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'faqs' },
                (payload) => handlePayload(payload, 'faqs')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'blog_posts' },
                (payload) => handlePayload(payload, 'blog_posts')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'fee_configs' },
                (payload) => handlePayload(payload, 'fee_configs')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'system_settings' },
                (payload) => handlePayload(payload, 'system_settings')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'coupons' },
                (payload) => handlePayload(payload, 'coupons')
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'point_history' },
                (payload) => handlePayload(payload, 'point_history')
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, handlePayload]);

    const subscribe = useCallback((table: SyncTable, callback: () => void) => {
        const handler = () => callback();
        const eventName = `nx:sync:${table}`;
        const globalEventName = 'nx:sync:all';

        window.addEventListener(eventName, handler);
        window.addEventListener(globalEventName, handler);

        return () => {
            window.removeEventListener(eventName, handler);
            window.removeEventListener(globalEventName, handler);
        };
    }, []);

    return (
        <DataSyncContext.Provider value={{ subscribe }}>
            {children}
        </DataSyncContext.Provider>
    );
};

export const useDataSync = (table?: SyncTable, onSync?: () => void) => {
    const context = useContext(DataSyncContext);
    if (!context) {
        throw new Error("useDataSync must be used within DataSyncProvider");
    }

    useEffect(() => {
        if (table && onSync) {
            return context.subscribe(table, onSync);
        }
    }, [table, onSync, context]);

    return context;
};
