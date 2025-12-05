// ═══════════════════════════════════════════════════════════════
// NextMove Cargo - Client RFQ Page
// Page wrapper for RFQ list in client dashboard
// ═══════════════════════════════════════════════════════════════

import ClientRFQList from '../../components/rfq/ClientRFQList';

export default function ClientRFQPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ClientRFQList />
        </div>
    );
}
