import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Forwarder {
    id: string;
    email: string;
    full_name: string;
    company_name: string;
    forwarder_details: {
        verified: boolean;
        subscription_status: string;
    }[];
}

export default function AdminForwarderList() {
    const [forwarders, setForwarders] = useState<Forwarder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadForwarders();
    }, []);

    const loadForwarders = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
        id, email, full_name, company_name,
        forwarder_details ( verified, subscription_status )
      `)
            .eq('role', 'forwarder');

        if (error) console.error('Error loading forwarders:', error);
        else setForwarders(data as any);
        setLoading(false);
    };

    const toggleVerification = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('forwarder_details')
            .update({ verified: !currentStatus })
            .eq('profile_id', id);

        if (error) console.error('Error updating verification:', error);
        else loadForwarders();
    };

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Forwarder Management</h3>
            </div>
            <div className="border-t border-gray-200">
                <ul role="list" className="divide-y divide-gray-200">
                    {forwarders.map((forwarder) => {
                        const details = forwarder.forwarder_details[0] || { verified: false, subscription_status: 'inactive' };
                        return (
                            <li key={forwarder.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-primary truncate">{forwarder.company_name || forwarder.email}</p>
                                    <p className="text-sm text-gray-500">{forwarder.full_name}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${details.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {details.verified ? 'Verified' : 'Unverified'}
                                    </span>
                                    <button
                                        onClick={() => toggleVerification(forwarder.id, details.verified)}
                                        className="text-sm text-indigo-600 hover:text-indigo-900"
                                    >
                                        {details.verified ? 'Revoke' : 'Verify'}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
