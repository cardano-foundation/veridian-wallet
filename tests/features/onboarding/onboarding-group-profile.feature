Feature: Onboarding Group Profile Creation

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

  @onboarding @profile @group
  Scenario: User can see Profile type selection screen
    Then user can see Profile type screen
    And user can see "Individual profile" option
    And user can see "Group profile" option
    And user can see "Choose your profile type" description
    And user can see Confirm button

  @onboarding @profile @group
  Scenario: User can select Group profile and navigate to Group Setup
    Given user can see Profile type screen
    When user selects Group profile option
    And user taps Confirm button on Profile type screen
    Then user can see Group setup screen

  @onboarding @profile @group @validation
  Scenario: Confirm button is disabled when group name is empty
    Given user is on Group setup screen with Group profile selected
    Then Confirm button is disabled

  @onboarding @profile @group @validation
  Scenario: Confirm button is disabled when group name contains only spaces
    Given user is on Group setup screen with Group profile selected
    When user enters group name "   "
    Then Confirm button is disabled

  @onboarding @profile @group
  Scenario: User can create group profile with valid group name and username
    Given user is on Group setup screen with Group profile selected
    When user enters group name "TestGroup"
    And user taps Confirm button on Group setup screen
    Then user can see Profile setup screen
    When user enters username "GroupUser123"
    And user taps Confirm button on Profile setup screen
    Then user can see Welcome screen with username "GroupUser123"
    And user can see Continue button

  @onboarding @profile @group
  Scenario: User can navigate to group profile setup screen from Welcome screen
    Given user has created group profile with group name "TestGroup" and username "GroupUser123"
    When user taps Continue button on Welcome screen
    Then user can see Group profile setup screen
