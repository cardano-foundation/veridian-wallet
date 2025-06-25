Feature: Scan

  Background:
    Given user is onboarded with skipped password creation
    And user tap skip button on Welcome screen
    And user create new Identifier

  Scenario: C225 Scan - Loads correctly
    When user click on scan button
    Then scan screen load correctly

  Scenario: C226 Scan - Not recognized paste contents
    Given user click on scan button
    When user paste faulty content
    Then a error message appear

  Scenario: C307 Scan - Paste contents successfully
    Given user click on scan button
    When user paste content
    Then connection setup successfully