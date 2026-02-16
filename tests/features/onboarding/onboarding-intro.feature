Feature: Onboarding Intro Screen

  Background:
    Given the app is launched

  @onboarding @intro
  Scenario: User can see intro screen with both options
    Given user is on the intro screen
    Then user can see "Get started" button
    And user can see "I already have a wallet" link

  @onboarding @intro @terms
  Scenario: User can navigate to terms screen from Get Started button
    Given user is on the intro screen
    When user taps "Get started" button
    Then user is on the Terms and Privacy screen
    And user can see "Terms" tab
    And user can see "Privacy" tab
    And user can see "I accept" button

  @onboarding @intro @terms
  Scenario: User can navigate to terms screen from I already have a wallet link
    Given user is on the intro screen
    When user taps "I already have a wallet" link
    Then user is on the Terms and Privacy screen
    And user can see "Terms" tab
    And user can see "Privacy" tab
    And user can see "I accept" button


