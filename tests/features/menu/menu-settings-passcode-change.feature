Feature: Menu setting passcode change

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen
    And user tap Menu button on Tab bar
    And user tap Settings button on Menu screen
    And user tap on Change Passcode button on Menu screen

  Scenario: C183 MenuSettingsPasscodeChange - Cancel on enter old passcode
    Given user tap Cancel button on Passcode screen from Setting screen
    Then user can see Menu screen

  Scenario: C184 MenuSettingsPasscodeChange - Cancel on create new passcode
    Given user enter passcode on Verify Passcode screen
    When user tap Cancel button on Passcode screen from Setting screen
    Then user can see Menu screen

  Scenario: C185 MenuSettingsPasscodeChange - Back on Re-enter new passcode
    Given user enter passcode on Verify Passcode screen
    When user enter a generated passcode on Passcode screen
    And user tap Cancel button on Passcode screen from Setting screen
    Then user can see Create new passcode screen from Menu screen

  Scenario: C186 MenuSettingsPasscodeChange - Can't remember on Re-enter new passcode
    Given user enter passcode on Verify Passcode screen
    When user enter a generated passcode on Passcode screen
    And user tap Can't remember button on Re-enter your Passcode screen from Menu screen
    Then user can see Create new passcode screen from Menu screen

  Scenario: C187 MenuSettingsPasscodeChange - User can change passcode to new one
    Given user enter passcode on Verify Passcode screen
    When user generate passcode on Passcode screen
    Then user can see toast message about change password successfully
    And user can see Menu screen
