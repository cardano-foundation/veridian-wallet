Feature: Menu setting passcode forgotten

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen
    And user tap Menu button on Tab bar
    And user tap Settings button on Menu screen
    And user tap on Change Passcode button on Menu screen

  Scenario: C192 MenuSettingsPasscodeForgotten - Cancel modal for recovery phrase verification
    Given user tap forgotten passcode button on Passcode screen from Menu screen
    When user tap Cancel button on alert modal for Passcode screen from Menu screen
    Then user can see Enter passcode screen from Menu screen

  Scenario: C193 MenuSettingsPasscodeForgotten - Cancel on Forgot passcode screen
    Given user tap forgotten passcode button on Passcode screen from Menu screen
    When user tap Verify your Recovery Phrase button on alert modal for Passcode screen from Menu screen
    And user tap on cancel button in the Menu Verify Your Phrase Screen
    Then user can see Enter passcode screen from Menu screen

  Scenario: C194 MenuSettingsPasscodeForgotten - Confirm modal for recovery phrase verification
    Given user tap forgotten passcode button on Passcode screen from Menu screen
    When user tap Verify your Recovery Phrase button on alert modal for Passcode screen from Menu screen
    Then user can see Verify Your Recovery Phrase screen from Menu screen

  Scenario: C195 MenuSettingsPasscodeForgotten - Confirm recovery phrase
    Given user tap forgotten passcode button on Passcode screen from Menu screen
    When user tap Verify your Recovery Phrase button on alert modal for Passcode screen from Menu screen
    Then user verify all the recovery phrase in Verify Your Recovery Phrase screen from Menu screen

  Scenario: C196 MenuSettingsPasscodeForgotten - Wrong recovery phrase
    Given user tap forgotten passcode button on Passcode screen from Menu screen
    When user tap Verify your Recovery Phrase button on alert modal for Passcode screen from Menu screen
    And user wrongly verify all the recovery phrase in Verify Your Recovery Phrase screen from Menu screen
    Then user can see wrong recovery phrase popup

  Scenario: C402 MenuSettingsPasscodeForgotten - User can set new passcode
    Given user tap forgotten passcode button on Passcode screen from Menu screen
    When user tap Verify your Recovery Phrase button on alert modal for Passcode screen from Menu screen
    And user verify all the recovery phrase in Verify Your Recovery Phrase screen from Menu screen
    And user generate passcode on Passcode screen from Verify Your Recovery Phrase screen
    Then user can see toast message about change password successfully