Feature: VerifyYourRecoveryPhrase

  Background:
    Given user tap Get Started button on Onboarding screen
    And user generate passcode on Passcode screen
    And user skip Biometric popup if it exist
    And skip Create Password screen


  Scenario: C178 VerifyYourRecoveryPhrase - user can go back to Your Recovery Phrase screen
    Given user continue after choose and save words of recovery phrase
    When user tap Back button on Verify Your Recovery Phrase screen
    Then user can see Your Recovery Phrase screen

  Scenario: C179 VerifyYourRecoveryPhrase - user can verify words of recovery phrase
    Given user continue after choose and save words of recovery phrase
    When user select words from his recovery phrase on Verify Your Recovery Phrase screen
    And user tap Continue button on Verify Your Recovery Phrase screen
    Then user can see SSI Agent Details screen
