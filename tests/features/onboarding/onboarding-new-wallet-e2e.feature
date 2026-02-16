Feature: New Wallet Creation End-to-End Flow

  @onboarding @e2e @new-wallet
  Scenario: User can complete full new wallet creation flow with individual profile
    Given user is on the intro screen
    When user taps "Get started" button
    Then user is on the Terms and Privacy screen
    When user taps "I accept" button
    Then user can see Passcode screen
    When user generate passcode on Passcode screen
    Then user can see "Enable biometrics" title
    When user skip Biometric popup if it exist
    Then user can see "Create a password" title
    When user taps "Set up later" button
    And user confirms skip password
    And user is on Connect to Veridian screen
    Then user navigates to SSI Agent Advanced Setup screen
    When user enters boot URL "default"
    And user enters connect URL "default"
    And user tap Validate button on SSI Agent Details screen
    Then user can see Profile type screen
    When user selects Individual profile option
    And user taps Confirm button on Profile type screen
    Then user can see Profile setup screen
    When user enters username "TestUser123"
    And user taps Confirm button on Profile setup screen
    Then user can see Welcome screen with username "TestUser123"
    When user taps Continue button on Welcome screen
    Then user can see Homepage

  @onboarding @e2e @new-wallet @group
  Scenario: User can complete full new wallet creation flow with group profile
    Given user is on the intro screen
    When user taps "Get started" button
    Then user is on the Terms and Privacy screen
    When user taps "I accept" button
    Then user can see Passcode screen
    When user generate passcode on Passcode screen
    Then user can see "Enable biometrics" title
    When user skip Biometric popup if it exist
    Then user can see "Create a password" title
    When user taps "Set up later" button
    And user confirms skip password
    And user is on Connect to Veridian screen
    Then user navigates to SSI Agent Advanced Setup screen
    When user enters boot URL "default"
    And user enters connect URL "default"
    And user tap Validate button on SSI Agent Details screen
    Then user can see Profile type screen
    When user selects Group profile option
    And user taps Confirm button on Profile type screen
    Then user can see Group setup screen
    When user enters group name "TestGroup"
    And user taps Confirm button on Group setup screen
    Then user can see Profile setup screen
    When user enters username "GroupUser123"
    And user taps Confirm button on Profile setup screen
    Then user can see Welcome screen with username "GroupUser123"
    When user taps Continue button on Welcome screen
    Then user can see Group profile setup screen

  # TODO: Re-enable after recovery related tests are implemented
  # Issue: After creating password, if recoveryWalletProgress is true, app navigates to VERIFY_RECOVERY_SEED_PHRASE
  # instead of SSI_AGENT. Need to ensure test starts in create mode (not recovery mode) or handle both flows.
  # @onboarding @e2e @new-wallet @password
  # Scenario: User can complete full new wallet creation flow with password and individual profile
  #   Given user is on the intro screen
  #   When user taps "Get started" button
  #   Then user is on the Terms and Privacy screen
  #   When user taps "I accept" button
  #   Then user can see Passcode screen
  #   When user generate passcode on Passcode screen
  #   Then user can see "Enable biometrics" title
  #   When user skip Biometric popup if it exist
  #   Then user can see "Create a password" title
  #   When user taps "Add a password" button
  #   And user enters password "TestPassword123!"
  #   And user enters confirm password "TestPassword123!"
  #   And user taps "Create password" button
  #   And user is on Connect to Veridian screen
  #   Then user navigates to SSI Agent Advanced Setup screen
  #   When user enters boot URL "default"
  #   And user enters connect URL "default"
  #   And user tap Validate button on SSI Agent Details screen
  #   Then user can see Profile type screen
  #   When user selects Individual profile option
  #   And user taps Confirm button on Profile type screen
  #   Then user can see Profile setup screen
  #   When user enters username "TestUser456"
  #   And user taps Confirm button on Profile setup screen
  #   Then user can see Welcome screen with username "TestUser456"
  #   When user taps Continue button on Welcome screen
  #   Then user can see Homepage

