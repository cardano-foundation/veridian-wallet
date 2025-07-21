import { i18n } from "../../../../i18n";

export const reservedKeysFilter = (key: string) => {
  switch (key) {
    case "i":
      return i18n.t("tabs.credentials.details.attributes.issuee");
    case "dt":
      return i18n.t("tabs.credentials.details.attributes.issuancedate");
    case "LEI":
      return i18n.t("tabs.credentials.details.attributes.lei");
    case "s":
      return i18n.t("tabs.credentials.details.status.label");
    default:
      return key.replace(/([a-z])([A-Z])/g, "$1 $2");
  }
};
