Feature: YourRecoveryPhrase

  Background:
    Given user tap Get Started button on Onboarding screen
    And user generate passcode on Passcode screen
    And user skip Biometric popup if it exist
    And skip Create Password screen


  Scenario: C180 YourRecoveryPhrase - user can read Terms of Use
    Given user tap Terms of Use link on Your Recovery Phrase screen
    Then user can see Terms of Use modal
    When user tap Done button on modal
    Then user can see Your Recovery Phrase screen

  Scenario: C181 YourRecoveryPhrase - user can read Privacy Policy
    Given user tap Privacy Policy link on Your Recovery Phrase screen
    Then user can see Privacy Policy modal
    When user tap Done button on modal
    Then user can see Your Recovery Phrase screen

  Scenario: C182 YourRecoveryPhrase - user can go to see Verify Seed Phrase screen
    Given user tap View Recovery Phrase button on Your Recovery Phrase screen
    And tap agree to the Terms and Conditions checkbox on Your Recovery Phrase screen
    When user tap Continue button Your Recovery Phrase screen
    And tap Confirm button on alert modal for Your Recovery Phrase screen
    Then user can see Verify Your Recovery Phrase screen
