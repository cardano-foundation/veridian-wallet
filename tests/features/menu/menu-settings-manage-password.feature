Feature: Menu setting manage password

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen
    And user tap Menu button on Tab bar
    And user tap Settings button on Menu screen
    And user tap on Manage Operation Password button on Menu screen

  Scenario: C404 MenuSettingsManagePassword - Back to Menu Settings screen
    Given user tap on Back Button on Manage Password screen
    Then user can see Menu screen

  Scenario: C405 MenuSettingsManagePassword - Cancel on Operations Password modal
    Given user tap on Operation Password button on Manage Password screen
    When user tap Cancel button on alert modal for Manage Password screen
    Then user can see Manage Password screen

  Scenario: C406 MenuSettingsManagePassword - Continue on Operations Password modal
    Given user tap on Operation Password button on Manage Password screen
    When user tap Continue button on alert modal for Manage Password screen
    Then user can see Passcode screen from Operation Password Screen

  Scenario: C407 MenuSettingsManagePassword - Disable operations password
    Given user successfully confirmed password flow on Manage Password screen
    When user enter passcode on Verify Passcode screen
    And user generated a password of 10 characters on Create Password screen
    And user successfully confirmed password flow on Enter Password modal from Manage Password screen
    Then user see the status of Operations Password is false

  Scenario: C409 MenuSettingsManagePassword - Enable operations password after onboarding
    Given user successfully confirmed password flow on Manage Password screen
    When user enter passcode on Verify Passcode screen
    And user generated a password of 10 characters on Create Password screen
    Then user see the status of Operations Password is true
