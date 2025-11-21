import { isValidConnectionUrl, isValidHttpUrl } from "./urlChecker";

describe("Url checker", () => {
  const validUrl = [
    "http://a.co",
    "http://a",
    "http://a?",
    "http://localhost",
    "http://localhost:1120/params/dasdadada?name=any",
    "https://a.long.sub-domain.example.com/foo/bar?foo=bar&boo=far#a%20b",
    "www.police.academy",
    "https://x.com/?twitter?",
    "http://example.com?a=%bc&d=%ef&g=%H",
    "https://12.34.56.78:9000",
    "www.12.32.44.22:9323",
  ];

  const inValidUrl = [
    "//x.com/?twitter?",
    "dsadasda",
    "3213.323.321.333",
    "http://",
    "https://-",
  ];

  test("Valid format", () => {
    validUrl.forEach((url) => {
      expect(isValidHttpUrl(url)).toBe(true);
    });
  });

  test("Invalid format", () => {
    inValidUrl.forEach((url) => {
      expect(isValidHttpUrl(url)).toBe(false);
    });
  });
});

describe("Connection url checker", () => {
  const validUrl = [
    "http://domain:3902/oobi/connectionId/agent/ddasdasdqweqweq",
    "https://domain:3902/oobi/connectionId-1/agent/ddasdasdqweqweq-122",
    "https://domain:3902/oobi/connectionId-1/agent/ddasdasdqweqweq-122?params=21321dsada",
    "https://domain/oobi/connectionId-1/agent/ddasdasdqweqweq-122?params=21321dsada",
    "https://domain.com/oobi/connectionId-1/agent/ddasdasdqweqweq-122?params=21321dsada",
    "https://domain.com:3213/oobi/connectionId-1/agent/ddasdasdqweqweq-122?params=21321dsada",
    "http://domain:3902/oobi/connectionId/controller",
    "https://domain:3902/oobi/connectionId-1/mailbox/ddasdasdqweqweq-122",
    "https://domain:3902/oobi/connectionId-1/witness/ddasdasdqweqweq-122",
  ];

  const inValidUrl = [
    "domain:3902/oobi/connectionId/agent/ddasdasdqweqweq",
    "https://domain:3902/oobi/agent/ddasdasdqweqweq-122",
    "https://domain:3902/connectionId-1/agent/ddasdasdqweqweq-122",
    "https://domain/oobi/connectionId-1/ddasdasdqweqweq-122",
    "https://domain/oobi/connectionId-1/agent",
  ];

  test("Valid format", () => {
    validUrl.forEach((url) => {
      expect(isValidConnectionUrl(url)).toBe(true);
    });
  });

  test("Invalid format", () => {
    inValidUrl.forEach((url) => {
      expect(isValidConnectionUrl(url)).toBe(false);
    });
  });
});
