import { BluetoothPrinter } from '@kduma-autoid/capacitor-bluetooth-printer';

export interface PrinterDevice {
    name: string;
    address: string;
}

export const printService = {
    /**
     * Scans for available Bluetooth printers
     */
    scan: async (): Promise<PrinterDevice[]> => {
        try {
            const { devices } = await BluetoothPrinter.list();
            return devices.map((d: any) => ({
                name: d.name || 'Imprimante Inconnue',
                address: d.address
            }));
        } catch (error) {
            console.error('Error scanning printers:', error);
            return [];
        }
    },

    /**
     * Connects to a specific printer
     */
    connect: async (address: string): Promise<boolean> => {
        try {
            await BluetoothPrinter.connect({ address });
            localStorage.setItem('last_printer_address', address);
            return true;
        } catch (error) {
            console.error('Connection failed:', error);
            return false;
        }
    },

    /**
     * Disconnects from the current printer
     */
    disconnect: async (): Promise<void> => {
        try {
            await BluetoothPrinter.disconnect();
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    },

    /**
     * Checks if a printer is connected (Simplification if plugin method is missing)
     */
    isConnected: async (): Promise<boolean> => {
        const lastAddress = localStorage.getItem('last_printer_address');
        return !!lastAddress;
    },

    /**
     * Formats and prints a shipment receipt
     */
    printShipment: async (shipment: any): Promise<void> => {
        const isConnected = await printService.isConnected();
        if (!isConnected) {
            const lastAddress = localStorage.getItem('last_printer_address');
            if (lastAddress) {
                await printService.connect(lastAddress);
            } else {
                throw new Error('Aucune imprimante connectée');
            }
        }

        // ESC/POS Commands
        const ESC = '\x1B';
        const GS = '\x1D';
        const INIT = ESC + '@';
        const CENTER = ESC + 'a' + '\x01';
        const LEFT = ESC + 'a' + '\x00';
        const BOLD_ON = ESC + 'E' + '\x01';
        const BOLD_OFF = ESC + 'E' + '\x00';
        const DOUBLE_SIZE = ESC + '!' + '\x30';
        const NORMAL_SIZE = ESC + '!' + '\x00';

        let commands = '';

        // Header
        commands += INIT;
        commands += CENTER;
        commands += BOLD_ON + DOUBLE_SIZE + "NEXTMOVE CARGO\n" + NORMAL_SIZE + BOLD_OFF;
        commands += "Logistique Express Chine-Senegal\n";
        commands += "--------------------------------\n\n";

        // Shipment Info
        commands += LEFT;
        commands += BOLD_ON + "TRACKING: " + shipment.tracking_number + BOLD_OFF + "\n";
        commands += "Date: " + new Date().toLocaleDateString() + "\n";
        commands += "Client: " + (shipment.client?.full_name || 'Client Passager') + "\n";
        commands += "--------------------------------\n";

        // Details
        const transport = shipment.transport_mode === 'sea' ? 'Maritime' : 'Aérien';
        const service = shipment.service_type === 'express' ? 'EXPRESS' : 'STANDARD';

        commands += "Mode: " + transport + " (" + service + ")\n";
        commands += "Poids: " + (shipment.cargo_weight || 0) + " KG\n";
        commands += "Volume: " + (shipment.cargo_volume || 0) + " CBM\n";
        commands += "Colis: x" + (shipment.cargo_packages || 1) + "\n";
        commands += "--------------------------------\n";

        // Total
        commands += RIGHT_ALIGN(); // Custom helper or center for simple receipts
        commands += CENTER;
        commands += BOLD_ON + "TOTAL: " + shipment.price.toLocaleString() + " XOF" + BOLD_OFF + "\n\n";

        // Footer
        commands += CENTER;
        commands += "Merci de votre confiance !\n";
        commands += "www.nextmovecargo.com\n\n";

        // Cut and Feed
        commands += "\n\n\n\n";
        commands += GS + 'V' + '\x41' + '\x03'; // Cut paper

        try {
            await BluetoothPrinter.print({ data: commands });
        } catch (error) {
            console.error('Printing failed:', error);
            throw error;
        }
    }
};

function RIGHT_ALIGN() {
    return '\x1B' + 'a' + '\x02';
}
