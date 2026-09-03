import { mockRainfall } from '@/src/data/demo';

export class DemoRainfallProvider {
  static async getRainfallObservations() {
    return mockRainfall;
  }
}
