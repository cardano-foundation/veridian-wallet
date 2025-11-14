interface KeriaConfig {
  url?: string;
  bootUrl?: string;
}

interface Configuration {
  keri: {
    keria?: KeriaConfig;
  };
  security: {
    rasp: {
      enabled: boolean;
    };
  };
}

export type { Configuration };
