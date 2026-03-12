Feature: Onboarding Individual Profile Creation

  Background:
    Given user tap Get Started button on Onboarding screen
    And user generate passcode on Passcode screen
    And user skip Biometric popup if it exist
    And skip Create Password screen
    And user is on Connect to Veridian screen
    And user navigates to SSI Agent Advanced Setup screen
    And SSI Agent URLs are cleared
    When user enters boot URL "default"
    And user enters connect URL "default"
    And user tap Validate button on SSI Agent Details screen

  @onboarding @profile @individual
  Scenario: User can see Profile type selection screen
    Then user can see Profile type screen
    And user can see "Individual profile" option
    And user can see "Group profile" option
    And user can see "Choose your profile type" description
    And user can see Confirm button

  @onboarding @profile @individual
  Scenario: User can select Individual profile and navigate to Profile Setup
    Given user can see Profile type screen
    When user selects Individual profile option
    And user taps Confirm button on Profile type screen
    Then user can see Profile setup screen
    And user can see "Set up your individual profile" description
    And user can see Username input field
    And user can see Confirm button

  @onboarding @profile @individual @validation
  Scenario: Confirm button is disabled when username is empty
    Given user is on Profile setup screen with Individual profile selected
    Then Confirm button is disabled

  @onboarding @profile @individual @validation
  Scenario: Confirm button is disabled when username contains only spaces
    Given user is on Profile setup screen with Individual profile selected
    When user enters username "   "
    Then Confirm button is disabled

  @onboarding @profile @individual
  Scenario: User can create individual profile with valid username
    Given user is on Profile setup screen with Individual profile selected
    When user enters username "Alice"
    And user taps Confirm button on Profile setup screen
    Then user can see Welcome screen with username "Alice"
    And user can see "Your individual profile has been created" description
    And user can see Continue button

  @onboarding @profile @individual
  Scenario: User can navigate to homepage from Welcome screen
    Given user has created individual profile with username "Alice"
    When user taps Continue button on Welcome screen
    Then user can see Homepage


