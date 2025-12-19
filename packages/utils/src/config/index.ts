export class ConfigService {
  private static instance: ConfigService;

  private constructor() {
    // No longer caching process.env to avoid initialization order issues
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public get(key: string, defaultValue?: string): string {
    // Always read directly from process.env to ensure we get the latest values
    // populated by dotenv, even if dotenv runs after this module is imported.
    const value = process.env[key] || defaultValue;
    if (value === undefined) {
      throw new Error(`Configuration error: ${key} is missing`);
    }
    return value;
  }

  public getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key, defaultValue?.toString());
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Configuration error: ${key} is not a number`);
    }
    return parsed;
  }

  public getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key, defaultValue?.toString());
    return value === 'true' || value === '1';
  }

  /**
   * Retrieves a secret value. 
   * In a real implementation, this might fetch from a Secret Manager (Vault, AWS Secrets Manager).
   * For now, it wraps process.env but marks the intent.
   */
  public getSecret(key: string): string {
    const value = this.get(key);
    if (!value || value.trim() === '') {
       throw new Error(`Security Alert: Secret ${key} is empty!`);
    }
    return value;
  }
}

export const config = ConfigService.getInstance();
