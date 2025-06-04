Feature: Passcode

  Background:
    Given user tap Get Started button on Onboarding screen


  Scenario: C173 Passcode - loads correctly
    Then user can see Passcode screen

  Scenario: C174 Passcode - user can go back to Onboarding screen
    Given user tap Cancel button on Passcode screen
    Then user can see Onboarding screen

  Scenario: C175 Passcode - user can go back to Passcode screen
    Given user enter a generated passcode on Passcode screen
    And user can see Re-enter your Passcode screen
    When user tap Back button on Re-enter your Passcode screen
    Then user can see Passcode screen

  Scenario: C176 Passcode - user can start over
    Given user enter a generated passcode on Passcode screen
    And user can see Re-enter your Passcode screen
    When user tap Can't remember button on Re-enter your Passcode screen
    Then user can see Passcode screen

  Scenario: C177 Passcode - user can set a new passcode
    Given user enter a generated passcode on Passcode screen
    When user re-enter passcode on Passcode screen
    And user skip Biometric popup if it exist
    And user tap on Add a password on Create a password screen
    Then user can see Create Password screen
