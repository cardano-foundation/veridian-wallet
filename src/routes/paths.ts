enum RoutePath {
  ROOT = "/",
  ONBOARDING = "/onboarding",
  SET_PASSCODE = "/setpasscode",
  GENERATE_SEED_PHRASE = "/generateseedphrase",
  VERIFY_SEED_PHRASE = "/verifyseedphrase",
  TABS_MENU = "/tabs",
  CREATE_PASSWORD = "/createpassword",
  SSI_AGENT = "/ssiagent",
  CONNECTION_DETAILS = "/connectiondetails",
  VERIFY_RECOVERY_SEED_PHRASE = "/verifyrecoveryseedphrase",
  SETUP_BIOMETRICS = "/setup-biometrics",
  PROFILE_SETUP = "/profile-setup",
  GROUP_PROFILE_SETUP = "/group-profile-setup/:id",
}

enum TabsRoutePath {
  ROOT = "/tabs",
  CREDENTIALS = "/tabs/credentials",
  CONNECTIONS = "/tabs/connections",
  NOTIFICATIONS = "/tabs/notifications",
  CREDENTIAL_DETAILS = "/tabs/credentials/:id",
  NOTIFICATION_DETAILS = "/tabs/notifications/:id",
}

const PublicRoutes = [
  RoutePath.ROOT,
  RoutePath.ONBOARDING,
  RoutePath.SET_PASSCODE,
];

export { PublicRoutes, RoutePath, TabsRoutePath };
