Feature: Onboarding Biometrics Setup

  Background:
    Given the app is launched

  @onboarding @biometrics
  Scenario: User can see biometric setup screen with all options
    Given user is on the Biometric setup screen
    Then user can see "Enable biometrics" title
    And user can see biometric description
    And user can see "Skip" button
    And user can see "Enable biometrics" button
    And user can see "Set up later" button

  @onboarding @biometrics
  Scenario: User can skip biometric setup using Skip button
    Given user is on the Biometric setup screen
    When user taps "Skip" button
    Then user sees cancel biometric alert
    When user confirms cancel biometric
    Then user navigates away from biometric screen

  @onboarding @biometrics
  Scenario: User can skip biometric setup using Set up later button
    Given user is on the Biometric setup screen
    When user taps "Set up later" button
    Then user sees cancel biometric alert
    When user confirms cancel biometric
    Then user navigates away from biometric screen

  @onboarding @biometrics
  Scenario: User can enable biometrics
    Given user is on the Biometric setup screen
    When user taps "Enable biometrics" button
    Then biometric setup process is initiated

