export const GLEIF_NAME = "qvi"; // should be GLEIF
export const LE_NAME = "le";
export const ISSUER_NAME = "issuer";

export const QVI_SCHEMA_SAID = "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao";
export const LE_SCHEMA_SAID = "ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY";
export const OOR_AUTH_SCHEMA_SAID =
  "EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E";
export const OOR_SCHEMA_SAID = "EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy";

export const RARE_EVO_DEMO_SCHEMA_SAID =
  "EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb";
export const F_EMPLOYEE_DEMO_SCHEMA_SAID =
  "EL9oOWU_7zQn_rD--Xsgi3giCWnFDaNvFMUGTOZx1ARO";
export const BIRTH_CERTIFICATE = "EE6DAsJPqDspkLhbk1pVELQVbqyz6TFSEKXdS1Iz-Nz1";
export const FISHING_HUNTING_LICENSE =
  "EFVZujklqUEubsyY9PRgBRMf39HgHzCPo3Ii_-xhkOlF";
export const ROME_OFFSITE = "EMkpplwGGw3fwdktSibRph9NSy_o2MvKDKO8ZoONqTOt";
export const REEVE = "EG9587oc7lSUJGS7mtTkpmRUnJ8F5Ji79-e_pY4jt3Ik";
export const CARDANO_METADATA_SIGNER =
  "EJVgEQO8BEhGGM7GcAjlqoKG1upeuBZj9WjvjZo353sQ";

export const ACDC_SCHEMAS_ID = [
  QVI_SCHEMA_SAID,
  OOR_SCHEMA_SAID,
  RARE_EVO_DEMO_SCHEMA_SAID,
  F_EMPLOYEE_DEMO_SCHEMA_SAID,
  BIRTH_CERTIFICATE,
  FISHING_HUNTING_LICENSE,
  ROME_OFFSITE,
  REEVE,
  CARDANO_METADATA_SIGNER,
];

export const ACDC_SCHEMAS = [
  {
    id: QVI_SCHEMA_SAID,
    name: "Qualified vLEI Issuer Credential",
  },
  {
    id: OOR_SCHEMA_SAID,
    name: "Official Organizational Role vLEI Credential",
  },
  {
    id: F_EMPLOYEE_DEMO_SCHEMA_SAID,
    name: "Foundation Employee",
  },
  {
    id: RARE_EVO_DEMO_SCHEMA_SAID,
    name: "Rare EVO 2024 Attendee",
  },
  {
    id: BIRTH_CERTIFICATE,
    name: "Birth Certificate",
  },
  {
    id: FISHING_HUNTING_LICENSE,
    name: "Fishing & Hunting License",
  },
  {
    id: ROME_OFFSITE,
    name: "Rome Offsite 2025 Credential",
  },
  {
    id: REEVE,
    name: "Reeve",
  },
  {
    id: CARDANO_METADATA_SIGNER,
    name: "vLEI Cardano Metadata Signer",
  },
];
