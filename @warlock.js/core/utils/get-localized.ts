import { useRequestStore } from "../http/middleware/inject-request-context";

export type LocalizedObject = {
  localeCode: string;
  value: any;
};

/**
 * Get localized value based on the given locale code
 * If the locale code is not given and the function is called within a request context, it will get the current locale code
 */
export function getLocalized(
  values: LocalizedObject[],
  localeCode?: string,
  key = "value",
) {
  if (!values) return values;

  if (!localeCode) {
    localeCode = useRequestStore().request?.getLocaleCode();
  }

  if (Array.isArray(values)) {
    return values.find(value => value.localeCode === localeCode)?.[
      key as keyof LocalizedObject
    ];
  }

  return values;
}
