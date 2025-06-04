Feature: Menu Settings Passcode Forgotten - User can set new passcode when password enabled

  Scenario: C403 MenuSettingsPasscodeForgotten - User can set new passcode when password enabled
    Given user is onboarded with a password creation
    When user tap skip button on Welcome screen
    And user navigate to Change Passcode screen on Menu section
    And user successfully confirmed recovery phrase and passcode flow on Verify Your Recovery Phrase screen with password enable
    Then user can see toast message about change password successfully