Feature: Onboarding Terms and Privacy

  Background:
    Given the app is launched

  @onboarding @terms
  Scenario: User can switch between Terms and Privacy tabs
    Given user is on the Terms and Privacy screen
    When user taps on "Terms" tab
    Then "Terms" tab is selected
    And user can see Terms content
    When user taps on "Privacy" tab
    Then "Privacy" tab is selected
    And user can see Privacy content

  @onboarding @terms
  Scenario: User can accept terms and proceed
    Given user is on the Terms and Privacy screen
    When user taps "I accept" button
    Then user navigates to the Create PIN screen


