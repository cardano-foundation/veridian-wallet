Feature: IndividualIdentifierDelete

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen
    And identifier is created and user can see Identifier Card Details screen for Individual

  Scenario: C148 IndividualIdentifierDelete - Identifier removed by details screen
    Given tap Delete identifier button on Identifier Card Details screen
    And tap Confirm button on alert modal on Identifier Card Details screen
    And user enter passcode on Verify Passcode screen
    Then user can see toast message about deleted identifier on Identifiers screen
    And user can see Add An Identifier button on Identifiers screen

  Scenario: C149 IndividualIdentifierDelete - Identifier removed by options
    Given user tap Options button on Identifier Card Details screen
    And tap Delete identifier option from Identifier Options modal
    And tap Confirm button on alert modal on Identifier Card Details screen
    And user enter passcode on Verify Passcode screen
    Then user can see toast message about deleted identifier on Identifiers screen
    And user can see Add An Identifier button on Identifiers screen
