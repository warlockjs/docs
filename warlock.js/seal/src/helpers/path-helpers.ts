/**
 * Set the key path for nested validation
 */
export const setKeyPath = (path: string, key: string): string => {
  if (!path) return key;
  return `${path}.${key}`;
};
