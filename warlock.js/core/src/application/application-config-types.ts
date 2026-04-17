export type AppConfigurations = {
  /**
   * App name
   */
  appName?: string;
  /**
   * Default locale code
   *
   * @default en
   */
  localeCode?: string;
  /**
   * Application base URL
   *
   * @default localhost:
   */
  baseUrl?: string;
  /**
   * Application timezone
   */
  timezone?: string;
  /**
   * Locale Codes list
   */
  localeCodes?: string[];
};
