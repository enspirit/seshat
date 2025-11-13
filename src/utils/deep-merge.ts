export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const deepMerge = <T>(defaultConfig: T, userConfig?: DeepPartial<T>): T => {
  if (!userConfig) return defaultConfig;
  const result: any = { ...defaultConfig };

  for (const key in userConfig) {
    if (
      userConfig[key] &&
      typeof userConfig[key] === 'object' &&
      !Array.isArray(userConfig[key])
    ) {
      result[key] = deepMerge(defaultConfig[key], userConfig[key] as any);
    } else if (userConfig[key] !== undefined) {
      result[key] = userConfig[key];
    }
  }

  return result;
};
