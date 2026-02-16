Feature: Onboarding PIN Creation and Verification

  Background:
    Given the app is launched

  @onboarding @pin
  Scenario: User can see Create PIN screen after accepting terms
    Given user is on the Terms and Privacy screen
    When user taps "I accept" button
    Then user is on the Create PIN screen
    And user can see "Create your PIN" title
    And user can see PIN description
    And user can see 6 empty PIN input circles
    And user can see numeric keypad

  @onboarding @pin
  Scenario: User can create a PIN
    Given user is on the Create PIN screen
    When user enters a 6-digit PIN
    Then user is on the Re-enter PIN screen
    And user can see "Re-enter your PIN" title
    And user can see re-enter PIN description

  @onboarding @pin
  Scenario: User can verify PIN successfully
    Given user is on the Create PIN screen
    And user has entered a PIN
    When user re-enters the same PIN
    Then PIN is verified successfully
    And user navigates to the Biometric setup screen

  @onboarding @pin @error
  Scenario: User sees error when PIN doesn't match
    Given user is on the Create PIN screen
    And user has entered a PIN
    When user re-enters a different PIN
    Then user sees "PIN didn't match" error message
    And PIN input circles are cleared
    And user can re-enter PIN

  @onboarding @pin
  Scenario: User can navigate back from Re-enter PIN screen
    Given user is on the Re-enter PIN screen
    When user taps back button
    Then user is on the Create PIN screen

  @onboarding @pin
  Scenario: User can cancel PIN creation and return to Terms screen
    Given user is on the Create PIN screen
    When user tap Cancel button on Passcode screen
    Then user navigates away from PIN screen
    And user is on the Terms and Privacy screen

  @onboarding @pin
  Scenario: User can start over from Re-enter PIN screen
    Given user is on the Re-enter PIN screen
    When user tap Can't remember button on Re-enter your Passcode screen
    Then user can see Passcode screen

