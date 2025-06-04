Feature: IndividualIdentifierDetails

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen

  Scenario: C150 IndividualIdentifierDetails - Done button on card details screen of Individual identifier works correctly
    Given user add Individual identifier through plus icon
    And user can see Identifiers screen with 1 card
    When user chose newly created identifier on Identifiers screen
    And user can see Identifier Card Details screen
    And tap Done button on Identifier Card Details screen
    Then user can see Identifiers screen with 1 card

  Scenario: C151 IndividualIdentifierDetails - User can copy card details of Individual identifier
    Given identifier is created and user can see Identifier Card Details screen for Individual
    Then user copy and verify details
