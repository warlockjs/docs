import { AppConfigurations } from "../utils/types";
import { configSpecialHandlers } from "./config-special-handlers";

/**
 * App Config Handler
 * Handles locale loading for dayjs
 */
export const registerAppConfig = async (config: AppConfigurations) => {
  // Load dayjs locales based on app.localeCodes
  const locales = config.locales || ["en"];

  for (const locale of locales) {
    if (locale === "en") continue; // English is default

    try {
      await import(`dayjs/locale/${locale}.js`);
    } catch (error) {
      console.warn(`   ⚠️  Failed to load dayjs locale: ${locale}`);
    }
  }
};

configSpecialHandlers.register("app", registerAppConfig);
