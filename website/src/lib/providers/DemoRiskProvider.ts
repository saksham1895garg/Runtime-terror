import { generateRiskGrid } from '@/src/data/demo';

export class DemoRiskProvider {
  /**
   * Provides risk grid data, optionally masking raw model estimates and scores
   * depending on the role of the requester.
   */
  static async getGridData(isOfficerOrDev: boolean) {
    // Generate base demo data
    const baseGrid = generateRiskGrid(150);

    // If the requester is an officer or developer, return the full grid
    if (isOfficerOrDev) {
      return baseGrid;
    }

    // Mask the raw model data for public users
    const maskedGrid = {
      ...baseGrid,
      features: baseGrid.features.map((feature: any) => {
        const { modelEstimate, riskScore, explanation, confidence, ...safeProperties } = feature.properties;
        return {
          ...feature,
          properties: safeProperties,
        };
      }),
    };

    return maskedGrid;
  }
}
