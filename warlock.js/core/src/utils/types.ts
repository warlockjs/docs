export type AppConfigurations = {
  /**
   * Set default timezone
   */
  timezone: string;
  /**
   * Set base url
   */
  baseUrl: string;
  /**
   * Default locale code
   *
   * @default en
   */
  localeCode?: string;
  /**
   * List of allowed locale codes in the app
   */
  locales?: string[];
};

export type Preload = "database" | "cache" | "http" | "watch";
