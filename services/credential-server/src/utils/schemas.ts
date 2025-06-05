const ACDC_SCHEMAS = {
  "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao": {
    $id: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Qualified vLEI Issuer Credential",
    description:
      "A vLEI Credential issued by GLEIF to Qualified vLEI Issuers which allows the Qualified vLEI Issuers to issue, verify and revoke Legal Entity vLEI Credentials and Legal Entity Official Organizational Role vLEI Credentials",
    type: "object",
    credentialType: "QualifiedvLEIIssuervLEICredential",
    version: "1.0.0",
    properties: {
      v: { description: "Version", type: "string" },
      d: { description: "Credential SAID", type: "string" },
      u: { description: "One time use nonce", type: "string" },
      i: { description: "GLEIF Issuee AID", type: "string" },
      ri: { description: "Credential status registry", type: "string" },
      s: { description: "Schema SAID", type: "string" },
      a: {
        oneOf: [
          { description: "Attributes block SAID", type: "string" },
          {
            $id: "ELGgI0fkloqKWREXgqUfgS0bJybP1LChxCO3sqPSFHCj",
            description: "Attributes block",
            type: "object",
            properties: {
              d: { description: "Attributes block SAID", type: "string" },
              i: { description: "QVI Issuee AID", type: "string" },
              dt: {
                description: "Issuance date time",
                type: "string",
                format: "date-time",
              },
              LEI: {
                description: "LEI of the requesting Legal Entity",
                type: "string",
                format: "ISO 17442",
              },
              gracePeriod: {
                description: "Allocated grace period",
                type: "integer",
                default: 90,
              },
            },
            additionalProperties: false,
            required: ["i", "dt", "LEI"],
          },
        ],
      },
      r: {
        oneOf: [
          { description: "Rules block SAID", type: "string" },
          {
            $id: "ECllqarpkZrSIWCb97XlMpEZZH3q4kc--FQ9mbkFMb_5",
            description: "Rules block",
            type: "object",
            properties: {
              d: { description: "Rules block SAID", type: "string" },
              usageDisclaimer: {
                description: "Usage Disclaimer",
                type: "object",
                properties: {
                  l: {
                    description: "Associated legal language",
                    type: "string",
                    const:
                      "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.",
                  },
                },
              },
              issuanceDisclaimer: {
                description: "Issuance Disclaimer",
                type: "object",
                properties: {
                  l: {
                    description: "Associated legal language",
                    type: "string",
                    const:
                      "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.",
                  },
                },
              },
            },
            additionalProperties: false,
            required: ["d", "usageDisclaimer", "issuanceDisclaimer"],
          },
        ],
      },
    },
    additionalProperties: false,
    required: ["i", "ri", "s", "d"],
  },
  EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb: {
    $id: "EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb",
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Rare EVO 2024 Attendee",
    description:
      "This Trust Over IP (ToIP) Authentic Chained Data Container (ACDC) Credential provides an end-verifiable attestation that the holder attended the Rare EVO event on August 15 - 17, 2024, and participated in the Cardano Foundation's Identity Wallet demonstration leveraging Key Event Receipt Infrastructure (KERI).",
    type: "object",
    credentialType: "RareEvo2024AttendeeCredential",
    version: "1.0.0",
    properties: {
      v: {
        description: "Version",
        type: "string",
      },
      d: {
        description: "Credential SAID",
        type: "string",
      },
      u: {
        description: "One time use nonce",
        type: "string",
      },
      i: {
        description: "Issuee AID",
        type: "string",
      },
      ri: {
        description: "Credential status registry",
        type: "string",
      },
      s: {
        description: "Schema SAID",
        type: "string",
      },
      a: {
        oneOf: [
          {
            description: "Attributes block SAID",
            type: "string",
          },
          {
            $id: "EMNYoCwqUTqRgqqYh4Wg5UuLSr7PncFZ6RUx1vdnqxJs",
            description: "Attributes block",
            type: "object",
            properties: {
              d: {
                description: "Attributes block SAID",
                type: "string",
              },
              i: {
                description: "Issuee AID",
                type: "string",
              },
              dt: {
                description: "Issuance date time",
                type: "string",
                format: "date-time",
              },
              attendeeName: {
                description: "The name of the attendee",
                type: "string",
              },
            },
            additionalProperties: false,
            required: ["i", "dt", "attendeeName"],
          },
        ],
      },
    },
    additionalProperties: false,
    required: ["i", "ri", "s", "d"],
  },
  "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY": {
    $id: "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY",
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "Legal Entity vLEI Credential",
    description:
      "A vLEI Credential issued by a Qualified vLEI issuer to a Legal Entity",
    type: "object",
    credentialType: "LegalEntityvLEICredential",
    version: "1.0.0",
    properties: {
      v: {
        description: "Version",
        type: "string",
      },
      d: {
        description: "Credential SAID",
        type: "string",
      },
      u: {
        description: "One time use nonce",
        type: "string",
      },
      i: {
        description: "QVI Issuer AID",
        type: "string",
      },
      ri: {
        description: "Credential status registry",
        type: "string",
      },
      s: {
        description: "Schema SAID",
        type: "string",
      },
      a: {
        oneOf: [
          {
            description: "Attributes block SAID",
            type: "string",
          },
          {
            $id: "EJ6bFDLrv50bHmIDg-MSummpvYWsPa9CFygPUZyHoESj",
            description: "Attributes block",
            type: "object",
            properties: {
              d: {
                description: "Attributes block SAID",
                type: "string",
              },
              i: {
                description: "LE Issuer AID",
                type: "string",
              },
              dt: {
                description: "issuance date time",
                type: "string",
                format: "date-time",
              },
              LEI: {
                description: "LE Issuer AID",
                type: "string",
                format: "ISO 17442",
              },
            },
            additionalProperties: false,
            required: ["i", "dt", "LEI"],
          },
        ],
      },
      e: {
        oneOf: [
          {
            description: "Edges block SAID",
            type: "string",
          },
          {
            $id: "EDh9sp5cPk0-yo5sFMo6WJS1HMBYIOYCwJrnPvNaH1vI",
            description: "Edges block",
            type: "object",
            properties: {
              d: {
                description: "Edges block SAID",
                type: "string",
              },
              qvi: {
                description: "QVI node",
                type: "object",
                properties: {
                  n: {
                    description: "Issuer credential SAID",
                    type: "string",
                  },
                  s: {
                    description:
                      "SAID of required schema of the credential pointed to by this node",
                    type: "string",
                    const: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
                  },
                },
                additionalProperties: false,
                required: ["n", "s"],
              },
            },
            additionalProperties: false,
            required: ["d", "qvi"],
          },
        ],
      },
      r: {
        oneOf: [
          {
            description: "Rules block SAID",
            type: "string",
          },
          {
            $id: "ECllqarpkZrSIWCb97XlMpEZZH3q4kc--FQ9mbkFMb_5",
            description: "Rules block",
            type: "object",
            properties: {
              d: {
                description: "Rules block SAID",
                type: "string",
              },
              usageDisclaimer: {
                description: "Usage Disclaimer",
                type: "object",
                properties: {
                  l: {
                    description: "Associated legal language",
                    type: "string",
                    const:
                      "Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.",
                  },
                },
              },
              issuanceDisclaimer: {
                description: "Issuance Disclaimer",
                type: "object",
                properties: {
                  l: {
                    description: "Associated legal language",
                    type: "string",
                    const:
                      "All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.",
                  },
                },
              },
            },
            additionalProperties: false,
            required: ["d", "usageDisclaimer", "issuanceDisclaimer"],
          },
        ],
      },
    },
    additionalProperties: false,
    required: ["i", "ri", "s", "d", "e", "r"],
  },
};

const ACDC_SCHEMAS_ID = [
  "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
  "EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb",
  "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY",
];

export { ACDC_SCHEMAS, ACDC_SCHEMAS_ID };
