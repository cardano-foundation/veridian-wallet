Feature: Menu setting manage password change

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen
    And user tap Menu button on Tab bar
    And user tap Settings button on Menu screen
    And user tap on Change Passcode button on Menu screen

  Scenario: C410 MenuSettingsManagePasswordChange - Cancel on Enter Password modal
    Given user tap Cancel button on Passcode screen from Setting screen
    Then user can see Menu screen

  Scenario: C411 MenuSettingsManagePasswordChange - Confirm on Enter Password modal
    Given user enter passcode on Verify Passcode screen
    Then user can see Create new passcode screen from Menu screen

  Scenario: C412 MenuSettingsManagePasswordChange - Reset my password on Enter Password modal
    Given user enter passcode on Verify Passcode screen
    When user generate passcode on Passcode screen
    Then user can see toast message about change password successfully

  Scenario: C413 MenuSettingsManagePasswordChange - Wrong password on Enter Password modal
    Given user enter generated passcode on Verify Passcode screen
    Then user can see Incorrect passcode on Verify Passcode screen
