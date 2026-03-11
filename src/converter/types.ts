export interface ConvertOptions {
  /** Manual prefix to strip (auto-detected if omitted) */
  prefix?: string;
}

/** Input format: flat categories with string key-value pairs */
export interface FlatTokenFile {
  [category: string]: {
    [key: string]: string;
  };
}
