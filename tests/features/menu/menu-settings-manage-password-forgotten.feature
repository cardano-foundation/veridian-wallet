Feature: Menu setting manage password forgotten

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen
    And user tap Menu button on Tab bar
    And user tap Settings button on Menu screen
    And user tap on Change Passcode button on Menu screen

  Scenario: C414 MenuSettingsManagePasswordForgotten - Cancel on Forgot Password screen
    Given user tap forgotten passcode button on Passcode screen from Menu screen
    When user tap Cancel button on alert modal for Passcode screen from Menu screen
    Then user can see Enter passcode screen from Menu screen

  Scenario: C415 MenuSettingsManagePasswordForgotten - Confirm on Forgot Password screen
    Given user tap forgotten passcode button on Passcode screen from Menu screen
    When user tap Verify your Recovery Phrase button on alert modal for Passcode screen from Menu screen
    Then user can see Verify Your Recovery Phrase screen from Menu screen

  Scenario: C416 MenuSettingsManagePasswordForgotten - User can set new password
    Given user tap forgotten passcode button on Passcode screen from Menu screen
    When user tap Verify your Recovery Phrase button on alert modal for Passcode screen from Menu screen
    And user verify all the recovery phrase in Verify Your Recovery Phrase screen from Menu screen
    And user generate passcode on Passcode screen from Verify Your Recovery Phrase screen
    Then user can see toast message about change password successfully

