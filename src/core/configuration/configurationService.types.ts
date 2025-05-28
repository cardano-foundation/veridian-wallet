interface KeriaConfig {
  url?: string;
  bootUrl?: string;
}

enum OptionalFeature {
  ConnectWallet = "CONNECT_WALLET",
}

enum IndividualOnlyMode {
  FirstTime = "FirstTime",
  Always = "Always",
}

interface IdentifiersConfig {
  creation?: {
    individualOnly?: IndividualOnlyMode;
    defaultName?: string;
  };
}

interface NotificationsConfig {
  connectInstructions?: {
    connectionName: string;
  };
}

interface AppFeaturesConfig {
  cut: OptionalFeature[];
  customise?: {
    identifiers?: IdentifiersConfig;
    notifications?: NotificationsConfig;
  };
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
  features: AppFeaturesConfig;
}

export { IndividualOnlyMode, OptionalFeature };
export type { Configuration };
