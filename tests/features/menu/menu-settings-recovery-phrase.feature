Feature: Menu setting recovery phrase

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen
    And user tap Menu button on Tab bar
    And user tap Settings button on Menu screen
    And user tap on Recovery Phrase button on Menu screen

  Scenario: C426 MenuSettingsRecoveryPhrase - Back to Menu Settings screen
    Given user tap on Back Button on Recovery Phrase screen
    Then user can see Menu screen

  Scenario: C427 MenuSettingsRecoveryPhrase - Cancel on Stay safe modal
    Given user tap on View Recovery Button on Recovery Phrase screen
    When user tap Cancel button on Stay Safe Modal from Recovery Phrase screen
    Then user can see Recovery Phrase Screen

  Scenario: C428 MenuSettingsRecoveryPhrase - User is able to see recovery phrase
    Given user tap on View Recovery Button on Recovery Phrase screen
    When user confirm and acknowledge warning then click View Recovery Phrase button on Stay Safe Modal from Recovery Phrase screen
    And user enter passcode on Verify Passcode screen
    Then user see all 18 recovery phrase

  Scenario: C429 MenuSettingsRecoveryPhrase - User is able to hide recovery phrase
    Given user tap on View Recovery Button on Recovery Phrase screen
    When user confirm and acknowledge warning then click View Recovery Phrase button on Stay Safe Modal from Recovery Phrase screen
    And user enter passcode on Verify Passcode screen
    And user tap on Hide Recovery Button on Recovery Phrase screen
    Then user cannot see all 18 recovery phrase

  Scenario: C430 MenuSettingsRecoveryPhrase - View recovery phrase on Stay safe modal
    Given user tap on View Recovery Button on Recovery Phrase screen
    When user confirm and acknowledge warning then click View Recovery Phrase button on Stay Safe Modal from Recovery Phrase screen
    And user enter passcode on Verify Passcode screen
    Then user see all 18 recovery phrase
