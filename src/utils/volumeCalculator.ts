export type LengthUnit = "m" | "cm" | "in";

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: LengthUnit;
}

const CONVERSION_TO_METERS: Record<LengthUnit, number> = {
  m: 1,
  cm: 0.01,
  in: 0.0254,
};

/**
 * Calculate volume in CBM (cubic meters) from dimensions
 */
export function calculateCBM(dimensions: Dimensions): number {
  const { length, width, height, unit } = dimensions;

  // Validate inputs
  if (length <= 0 || width <= 0 || height <= 0) {
    return 0;
  }

  // Convert to meters
  const conversionFactor = CONVERSION_TO_METERS[unit];
  const lengthM = length * conversionFactor;
  const widthM = width * conversionFactor;
  const heightM = height * conversionFactor;

  // Calculate CBM
  const cbm = lengthM * widthM * heightM;

  // Round to 6 decimal places to support small packages (e.g. 1cm x 1cm x 1cm = 0.000001 CBM)
  return Math.round(cbm * 1000000) / 1000000;
}

/**
 * Get localized unit label
 */
export function getUnitLabel(
  unit: LengthUnit,
  t: (key: string) => string,
): string {
  const labels: Record<LengthUnit, string> = {
    m: t("calculator.units.meters"),
    cm: t("calculator.units.centimeters"),
    in: t("calculator.units.inches"),
  };
  return labels[unit];
}
