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
        } catch (error: any) {
            console.warn('Erreur native de scan Bluetooth:', error);

            // Tentative d'utilisation de l'API Web Bluetooth si disponible
            try {
                if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
                    const device = await (navigator as any).bluetooth.requestDevice({
                        // Ne pas utiliser acceptAllDevices, filtrer plutôt par nom ou service pour éviter les téléphones/AirPods
                        filters: [
                            { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Service ESC/POS classique
                            { namePrefix: 'Printer' },
                            { namePrefix: 'MTP' },
                            { namePrefix: 'PT' },
                            { namePrefix: 'POS' },
                            { namePrefix: 'BlueTooth Printer' }
                        ],
                        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
                    });
                    if (device) {
                        return [{ name: device.name || 'Imprimante Web BT', address: 'web-bt-mock-address' }];
                    }
                }
            } catch (webErr) {
                console.log('Web Bluetooth annulé ou indisponible:', webErr);
            }

            // Fallback pour le développement Web si l'API native échoue
            if (error?.message?.includes('Not implemented on web')) {
                return [{ name: "Simulateur Imprimante (Démo Web)", address: "mock-web-printer" }];
            }
            return [];
        }
    },

    /**
     * Connects to a specific printer
     */
    connect: async (address: string): Promise<boolean> => {
        try {
            if (address === 'mock-web-printer' || address === 'web-bt-mock-address') {
                localStorage.setItem('last_printer_address', address);
                return true;
            }
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
     * Prints a test ticket to verify connection
     */
    printTest: async (): Promise<void> => {
        const isConnected = await printService.isConnected();
        if (!isConnected) {
            const lastAddress = localStorage.getItem('last_printer_address');
            if (lastAddress) {
                await printService.connect(lastAddress);
            } else {
                throw new Error('Aucune imprimante connectée');
            }
        }

        const ESC = '\x1B';
        const GS = '\x1D';
        const INIT = ESC + '@';
        const CENTER = ESC + 'a' + '\x01';
        const BOLD_ON = ESC + 'E' + '\x01';
        const BOLD_OFF = ESC + 'E' + '\x00';
        const DOUBLE_SIZE = ESC + '!' + '\x30';
        const NORMAL_SIZE = ESC + '!' + '\x00';

        let commands = INIT + CENTER;
        commands += BOLD_ON + DOUBLE_SIZE + "NEXTMOVE CARGO\n" + NORMAL_SIZE + BOLD_OFF;
        commands += "--------------------------------\n";
        commands += BOLD_ON + "TEST D'IMPRESSION REUSSI\n" + BOLD_OFF;
        commands += "Date: " + new Date().toLocaleString() + "\n";
        commands += "Bluetooth Printer 80mm\n";
        commands += "--------------------------------\n";
        commands += "\n\n\n\n";
        commands += GS + 'V' + '\x41' + '\x03'; // Cut paper

        try {
            const lastAddress = localStorage.getItem('last_printer_address');
            if (lastAddress === 'mock-web-printer' || lastAddress === 'web-bt-mock-address') {
                console.log("%c[Imprimante Web] Test d'impression reçu :\n", "color: #0ea5e9; font-weight: bold", commands);
                return;
            }
            await BluetoothPrinter.print({ data: commands });
        } catch (error) {
            console.error('Test print failed:', error);
            throw error;
        }
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
            const lastAddress = localStorage.getItem('last_printer_address');
            if (lastAddress === 'mock-web-printer' || lastAddress === 'web-bt-mock-address') {
                console.log("%c[Imprimante Web] Impression Reçu expédition :\n", "color: #0ea5e9; font-weight: bold", commands);
                return;
            }
            await BluetoothPrinter.print({ data: commands });
        } catch (error) {
            console.warn('Printing failed:', error);
            // Don't throw the error upwards to prevent unhandled rejections blocking the UI
            // just log it. The UI isn't strictly depending on successful print.
        }
    },

    /**
     * Formats and prints a Z-Report (closing report)
     */
    printZReport: async (report: any): Promise<void> => {
        try {
            const isConnected = await printService.isConnected();
            if (!isConnected) {
                const lastAddress = localStorage.getItem('last_printer_address');
                if (lastAddress) {
                    await printService.connect(lastAddress);
                } else {
                    console.warn('Aucune imprimante configurée, impression du Z-Report ignorée.');
                    return; // Fail gracefully instead of throwing unhandled error if not mandatory
                }
            }
        } catch (err) {
            console.warn('Erreur de connexion imprimante pour Z-Report:', err);
            return; // Ignore printer errors to not block the Z-report UI
        }

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
        commands += BOLD_ON + DOUBLE_SIZE + "Z-REPORT\n" + NORMAL_SIZE + BOLD_OFF;
        commands += "Rapport de Cloture de Caisse\n";
        commands += "--------------------------------\n\n";

        // Info
        commands += LEFT;
        commands += "Date: " + new Date().toLocaleDateString() + "\n";
        commands += "Agent: " + (report.agent?.full_name || 'Inconnu') + "\n";
        commands += "Session ID: " + report.id.substring(0, 8) + "\n";
        commands += "--------------------------------\n";

        // Finances
        commands += "Fonds Initial:  " + report.totals.initial.toLocaleString() + " F\n";
        commands += "Ventes:        +" + report.totals.sales.toLocaleString() + " F\n";
        commands += "Entrees Man:   +" + report.totals.cashIn.toLocaleString() + " F\n";
        commands += "Sorties (Dep): -" + report.totals.cashOut.toLocaleString() + " F\n";
        commands += "--------------------------------\n";

        commands += BOLD_ON + "ATTENDU:        " + report.totals.expected.toLocaleString() + " F\n" + BOLD_OFF;
        commands += BOLD_ON + "COMPTE:         " + report.totals.counted.toLocaleString() + " F\n" + BOLD_OFF;
        commands += "--------------------------------\n";

        const diff = report.totals.difference;
        commands += (diff >= 0 ? "SURPLUS" : "MANQUANT") + ":     " + diff.toLocaleString() + " F\n";

        // Footer
        commands += CENTER;
        commands += "\nSignature Agent:\n\n\n";
        commands += "--------------------------------\n\n";

        commands += "\n\n\n\n";
        commands += GS + 'V' + '\x41' + '\x03'; // Cut paper

        try {
            const lastAddress = localStorage.getItem('last_printer_address');
            if (lastAddress === 'mock-web-printer' || lastAddress === 'web-bt-mock-address') {
                console.log("%c[Imprimante Web] Impression Z-Report :\n", "color: #0ea5e9; font-weight: bold", commands);
                return;
            }
            await BluetoothPrinter.print({ data: commands });
        } catch (error) {
            console.error('Printing Z-Report failed:', error);
            throw error;
        }
    }
};

function RIGHT_ALIGN() {
    return '\x1B' + 'a' + '\x02';
}
