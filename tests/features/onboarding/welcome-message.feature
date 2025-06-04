Feature: WelcomeMessage

  Background:
    Given user is onboarded with skipped password creation

  Scenario: C2546 WelcomeMessage - is displayed
    Then user can see Welcome message

  Scenario: C2547 WelcomeMessage - Add an identifier is successful
    Given user tap Add and Identifier button on Welcome message
    When user add Individual identifier
    Then user can see toast message about created identifier
    And user can see Identifiers screen with 1 card

  Scenario: C2548 WelcomeMessage - Add an identifier cancel
    Given user tap Add and Identifier button on Welcome message
    When user tap Cancel button on Add and Identifier screen
    Then user can see Welcome message

  Scenario: C2549 WelcomeMessage - skip
    Given user tap Skip button on Welcome message
    Then user can see Identifiers screen