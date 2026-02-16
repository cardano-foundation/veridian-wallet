Feature: Onboarding SSI Agent

  Background:
    Given the app is launched

  Scenario: User can validate SSI Agent details
    Given user tap Get Started button on Onboarding screen
    And user is on the Terms and Privacy screen
    And user taps "I accept" button
    And user generate passcode on Passcode screen
    And user skip Biometric popup if it exist
    And skip Create Password screen
    And user is on Connect to Veridian screen
    And user navigates to SSI Agent Advanced Setup screen
    And SSI Agent URLs are cleared
    When user enters boot URL "default"
    And user enters connect URL "default"
    And user tap Validate button on SSI Agent Details screen
    Then user can see Profile type screen

 @onboarding @ssi-agent @validation @error
  Scenario: User sees error when both URLs have invalid formatting
    Given user tap Get Started button on Onboarding screen
    And user is on the Terms and Privacy screen
    And user taps "I accept" button
    And user generate passcode on Passcode screen
    And user skip Biometric popup if it exist
    And skip Create Password screen
    And user is on Connect to Veridian screen
    And user navigates to SSI Agent Advanced Setup screen
    And SSI Agent URLs are cleared
    When user enters boot URL "//ssiagent/boot?id=123"
    And user enters connect URL "//ssiagent/connect?id=123"
    Then user can see "Enter a valid URL" error message for boot URL
    And user can see "Enter a valid URL" error message for connect URL
    And Connect button is disabled

  @onboarding @ssi-agent @validation @error
  Scenario: User sees error when boot URL has invalid formatting
    Given user tap Get Started button on Onboarding screen
    And user is on the Terms and Privacy screen
    And user taps "I accept" button
    And user generate passcode on Passcode screen
    And user skip Biometric popup if it exist
    And skip Create Password screen
    And user is on Connect to Veridian screen
    And user navigates to SSI Agent Advanced Setup screen
    And SSI Agent URLs are cleared
    When user enters boot URL "//ssiagent/boot?id=123"
    And user enters connect URL "https://ssiagent.org/connect?id=123"
    Then user can see "Enter a valid boot URL" error message for boot URL
    And Connect button is disabled

  @onboarding @ssi-agent @validation @error
  Scenario: User sees error when connect URL has invalid formatting
    Given user tap Get Started button on Onboarding screen
    And user is on the Terms and Privacy screen
    And user taps "I accept" button
    And user generate passcode on Passcode screen
    And user skip Biometric popup if it exist
    And skip Create Password screen
    And user is on Connect to Veridian screen
    And user navigates to SSI Agent Advanced Setup screen
    And SSI Agent URLs are cleared
    When user enters boot URL "https://idwssiagent.org/boot?id=123"
    And user enters connect URL "//ssiagent/connect?id=123"
    Then user can see "Enter a valid connect URL" error message for connect URL
    And Connect button is disabled

  @onboarding @ssi-agent @validation @error
  Scenario: User sees error when URLs do not match
    Given user tap Get Started button on Onboarding screen
    And user is on the Terms and Privacy screen
    And user taps "I accept" button
    And user generate passcode on Passcode screen
    And user skip Biometric popup if it exist
    And skip Create Password screen
    And user is on Connect to Veridian screen
    And user navigates to SSI Agent Advanced Setup screen
    And SSI Agent URLs are cleared
    When user enters boot URL "https://idwssiagent.org/boot?id=123"
    And user enters connect URL "https://ssiagent.org/connect?id=456"
    And user taps Connect button
    Then user can see "We could not reach this server. Either the server is down, you have entered an incorrect URL or you have internet connectivity issues." error message for connect URL
    And Connect button is disabled
 