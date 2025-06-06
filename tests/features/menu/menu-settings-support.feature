Feature: Menu Settings Support

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen
    And user tap Menu button on Tab bar

  Scenario: C420 MenuSettingsSupport - App version
    Given user click on Settings icon
    When user scroll to app version in menu setting screen
    Then user can see app version

  Scenario: C421 MenuSettingsSupport - Back from Privacy policy screen
    Given user click on Settings icon
    When user click on term and privacy button in menu setting screen
    And user click privacy policy button
    And user click Done button
    Then user see term and privacy screen

  Scenario: C422 MenuSettingsSupport - Back from Terms and privacy screen
    Given user click on Settings icon
    When user click on term and privacy button in menu setting screen
    And user click back button
    Then user got navigate back to setting screen

  Scenario: C423 MenuSettingsSupport - Back from Terms of use screen
    Given user click on Settings icon
    When user click on term and privacy button in menu setting screen
    And user click term of use button
    And user click Done button
    Then user see term and privacy screen

  Scenario: C425 MenuSettingsSupport - Learn more about Cardano IDW
    Given user click on Settings icon
    When user click on learn more
    Then user got navigate to a website