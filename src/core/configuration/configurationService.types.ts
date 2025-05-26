interface KeriaConfig {
  url?: string;
  bootUrl?: string;
}

enum OptionalFeature {
  ConnectWallet = "CONNECT_WALLET",
}

enum CustomContent {
  Intro = "INTRO",
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
  customContent: CustomContent[];
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

export type { Configuration };
export { OptionalFeature, CustomContent, IndividualOnlyMode };
