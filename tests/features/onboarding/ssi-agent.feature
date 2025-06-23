Feature: SSIAgent

  Background:
    Given user generate passcode and skip password and verify recovery phrase

  Scenario: C234 SSIAgent - scan QR code for boot URL
    When user tap scan icon for Boot URL on SSI Agent Details screen
    And user scan QR code
    Then user can see new value for Boot URL on SSI Agent Details screen

  Scenario: C235 SSIAgent - user can manually edit boot URL
    When user edit Boot URL on SSI Agent Details screen
    Then user can see new value for Boot URL on SSI Agent Details screen

  Scenario: C199 SSIAgent - scan QR code for connect URL
    When user tap scan icon for Connect URL on SSI Agent Details screen
    And user scan QR code
    Then user can see new value for Connect URL on SSI Agent Details screen

  Scenario: C200 SSIAgent - user can manually edit connect URL
    When user edit Connect URL on SSI Agent Details screen
    Then user can see new value for Connect URL on SSI Agent Details screen

  Scenario: C241 SSIAgent - user can validate SSI Agent details
    When user tap Validate button on SSI Agent Details screen
    Then user can see Welcome modal

  Scenario: C242 SSIAgent - user can Back from About SSI agent modal
    When user tap Get more information button on SSI Agent Details screen
    Then user can see About SSI agent modal
    When user tap Done button on About SSI agent modal
    Then user can see SSI Agent Details screen

  Scenario: C243 SSIAgent - user can see Onboarding documentation
    When user tap Get more information button on SSI Agent Details screen
    And user tap Onboarding documentation button on About SSI agent modal
    Then user can see Onboarding documentation

  Scenario: C201 SSIAgent - user can recover a wallet
    When user tap Switch to recover a wallet button on SSI Agent Details screen
    And user tap Continue button on Before you switch modal for recover a wallet flow
    Then user can see Recover Wallet screen

    Scenario: C202 SSIAgent - user can go back from recover a wallet screen
      When user tap Switch to recover a wallet button on SSI Agent Details screen
      Then user can see Before you switch modal for recover a wallet flow
      When user tap Back button on Before you switch modal for recover a wallet flow
      Then user can see SSI Agent Details screen