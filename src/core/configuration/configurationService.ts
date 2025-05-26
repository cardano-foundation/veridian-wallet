import {
  Configuration,
  IndividualOnlyMode,
  OptionalFeature,
} from "./configurationService.types";
// eslint-disable-next-line no-undef

const environment = process.env.ENVIRONMENT || "local";
const keriaIP = process.env.KERIA_IP;

class ConfigurationService {
  private static configurationEnv: Configuration;

  static readonly INVALID_ENVIRONMENT_FILE = "Configuration file is invalid: ";
  static readonly CANNOT_LOAD_ENVIRONMENT_FILE =
    "Can not load environment file";

  async start() {
    await new Promise((rs, rj) => {
      import(`../../../configs/${environment}.yaml`)
        .then((module) => {
          const data = module.default;

          const validyCheck = this.configurationValid(data);
          if (validyCheck.success) {
            ConfigurationService.configurationEnv = data as Configuration;
            this.setKeriaIp();
          } else {
            rj(
              new Error(
                ConfigurationService.INVALID_ENVIRONMENT_FILE +
                  validyCheck.reason
              )
            );
          }

          rs(true);
        })
        .catch((e) => {
          rj(
            new Error(ConfigurationService.CANNOT_LOAD_ENVIRONMENT_FILE, {
              cause: e,
            })
          );
        });
    });
  }

  static get env() {
    return this.configurationEnv;
  }

  private setKeriaIp() {
    const keriaUrl = ConfigurationService.configurationEnv.keri?.keria?.url;
    const keriaBootUrl =
      ConfigurationService.configurationEnv.keri?.keria?.bootUrl;
    if (keriaIP && ConfigurationService.configurationEnv.keri?.keria?.url) {
      ConfigurationService.configurationEnv.keri.keria.url = keriaUrl?.replace(
        /\/\/[^:]+/,
        `//${keriaIP}`
      );
    }
    if (keriaIP && ConfigurationService.configurationEnv.keri?.keria?.bootUrl) {
      ConfigurationService.configurationEnv.keri.keria.bootUrl =
        keriaBootUrl?.replace(/\/\/[^:]+/, `//${keriaIP}`);
    }
  }

  private configurationValid(
    data: Configuration
  ): { success: true } | { success: false; reason: string } {
    const keri = data.keri;
    if (typeof keri !== "object") {
      return this.invalid("Missing top-level KERI object");
    }

    const security = data.security;
    if (typeof security !== "object" || security === null) {
      return this.invalid("Missing top-level security object");
    }

    const rasp = security.rasp;
    if (typeof rasp !== "object" || rasp === null) {
      return this.invalid("Missing rasp object in security configuration");
    }

    if (typeof rasp.enabled !== "boolean") {
      return this.invalid("rasp.enabled must be a boolean value");
    }

    const { features } = data;
    if (typeof features !== "object") {
      return this.invalid("features must be an object");
    }

    const { cut, customise } = features;
    if (!Array.isArray(cut)) {
      return this.invalid("features.cut must be a array");
    }

    for (const feature of cut) {
      if (!Object.values(OptionalFeature).includes(feature)) {
        return this.invalid("Invalid features.cut value");
      }
    }

    if (customise) {
      const { identifiers, notifications } = customise;
      if (identifiers?.creation?.individualOnly) {
        if (
          !Object.values(IndividualOnlyMode).includes(
            identifiers.creation.individualOnly
          )
        ) {
          return this.invalid(
            "Invalid features.customise.identifiers.creation value"
          );
        }
      }

      if (notifications?.connectInstructions) {
        if (
          typeof notifications?.connectInstructions.connectionName !== "string"
        ) {
          return this.invalid(
            "Invalid customise.notifications.connectinstructions.connectionName value"
          );
        }
      }
    }

    return { success: true };
  }

  private invalid(reason: string) {
    return { success: false, reason };
  }
}

export { ConfigurationService };
