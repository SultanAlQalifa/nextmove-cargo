import * as XLSX from "xlsx";

export const ExcelService = {
  downloadTemplate(type: "shipments" | "consolidations") {
    let headers: string[] = [];
    let example: any[] = [];
    let sheetName = "";

    if (type === "shipments") {
      headers = [
        "tracking_number",
        "origin_port",
        "origin_country",
        "destination_port",
        "destination_country",
        "carrier_name",
        "cargo_type",
        "cargo_weight",
        "cargo_volume",
        "cargo_packages",
        "departure_date",
        "arrival_estimated_date",
      ];
      example = [
        "TRK123456",
        "Shanghai",
        "China",
        "Dakar",
        "Senegal",
        "Maersk",
        "General",
        1500,
        12.5,
        50,
        "2025-01-01",
        "2025-02-15",
      ];
      sheetName = "Expéditions";
    } else {
      headers = [
        "type",
        "origin_port",
        "destination_port",
        "transport_mode",
        "departure_date",
        "arrival_date",
        "total_capacity_cbm",
        "price_per_cbm",
        "min_cbm",
        "status",
      ];
      example = [
        "sea",
        "Ningbo",
        "Abidjan",
        "Container",
        "2025-03-01",
        "2025-04-01",
        60,
        120,
        1,
        "planned",
      ];
      sheetName = "Groupages";
    }

    const data = [headers, example];

    // Add some empty rows for user convenience
    for (let i = 0; i < 10; i++) {
      data.push(Array(headers.length).fill(""));
    }

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    ws["!cols"] = headers.map(() => ({ wch: 20 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate base64 string to avoid Blob/ArrayBuffer ambiguities
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

    // Create Data URI
    const uri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wbout}`;

    // Manual download trigger
    const link = document.createElement("a");
    link.href = uri;
    link.download = `modele_import_${type}_${new Date().toISOString().split("T")[0]}.xlsx`;

    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  },

  async parseFile(file: File): Promise<any[]> {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      throw new Error("Format de fichier invalide. Utilisez .xlsx ou .xls");
    }

    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, {
      type: "array",
      cellDates: true,
    });

    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(ws, {
      header: 0, // Use first row as keys
      defval: "", // Default value for empty cells
      blankrows: false,
    });

    if (jsonData.length === 0) {
      throw new Error("Le fichier est vide ou mal formaté");
    }

    return jsonData;
  },
};
