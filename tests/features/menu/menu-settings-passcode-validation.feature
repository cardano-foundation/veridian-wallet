Feature: Menu setting passcode validation

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen
    And user tap Menu button on Tab bar
    And user tap Settings button on Menu screen
    And user tap on Change Passcode button on Menu screen

  Scenario: C188 MenuSettingsPasscodeValidation - User try to use incorrect passcode
    Given user enter generated passcode on Verify Passcode screen
    Then user can see Incorrect passcode on Verify Passcode screen

  Scenario: C189 MenuSettingsPasscodeValidation - User try to reuse current passcode as new one
    Given user enter passcode on Verify Passcode screen
    When user re-enter passcode on Passcode screen
    Then user can see Passcode already in use on Passcode screen
