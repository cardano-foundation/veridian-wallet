enum RoutePath {
  ROOT = "/",
  ONBOARDING = "/onboarding",
  TERM_AND_PRIVACY = "/term-n-privacy",
  SET_PASSCODE = "/setpasscode",
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
  HOME = "/tabs/home",
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
  RoutePath.TERM_AND_PRIVACY,
];

export { PublicRoutes, RoutePath, TabsRoutePath };
