import { mockWarnings } from '@/src/data/demo';

export class DemoGovernmentWarningProvider {
  static async getWarnings() {
    return mockWarnings;
  }
}
