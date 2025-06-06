Feature: CreatePassword

  Background:
    Given user tap Get Started button on Onboarding screen
    And user generate passcode on Passcode screen
    And user skip Biometric popup if it exist
    And user tap on Add a password on Create a password screen

  Scenario: C160 CreatePassword - user can cancel skipping password creation
    Given user tap Skip button on Create Password screen
    When tap Cancel button on alert modal for Create Password screen
    Then user can see Create Password screen

  Scenario: C161 CreatePassword - user can skip password creation
    Given user tap Skip button on Create Password screen
    When tap Confirm button on alert modal for Create Password screen
    Then user can see Your Recovery Phrase screen

  Scenario: C162 CreatePassword - user can set password successfully with all conditions
    Given user generated a password of 10 characters
    And user type in password on Create Password screen
    And all conditions are displayed as passed on Create Password screen
    And user confirm type in password on Create Password screen
    When user tap Create Password button on Create Password screen
    Then user can see Your Recovery Phrase screen

  Scenario: C165 CreatePassword - user can set password with hint
    Given user generated a password of 10 characters
    And user type in password on Create Password screen
    And user confirm type in password on Create Password screen
    And user type in hint for the password on Create Password screen
    When user tap Create Password button on Create Password screen
    Then user can see Your Recovery Phrase screen
