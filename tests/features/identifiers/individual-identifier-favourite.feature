Feature: IndividualIdentifierFavourite

  Background:
    Given user is onboarded with skipped password creation
    And identifier is created and user can see Identifier Card Details screen for Individual

  Scenario: IndividualIdentifierFavourite - Chose favourite identifier
    Given user tap Favourite button on Identifier Card Details screen
    When tap Done button on Identifier Card Details screen
    Then user can see chosen identifier as his favourite on Identifiers screen
