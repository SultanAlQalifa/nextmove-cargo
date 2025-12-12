import AddressManager from "../../../components/forwarder/AddressManager";
import PageHeader from "../../../components/common/PageHeader";

export default function ForwarderAddresses() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Entrepôts & Adresses"
                subtitle="Gérez vos points de collecte (origine) et de retrait (destination)."
            />
            <AddressManager />
        </div>
    );
}
