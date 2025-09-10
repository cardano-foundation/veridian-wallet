interface BiometryInfo {
  isAvailable: boolean;
  biometricsType: number;
  biometricsTypes: number[];
  deviceIsSecure: boolean;
  reason: string;
  code: string;
}

export type { BiometryInfo };
