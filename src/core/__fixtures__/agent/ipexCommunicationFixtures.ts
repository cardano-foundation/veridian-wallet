import {
  ExchangeRoute,
  NotificationRoute,
} from "../../agent/services/keriaNotificationService.types";
import { CredentialStatus } from "../../agent/services/credentialService.types";

const grantForIssuanceExnMessage = {
  exn: {
    v: "KERI10JSON000516_",
    t: "exn",
    d: "EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL",
    i: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
    p: "",
    dt: "2024-07-30T04:19:55.801000+00:00",
    r: ExchangeRoute.IpexGrant,
    q: {},
    a: {
      m: "",
      i: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
      smids: ["EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G"],
      gid: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
    },
    rp: "ELjvc_mLWOx7pI4fBh7lGUYofOAJUgUrMKnaoFGdvs86",
    e: {
      acdc: {
        d: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
        i: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
        s: "EBIFDhtSE0cM4nbTnaMqiV1vUIlcnbsqBMeVMmeGmXOu",
        ri: "EEqfWy-6jx_FG0RNuNxZBh_jq6Lq1OPuvX5m3v1Bzxdn",
        a: {
          d: "ELHCh_X2aw7C-aYesOM4La23a5lsoNuJDuCsJuxwO2nq",
          i: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
          dt: "2024-07-30T04:19:55.348000+00:00",
          attendeeName: "ccc",
        },
      },
      iss: {
        t: "iss",
        d: "EHStOgwJku_Ln-YN2ohgWUH-CI07SyJnFppSbF8kG4PO",
        i: "EEqfWy-6jx_FG0RNuNxZBh_jq6Lq1OPuvX5m3v1Bzxdn",
        s: "0",
        dt: "2024-07-30T04:19:55.348000+00:00",
      },
      icp: {
        i: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
      },
      exn: {
        r: ExchangeRoute.IpexGrant,
        p: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
      },
      d: "EKBPPnWxYw2I5CtQSyhyn5VUdSTJ61qF_-h-NwmFRkIF",
    },
  },
  pathed: {
    acdc: "-IABEEqfWy-6jx_FG0RNuNxZBh_jq6Lq1OPuvX5m3v1Bzxdn0AAAAAAAAAAAAAAAAAAAAAAAEHStOgwJku_Ln-YN2ohgWUH-CI07SyJnFppSbF8kG4PO",
    iss: "-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAAAEEO0xKzC8FOAXV-JgFZGgb0aIT2A3cPXPt9_0l_qcGM9",
    anc: "-AABAACBlQqbI_qNpKYkzIog6tauSgt0XufBvGtrumfbnhSInFjSwnaIqZi353QT-c1W_gE9KIz3rgX5QNNWLcqA7bcM",
  },
};

const applyForPresentingExnMessage = {
  exn: {
    v: "KERI10JSON000198_",
    t: "exn",
    d: "EFbd-N8VoWbHzpwPUKm4hPF6ZKCRNHfnYiKKYDT7N0KS",
    i: "EB7p1BiY_BJKHqnYbZCnBA7R7gx5LN5RSw5lvxugNkTE",
    rp: "EFPQ7LAydMjiYYxPzvTcNs9rqzj5Khb8fNtAli9DraQK",
    p: "",
    dt: "2024-09-12T09:42:43.794000+00:00",
    r: ExchangeRoute.IpexApply,
    q: {},
    a: {
      i: "EFPQ7LAydMjiYYxPzvTcNs9rqzj5Khb8fNtAli9DraQK",
      m: "",
      s: "EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb",
      a: { attendeeName: "4" },
      smids: ["EFPQ7LAydMjiYYxPzvTcNs9rqzj5Khb8fNtAli9DraQK"],
      gid: "EFPQ7LAydMjiYYxPzvTcNs9rqzj5Khb8fNtAli9DraQK",
    },
    e: {
      acdc: {
        d: "EFbd-N8VoWbHzpwPUKm4hPF6ZKCRNHfnYiKKYDT7N0KS",
        i: "EFPQ7LAydMjiYYxPzvTcNs9rqzj5Khb8fNtAli9DraQK",
        s: "EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb",
        ri: "EFPQ7LAydMjiYYxPzvTcNs9rqzj5Khb8fNtAli9DraQK",
        a: {
          d: "EFbd-N8VoWbHzpwPUKm4hPF6ZKCRNHfnYiKKYDT7N0KS",
          i: "EFPQ7LAydMjiYYxPzvTcNs9rqzj5Khb8fNtAli9DraQK",
          dt: "2024-09-12T09:42:43.794000+00:00",
        },
      },
      icp: {
        i: "EFPQ7LAydMjiYYxPzvTcNs9rqzj5Khb8fNtAli9DraQK",
      },
      exn: {
        r: ExchangeRoute.IpexApply,
        p: "EFbd-N8VoWbHzpwPUKm4hPF6ZKCRNHfnYiKKYDT7N0KS",
      },
    },
  },
  pathed: {},
};

const offerForPresentingExnMessage = {
  exn: {
    v: "KERI10JSON000516_",
    t: "exn",
    d: "EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL",
    i: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
    p: "",
    dt: "2024-07-30T04:19:55.801000+00:00",
    r: ExchangeRoute.IpexOffer,
    q: {},
    a: {
      m: "",
      i: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
      smids: ["EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G"],
      gid: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
    },
    e: {
      acdc: {
        d: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
        i: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
        s: "EBIFDhtSE0cM4nbTnaMqiV1vUIlcnbsqBMeVMmeGmXOu",
        ri: "EEqfWy-6jx_FG0RNuNxZBh_jq6Lq1OPuvX5m3v1Bzxdn",
        a: {
          d: "ELHCh_X2aw7C-aYesOM4La23a5lsoNuJDuCsJuxwO2nq",
          i: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
          dt: "2024-07-30T04:19:55.348000+00:00",
          attendeeName: "ccc",
        },
      },
      iss: {
        t: "iss",
        d: "EHStOgwJku_Ln-YN2ohgWUH-CI07SyJnFppSbF8kG4PO",
        i: "EEqfWy-6jx_FG0RNuNxZBh_jq6Lq1OPuvX5m3v1Bzxdn",
        s: "0",
        dt: "2024-07-30T04:19:55.348000+00:00",
      },
      icp: {
        i: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
      },
      exn: {
        r: ExchangeRoute.IpexOffer,
        p: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
      },
      d: "EKBPPnWxYw2I5CtQSyhyn5VUdSTJ61qF_-h-NwmFRkIF",
    },
  },
  pathed: {
    acdc: "-IABEEqfWy-6jx_FG0RNuNxZBh_jq6Lq1OPuvX5m3v1Bzxdn0AAAAAAAAAAAAAAAAAAAAAAAEHStOgwJku_Ln-YN2ohgWUH-CI07SyJnFppSbF8kG4PO",
    iss: "-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAAAEEO0xKzC8FOAXV-JgFZGgb0Bzxdn",
    anc: "-AABAACBlQqbI_qNpKYkzIog6tauSgt0XufBvGtrumfbnhSInFjSwnaIqZi353QT-c1W_gE9KIz3rgX5QNNWLcqA7bcM",
  },
};

const admitForIssuanceExnMessage = {
  exn: {
    v: "KERI10JSON000178_",
    t: "exn",
    d: "EEqJBi-JmK5IG-rU4wnn5cplcnmAk6exhAwE2GkAG895",
    i: "EJHe0vp6WOPgBNjJEakNTW2xVPwKNRJfZ1q4DhoXem3D",
    rp: "EI6lgpgvnVbl6hdfJNWCxlWEz9il1S1mu89XBBjvUBwK",
    p: "EFYtFiqA6l2xlCtTwKksHpWtTSvIilwQGamB_qFvPuER",
    dt: "2024-12-23T07:42:34.448000+00:00",
    r: ExchangeRoute.IpexAdmit,
    q: {},
    a: {
      i: "EI6lgpgvnVbl6hdfJNWCxlWEz9il1S1mu89XBBjvUBwK",
      m: "",
      smids: ["EI6lgpgvnVbl6hdfJNWCxlWEz9il1S1mu89XBBjvUBwK"],
      gid: "EI6lgpgvnVbl6hdfJNWCxlWEz9il1S1mu89XBBjvUBwK",
    },
    e: {
      acdc: {
        d: "EEqJBi-JmK5IG-rU4wnn5cplcnmAk6exhAwE2GkAG895",
        i: "EI6lgpgvnVbl6hdfJNWCxlWEz9il1S1mu89XBBjvUBwK",
        s: "EI6lgpgvnVbl6hdfJNWCxlWEz9il1S1mu89XBBjvUBwK",
        ri: "EI6lgpgvnVbl6hdfJNWCxlWEz9il1S1mu89XBBjvUBwK",
        a: {
          d: "EEqJBi-JmK5IG-rU4wnn5cplcnmAk6exhAwE2GkAG895",
          i: "EI6lgpgvnVbl6hdfJNWCxlWEz9il1S1mu89XBBjvUBwK",
          dt: "2024-12-23T07:42:34.448000+00:00",
        },
      },
      icp: {
        i: "EI6lgpgvnVbl6hdfJNWCxlWEz9il1S1mu89XBBjvUBwK",
      },
      exn: {
        r: ExchangeRoute.IpexAdmit,
        p: "EFYtFiqA6l2xlCtTwKksHpWtTSvIilwQGamB_qFvPuER",
      },
    },
  },
  pathed: {},
};

// @TODO - foconnor: Agree must have valid p, and no embeds - but causing tests to fail right now.
const agreeForPresentingExnMessage = {
  exn: {
    v: "KERI10JSON000516_",
    t: "exn",
    d: "EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL",
    i: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
    p: "",
    dt: "2024-07-30T04:19:55.801000+00:00",
    r: ExchangeRoute.IpexAgree,
    q: {},
    a: {
      m: "",
      i: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
      smids: ["EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G"],
      gid: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
    },
    rp: "ELjvc_mLWOx7pI4fBh7lGUYofOAJUgUrMKnaoFGdvs86",
    e: {
      acdc: {
        d: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
        i: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
        s: "EBIFDhtSE0cM4nbTnaMqiV1vUIlcnbsqBMeVMmeGmXOu",
        ri: "EEqfWy-6jx_FG0RNuNxZBh_jq6Lq1OPuvX5m3v1Bzxdn",
        a: {
          d: "ELHCh_X2aw7C-aYesOM4La23a5lsoNuJDuCsJuxwO2nq",
          i: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
          dt: "2024-07-30T04:19:55.348000+00:00",
          attendeeName: "ccc",
        },
      },
      iss: {
        t: "iss",
        d: "EHStOgwJku_Ln-YN2ohgWUH-CI07SyJnFppSbF8kG4PO",
        i: "EEqfWy-6jx_FG0RNuNxZBh_jq6Lq1OPuvX5m3v1Bzxdn",
        s: "0",
        dt: "2024-07-30T04:19:55.348000+00:00",
      },
      icp: {
        i: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
      },
      exn: {
        r: ExchangeRoute.IpexAgree,
        p: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
      },
      d: "EKBPPnWxYw2I5CtQSyhyn5VUdSTJ61qF_-h-NwmFRkIF",
    },
  },
  pathed: {
    acdc: "-IABEEqfWy-6jx_FG0RNuNxZBh_jq6Lq1OPuvX5m3v1Bzxdn0AAAAAAAAAAAAAAAAAAAAAAAEHStOgwJku_Ln-YN2ohgWUH-CI07SyJnFppSbF8kG4PO",
    iss: "-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAAAEEO0xKzC8FOAXV-JgFZGgb0aIT2A3cPXPt9_0l_qcGM9",
    anc: "-AABAACBlQqbI_qNpKYkzIog6tauSgt0XufBvGtrumfbnhSInFjSwnaIqZi353QT-c1W_gE9KIz3rgX5QNNWLcqA7bcM",
  },
};

const credentialMetadataRecord = {
  type: "CredentialMetadataRecord",
  id: "EJuFvMGiT3uhEXtd7UQlkAm4N_MymeHfhkgnOgPhK0cJ",
  isArchived: false,
  pendingDeletion: false,
  createdAt: "2024-08-09T04:21:18.311Z",
  issuanceDate: "2024-08-09T04:21:12.575Z",
  credentialType: "Qualified vLEI Issuer Credential",
  status: CredentialStatus.PENDING,
  connectionId: "EP0fEaRWZDR7caQbdserTOWlC_4trvqB1tzbr2xVo3a4",
  schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
  updatedAt: "2024-08-09T04:21:19.695Z",
};

const QVISchema = {
  title: "Qualified vLEI Issuer Credential",
  description: "Qualified vLEI Issuer Credential",
  version: "1.0",
};

const credentialRecordProps = {
  connectionId: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
  credentialType: "Qualified vLEI Issuer Credential",
  id: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
  isArchived: false,
  issuanceDate: "2024-07-30T04:19:55.348Z",
  schema: "EBIFDhtSE0cM4nbTnaMqiV1vUIlcnbsqBMeVMmeGmXOu",
  status: CredentialStatus.PENDING,
};

const groupIdentifierMetadataRecord = {
  type: "IdentifierMetadataRecord",
  id: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
  displayName: "holder",
  groupMemberPre: "EAL7pX9Hklc_iq7pkVYSjAilCfQX3sr5RbX76AxYs2UH",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const multisigExnOfferForPresenting = {
  exn: {
    v: "KERI10JSON00032d_",
    t: "exn",
    d: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
    i: "ECS7jn05fIP_JK1Ub4E6hPviRKEdC55QhxZToxDIHo_E",
    rp: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn",
    p: "",
    dt: "2024-08-28T06:39:55.501000+00:00",
    r: NotificationRoute.MultiSigExn,
    q: {},
    a: {
      i: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn",
      gid: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      smids: ["EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn"],
    },
    e: {
      exn: {
        v: "KERI10JSON000178_",
        t: "exn",
        d: "EKa94ERqArLOvNf9AmItMJtsoGKZPVb3e_pEo_1D37qt",
        i: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
        rp: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn",
        p: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
        dt: "2024-08-28T06:39:51.416000+00:00",
        r: ExchangeRoute.IpexOffer,
        q: {},
        a: {
          i: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn",
          m: "",
        },
        e: { acdc: { d: "EEuFpvZ2G_YMm3smqbwZn4SWArxQOen7ZypVVfr6fVCT" } },
      },
      d: "EE8_Xc0ZUh_sUJLtmBpVSEr-RFS2mRUIpFyL-pmvtPvx",
    },
  },
  pathed: {
    exn: {
      v: "KERI10JSON000178_",
      t: "exn",
      d: "EKa94ERqArLOvNf9AmItMJtsoGKZPVb3e_pEo_1D37qt",
      i: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      rp: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn",
      p: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
      dt: "2024-08-28T06:39:51.416000+00:00",
      r: ExchangeRoute.IpexGrant,
      q: {},
      a: {
        i: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn",
        m: "",
      },
      e: {
        acdc: { d: "EEuFpvZ2G_YMm3smqbwZn4SWArxQOen7ZypVVfr6fVCT" },
      },
    },
  },
};

const multisigExnAdmitForIssuance = {
  exn: {
    v: "KERI10JSON00032d_",
    t: "exn",
    d: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
    i: "ECS7jn05fIP_JK1Ub4E6hPviRKEdC55QhxZToxDIHo_E",
    rp: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn",
    p: "",
    dt: "2024-08-28T06:39:55.501000+00:00",
    r: NotificationRoute.MultiSigExn,
    q: {},
    a: {
      i: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn",
      gid: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
    },
    e: {
      exn: {
        v: "KERI10JSON000178_",
        t: "exn",
        d: "EKa94ERqArLOvNf9AmItMJtsoGKZPVb3e_pEo_1D37qt",
        i: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
        rp: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn",
        p: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
        dt: "2024-08-28T06:39:51.416000+00:00",
        r: ExchangeRoute.IpexAdmit,
        q: {},
        a: {
          i: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn",
          m: "",
        },
        e: {},
      },
      d: "EE8_Xc0ZUh_sUJLtmBpVSEr-RFS2mRUIpFyL-pmvtPvx",
    },
  },
  pathed: {},
};

const multisigExnGrant = {
  exn: {
    v: "KERI10JSON00032d_",
    t: "exn",
    d: "ELW97_QXT2MWtsmWLCSR8RBzH-dcyF2gTJvt72I0wEFO",
    i: "ECS7jn05fIP_JK1Ub4E6hPviRKEdC55QhxZToxDIHo_E",
    rp: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn",
    p: "",
    dt: "2024-08-28T06:39:55.501000+00:00",
    r: NotificationRoute.MultiSigExn,
    q: {},
    a: {
      i: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn",
      gid: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      smids: ["EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn"],
    },
    e: {
      acdc: {
        d: "EEuFpvZ2G_YMm3smqbwZn4SWArxQOen7ZypVVfr6fVCT",
        i: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
        s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
        ri: "EGtWoXT4ahu5YnmGCAV8stolM-fgdqCu_eggQ46uSSoi",
        a: {
          d: "EEuFpvZ2G_YMm3smqbwZn4SWArxQOen7ZypVVfr6fVCT",
          i: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
          dt: "2024-08-28T06:39:51.416000+00:00",
        },
      },
      icp: {
        i: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      },
      exn: {
        i: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
        r: ExchangeRoute.IpexGrant,
        p: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
        e: {
          acdc: {
            i: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
            d: "EEuFpvZ2G_YMm3smqbwZn4SWArxQOen7ZypVVfr6fVCT",
            s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
          },
        },
      },
      d: "EE8_Xc0ZUh_sUJLtmBpVSEr-RFS2mRUIpFyL-pmvtPvx",
    },
  },
  pathed: {
    exn: "d",
  },
};

const credentialRecord = {
  v: "ACDC10JSON00018d_",
  d: "EEuFpvZ2G_YMm3smqbwZn4SWArxQOen7ZypVVfr6fVCT",
  i: "EAzUd88Fcd1dHZg5LUEgz9zgHLX96V6y0cZoY6MkvnOP",
  ri: "EGNm44ZxIYVO_ctkbIXoNTrkEdBhLi9k09doVKRdoixi",
  s: "EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb",
  a: {
    d: "EDdyFnzf3dDOIHU7AF4tsQ-fqtFeHmg5LniT7QpJuFpw",
    i: "EOAjGXrNHM-PuSFEEJ_x38gv5S1HNZtHOHSaVR9eZ1s7",
    attendeeName: "4",
    dt: "2024-09-20T02:54:03.259000+00:00",
  },
};

const getCredentialResponse = {
  sad: {
    a: { LEI: "5493001KJTIIGC8Y1R17" },
    d: "EBEWfIUOn789yJiNRnvKqpbWE3-m6fSDxtu6wggybbli",
    i: "EIpeOFh268oRJTM4vNNoQvMWw-NBUPDv1NqYbx6Lc1Mk",
    ri: "EOIj7V-rqu_Q9aGSmPfviBceEtRk1UZBN5H2P_L-Hhx5",
    s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
    v: "ACDC10JSON000197_",
  },
  schema: {
    title: "Qualified vLEI Issuer Credential",
    description: "vLEI Issuer Description",
    version: "1.0.0",
    credentialType: "QualifiedvLEIIssuervLEICredential",
  },
  status: {
    s: "0",
    dt: new Date().toISOString(),
  },
};

const credentialProps = {
  sad: {
    v: "ACDC10JSON000197_",
    d: "EBJHAbtBAi8yYspNjLDaw0s5A7PZyjoj1lrhSE-Dn28r",
    i: "EEozWLiY6DrCMCLfPqdBaIvUX1aUyjLKkT6-RxFrIMd9",
    ri: "EPUFfq94pBLYKDRWyfOe7m-RKsET_zriJbfU3iUtM450",
    s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
    a: {},
  },
  atc: "-IABEBJHAbtBAi8yYspNjLDaw0s5A7PZyjoj1lrhSE-Dn28r0AAAAAAAAAAAAAAAAAAAAAAAEBJHAbtBAi8yYspNjLDaw0s5A7PZyjoj1lrhSE-Dn28r",
  iss: {
    v: "KERI10JSON0000ed_",
    t: "iss",
    d: "EEuxEi0sa45nAcVQc_MwGh8EGK0Lh1pgiHY18hbh1yNF",
    i: "EBJHAbtBAi8yYspNjLDaw0s5A7PZyjoj1lrhSE-Dn28r",
    s: "0",
    ri: "EPUFfq94pBLYKDRWyfOe7m-RKsET_zriJbfU3iUtM450",
    dt: "2024-08-15T08:44:13.141000+00:00",
  },
  issatc:
    "-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAACEJS94k_1jFBJDqibDrambXKWTx4OS3axqsb76-4qbIY-",
  anc: {
    v: "KERI10JSON00013a_",
    t: "ixn",
    d: "EJS94k_1jFBJDqibDrambXKWTx4OS3axqsb76-4qbIY-",
    i: "EEozWLiY6DrCMCLfPqdBaIvUX1aUyjLKkT6-RxFrIMd9",
    s: "2",
    p: "EJpMvkYRQw7CKM_slbyJ0tmDQTJ46utkD3v6oOhLtaw3",
    a: [{}],
  },
  ancatc: [
    "-VAn-AABAAAfKRBq-VlL5Py28LEQjamfj0FLNcn83rw_nye2oCEUciih6D0tr8y9abpwRxx2hq3gSYyZRcZcxaLA5AFaYfQG-EAB0AAAAAAAAAAAAAAAAAAAAAAA1AAG2024-08-15T08c44c14d346253p00c00",
  ],
};

const multisigParticipantsProps = {
  ourIdentifier: {
    id: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
    displayName: "Identifier 2",
    createdAt: "2024-09-23T08:53:11.981Z",
    theme: 0,
    groupMetadata: {
      groupId: "group-id",
      groupInitiator: true,
      groupCreated: true,
      userName: "IdentifierName2",
    },
  },
  multisigMembers: {
    signing: [
      {
        aid: "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF",
        ends: {
          agent: {
            "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8": {
              http: "http://keria:3902/",
            },
          },
          witness: {
            "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha": {
              http: "http://witness-demo:5642/",
              tcp: "tcp://witness-demo:5632/",
            },
          },
        },
      },
      {
        aid: "EGaEIhOGSTPccSMvnXvfvOVyC1C5AFq62GLTrRKVZBS5",
        ends: {
          agent: {
            "EBkResDyD-lZslJAZLe2gOCIlGLTd4Wts7Wy0EgDBi4d": {
              http: "http://keria:3902/",
            },
          },
          witness: {
            "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha": {
              http: "http://witness-demo:5642/",
              tcp: "tcp://witness-demo:5632/",
            },
          },
        },
      },
    ],
    rotation: [],
  },
};

const ipexGrantSerder = {
  kind: "JSON",
  raw: '{"v":"KERI10JSON0004b1_","t":"exn","d":"EIGHcMNSHqnRlQWy-tIg04k24wIy5_mqBfOXDhhAsHvx","i":"EHis8uP3C9jJ70OjwRfY9tLxvqefH7qVIazlpaVJI5zm","p":"","dt":"2024-08-15T08:44:16.867000+00:00","r":"/ipex/grant","q":{},"a":{"m":"","i":"EEozWLiY6DrCMCLfPqdBaIvUX1aUyjLKkT6-RxFrIMd9"},"e":{"acdc":{"v":"ACDC10JSON000197_","d":"EBJHAbtBAi8yYspNjLDaw0s5A7PZyjoj1lrhSE-Dn28r","i":"EEozWLiY6DrCMCLfPqdBaIvUX1aUyjLKkT6-RxFrIMd9","ri":"EPUFfq94pBLYKDRWyfOe7m-RKsET_zriJbfU3iUtM450","s":"EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao","a":{"d":"EIK0Xph_pH3RYIgLniWMuMVlgvoLK8eIICN7cIUJv2j8","i":"EHis8uP3C9jJ70OjwRfY9tLxvqefH7qVIazlpaVJI5zm","LEI":"5493001KJTIIGC8Y1R17","dt":"2024-08-15T08:44:13.141000+00:00"}},"iss":{"v":"KERI10JSON0000ed_","t":"iss","d":"EEuxEi0sa45nAcVQc_MwGh8EGK0Lh1pgiHY18hbh1yNF","i":"EBJHAbtBAi8yYspNjLDaw0s5A7PZyjoj1lrhSE-Dn28r","s":"0","ri":"EPUFfq94pBLYKDRWyfOe7m-RKsET_zriJbfU3iUtM450","dt":"2024-08-15T08:44:13.141000+00:00"},"anc":{"v":"KERI10JSON0000cd_","t":"ixn","d":"EK9x8RSjMJ_oxuBHIWftq5lYQcTW7WYZ3HwCT34s62jQ","i":"EEozWLiY6DrCMCLfPqdBaIvUX1aUyjLKkT6-RxFrIMd9","s":"1","p":"EBJHAbtBAi8yYspNjLDaw0s5A7PZyjoj1lrhSE-Dn28r","a":[{}]},"d":"EO_bCCneshP2lNWQ8gKSqyU9frP9V8Zo6tLczIHeXhXg"}}',
  ked: {
    v: "KERI10JSON0004b1_",
    t: "exn",
    d: "EIGHcMNSHqnRlQWy-tIg04k24wIy5_mqBfOXDhhAsHvx",
    i: "EHis8uP3C9jJ70OjwRfY9tLxvqefH7qVIazlpaVJI5zm",
    p: "",
    dt: "2024-08-15T08:44:16.867000+00:00",
    r: ExchangeRoute.IpexGrant,
    q: {},
    a: { m: "", i: "EEozWLiY6DrCMCLfPqdBaIvUX1aUyjLKkT6-RxFrIMd9" },
    e: {
      acdc: {},
      iss: {},
      anc: {},
      d: "EO_bCCneshP2lNWQ8gKSqyU9frP9V8Zo6tLczIHeXhXg",
    },
  },
  size: 1201,
};

const ipexGrantSig = [
  "AACfmWTQqrzUi9uSrnD439sFYFU95m4AFwLqihBzL94MltV7TFVOPKnFLl8z9O0hOyFCpspLmCPi9laBi7bocC8I",
];

const ipexGrantEnd =
  " -LAg4AACA-e-acdc-IABEBJHAbtBAi8yYspNjLDaw0s5A7PZyjoj1lrhSE-Dn28r0AAAAAAAAAAAAAAAAAAAAAAAEEuxEi0sa45nAcVQc_MwGh8EGK0Lh1pgiHY18hbh1yNF-LAW5AACAA-e-iss-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAAAEK9x8RSjMJ_oxuBHIWftq5lYQcTW7WYZ3HwCT34s62jQ-LAa5AACAA-e-anc-AABAADHCaE5QMSHK1D83emSdbA5I6CvhRwmkMlGTm__zi4hB4dEvbcVPyexX1euccTCVW6pViLlqExvJBdz1J3PIgUI";

const ipexSubmitGrantSerder = {
  kind: "JSON",
  raw: '{"v":"KERI10JSON00025f_","t":"exn","d":"EFnDzHLeULKSm_jbQSIN427yWWFr82OBkkxg3iUf2FUW","i":"EGUORQAs0r1mup1OmX1H23PITDV7td-o2XGdMVL6lmmk","p":"","dt":"2024-08-02T03:53:30.133000+00:00","r":"/multisig/exn","q":{},"a":{"gid":"EPIKswKD9AiVxIqU4QLn14qpNuiAfgVGzoK-HVU0znjC"},"e":{"exn":{"v":"KERI10JSON000111_","t":"exn","d":"EMTArfbjevIfB-fbxzsepKO35RWHN2gQxTTU5Lov2Dld","i":"EPIKswKD9AiVxIqU4QLn14qpNuiAfgVGzoK-HVU0znjC","p":"EH-_9IgodejkwXi2Hw--A53rVYcO6bDYnBrbpCId8LOu","dt":"2024-08-02T03:53:29.400000+00:00","r":"/ipex/admit","q":{},"a":{"m":""},"e":{}},"d":"ECxCLDUf8A1y62wf7YkWAcj5RN-KVzNaxRefzgE7oIjq"}}',
  ked: {
    v: "KERI10JSON00066c_",
    t: "exn",
    d: "EEpfEHR6EedLnEzleK7mM3AKJSoPWuSQeREC8xjyq3pa",
    i: "EN-5a2OQkuImwAJh5o-SXx2Db-az-ZQo0EmHv4SK-xxw",
    p: "",
    dt: "2024-08-09T10:27:01.653000+00:00",
    r: NotificationRoute.MultiSigExn,
    q: {},
    a: {
      gid: "EOfnSCpCa3XmSTUZ7vEgEJoYbruyiYIbl5DYsAwooXTY",
      smids: ["EOfnSCpCa3XmSTUZ7vEgEJoYbruyiYIbl5DYsAwooXTY"],
    },
    e: {
      exn: {
        v: "KERI10JSON00051e_",
        t: "exn",
        d: "EHCV5Bm4IZiICVzUTaiyoWqeA1YB-idHU0X5Pckac18I",
        i: "EOfnSCpCa3XmSTUZ7vEgEJoYbruyiYIbl5DYsAwooXTY",
        p: "",
        dt: "2024-08-09T10:27:00.155000+00:00",
        r: ExchangeRoute.IpexGrant,
        q: {},
        a: { m: "", i: "ENDDYy0SVuFOI3rEnB3HbNFB_BFjhl4fQbZSeDZHGQf9" },
        e: {
          acdc: {
            v: "ACDC10JSON000197_",
            d: "EK0IO8nKiSEi6hQKRj5f4YjLkMSSonoxkFLwP1YgycJ1",
            i: "EOfnSCpCa3XmSTUZ7vEgEJoYbruyiYIbl5DYsAwooXTY",
            ri: "EGtWoXT4ahu5YnmGCAV8stolM-fgdqCu_eggQ46uSSoi",
            s: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
            a: {
              LEI: "5493001KJTIIGC8Y1R17",
              d: "EA4LhtGr8YjfZV3d6NpoM6zHILhDi48ETUfAwwovv4w4",
              dt: "2024-08-09T10:26:43.853000+00:00",
              i: "ENDDYy0SVuFOI3rEnB3HbNFB_BFjhl4fQbZSeDZHGQf9",
            },
          },
          iss: {
            v: "KERI10JSON0000ed_",
            t: "iss",
            d: "EN3heuFbxVO29fXp87-tisLFKJ7hX2U2gISCRFBLzE0E",
            i: "EK0IO8nKiSEi6hQKRj5f4YjLkMSSonoxkFLwP1YgycJ1",
            s: "0",
            ri: "EGtWoXT4ahu5YnmGCAV8stolM-fgdqCu_eggQ46uSSoi",
            dt: "2024-08-09T10:26:43.853000+00:00",
          },
          anc: {
            v: "KERI10JSON00013a_",
            t: "ixn",
            d: "EOpvfZPwtHf05Di-pGjcj2tyKjFwXAHBJfKuHx4eOsqX",
            i: "EOfnSCpCa3XmSTUZ7vEgEJoYbruyiYIbl5DYsAwooXTY",
            s: "4",
            p: "EHiOcu5i_MGv8EHHSpdRHBsKNtkLc0oTIeXsevRt_kZh",
            a: [
              {
                d: "EN3heuFbxVO29fXp87-tisLFKJ7hX2U2gISCRFBLzE0E",
                i: "EK0IO8nKiSEi6hQKRj5f4YjLkMSSonoxkFLwP1YgycJ1",
                s: "0",
              },
            ],
          },
          d: "EAws1bbmwAdKbviwBqoUZGjI4YB7TyULXSMuO_2otwe-",
        },
      },
      d: "EIwwfdduAceqZpjPogZPFBC5pgdKfRgwsSGrr11aE13A",
    },
  },
  size: 607,
};

const ipexSubmitGrantSig = [
  "ABB5MNMwQNwDxo4hhNYdF2hjzJQfZe6nfjdO_WfjvnxJwkRMrkrbapdjW8BStprjhxASVKWHmWOEFVpGWwmDpyIP",
];

const ipexSubmitGrantEnd =
  "-LA35AACAA-e-exn-FABEPIKswKD9AiVxIqU4QLn14qpNuiAfgVGzoK-HVU0znjC0AAAAAAAAAAAAAAAAAAAAAAAEPIKswKD9AiVxIqU4QLn14qpNuiAfgVGzoK-HVU0znjC-AABAABTAefC5IBObzL5ZteOa6me6iLQXV1v1rTcsBOrJDfk6uwRfR1nxm2DKWxehRMHEdq6YlqxysCdWfVBIvd4t3gH";

const ipexOfferSerder = {
  kind: "JSON",
  raw: '{"v":"KERI10JSON000340_","t":"exn","d":"EGfyfKc4tnZtigxgaw_55NEa13-5zpFXkheLv2jZiwI1","i":"EBopw9UjL8plPiTfqJbb819-l2Jsr-0de7YXGxzKGRq4","rp":"EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd","p":"ENdg2aG1gOXitYwI1xKZNch0VFAmZuFpvL0Xftliv0W9","dt":"2024-10-02T15:23:50.210000+00:00","r":"/ipex/offer","q":{},"a":{"i":"EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd","m":""},"e":{"acdc":{"v":"ACDC10JSON00018e_","d":"ELKa5OdxusflKLZBqmHI09vYgyiySh4ZM1CQcoS6Nabh","i":"EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd","ri":"EN1AomPsN0gmQS47DCaI3hz6rJovMz2aiLSfXDit_UrU","s":"EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb","a":{"d":"ENnh02JAwpkWVo8ExuuwgBGQB9fG8Zapg99H4dT6a_93","i":"EBopw9UjL8plPiTfqJbb819-l2Jsr-0de7YXGxzKGRq4","attendeeName":"99","dt":"2024-10-02T15:21:50.607000+00:00"}},"d":"ECc3mOk1p4QceI4bGBoVhv7cVX34n-UOlK73VSm7m_fS"}}',
  ked: {
    v: "KERI10JSON000340_",
    t: "exn",
    d: "EGfyfKc4tnZtigxgaw_55NEa13-5zpFXkheLv2jZiwI1",
    i: "EBopw9UjL8plPiTfqJbb819-l2Jsr-0de7YXGxzKGRq4",
    rp: "EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd",
    p: "ENdg2aG1gOXitYwI1xKZNch0VFAmZuFpvL0Xftliv0W9",
    dt: "2024-10-02T15:23:50.210000+00:00",
    r: ExchangeRoute.IpexOffer,
    q: {},
    a: {
      i: "EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd",
      m: "",
      smids: ["EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd"],
      gid: "EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd",
    },
    e: {
      acdc: {
        v: "ACDC10JSON00018e_",
        d: "ELKa5OdxusflKLZBqmHI09vYgyiySh4ZM1CQcoS6Nabh",
        i: "EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd",
        ri: "EN1AomPsN0gmQS47DCaI3hz6rJovMz2aiLSfXDit_UrU",
        s: "EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb",
        a: {
          d: "ENnh02JAwpkWVo8ExuuwgBGQB9fG8Zapg99H4dT6a_93",
          i: "EBopw9UjL8plPiTfqJbb819-l2Jsr-0de7YXGxzKGRq4",
          attendeeName: "99",
          dt: "2024-10-02T15:21:50.607000+00:00",
        },
      },
      icp: {
        i: "EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd",
      },
      exn: {
        r: ExchangeRoute.IpexOffer,
        p: "ELKa5OdxusflKLZBqmHI09vYgyiySh4ZM1CQcoS6Nabh",
      },
      d: "ECc3mOk1p4QceI4bGBoVhv7cVX34n-UOlK73VSm7m_fS",
    },
  },
  size: 832,
};

const ipexOfferSig = [
  "AAAfM-MSYZSCt1WdeLWLwYsuTYgpMTwpTwGXEtHIcizCAKoDw4b8Gc725TSHRaKELr7B9PojuGx9OXT-Fulx_oEF",
];

const multisigOfferSerder = {
  kind: "JSON",
  raw: '{"v":"KERI10JSON0004f5_","t":"exn","d":"EARi8kQ1PkSSRyFEIPOFPdnsnv7P2QZYEQqnmr1Eo2N8","i":"EAsQ-kwJwO8ug-S2dk1WGwpPlF4hT3q5TJi_OLZSFdEy","rp":"EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd","p":"","dt":"2024-10-02T15:26:01.003000+00:00","r":"/multisig/exn","q":{},"a":{"i":"EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd","gid":"EBopw9UjL8plPiTfqJbb819-l2Jsr-0de7YXGxzKGRq4"},"e":{"exn":{"v":"KERI10JSON000340_","t":"exn","d":"EGfyfKc4tnZtigxgaw_55NEa13-5zpFXkheLv2jZiwI1","i":"EBopw9UjL8plPiTfqJbb819-l2Jsr-0de7YXGxzKGRq4","rp":"EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd","p":"ENdg2aG1gOXitYwI1xKZNch0VFAmZuFpvL0Xftliv0W9","dt":"2024-10-02T15:23:50.210000+00:00","r":"/ipex/offer","q":{},"a":{"i":"EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd","m":""},"e":{"acdc":{"v":"ACDC10JSON00018e_","d":"ELKa5OdxusflKLZBqmHI09vYgyiySh4ZM1CQcoS6Nabh","i":"EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd","ri":"EN1AomPsN0gmQS47DCaI3hz6rJovMz2aiLSfXDit_UrU","s":"EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb","a":{"d":"ENnh02JAwpkWVo8ExuuwgBGQB9fG8Zapg99H4dT6a_93","i":"EBopw9UjL8plPiTfqJbb819-l2Jsr-0de7YXGxzKGRq4","attendeeName":"99","dt":"2024-10-02T15:21:50.607000+00:00"}},"d":"ECc3mOk1p4QceI4bGBoVhv7cVX34n-UOlK73VSm7m_fS"}},"d":"EKNY8J1PflxKy72qqE05SKmej4SpEecFAGFA3cLSPTKj"}}',
  ked: {
    v: "KERI10JSON0004f5_",
    t: "exn",
    d: "EARi8kQ1PkSSRyFEIPOFPdnsnv7P2QZYEQqnmr1Eo2N8",
    i: "EAsQ-kwJwO8ug-S2dk1WGwpPlF4hT3q5TJi_OLZSFdEy",
    rp: "EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd",
    p: "",
    dt: "2024-10-02T15:26:01.003000+00:00",
    r: NotificationRoute.MultiSigExn,
    q: {},
    a: {
      i: "EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd",
      gid: "EBopw9UjL8plPiTfqJbb819-l2Jsr-0de7YXGxzKGRq4",
      smids: ["EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd"],
    },
    e: {
      exn: {
        v: "KERI10JSON000340_",
        t: "exn",
        d: "EGfyfKc4tnZtigxgaw_55NEa13-5zpFXkheLv2jZiwI1",
        i: "EBopw9UjL8plPiTfqJbb819-l2Jsr-0de7YXGxzKGRq4",
        rp: "EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd",
        p: "ENdg2aG1gOXitYwI1xKZNch0VFAmZuFpvL0Xftliv0W9",
        dt: "2024-10-02T15:23:50.210000+00:00",
        r: ExchangeRoute.IpexOffer,
        q: {},
        a: {
          i: "EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd",
          m: "",
        },
        e: {
          acdc: {
            v: "ACDC10JSON00018e_",
            d: "ELKa5OdxusflKLZBqmHI09vYgyiySh4ZM1CQcoS6Nabh",
            i: "EOb2ITawuAc6mAeSn4SMuHZtB9mIHfZzac_1NO28eytd",
            ri: "EN1AomPsN0gmQS47DCaI3hz6rJovMz2aiLSfXDit_UrU",
            s: "EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb",
            a: {
              d: "ENnh02JAwpkWVo8ExuuwgBGQB9fG8Zapg99H4dT6a_93",
              i: "EBopw9UjL8plPiTfqJbb819-l2Jsr-0de7YXGxzKGRq4",
              attendeeName: "99",
              dt: "2024-10-02T15:21:50.607000+00:00",
            },
          },
          d: "ECc3mOk1p4QceI4bGBoVhv7cVX34n-UOlK73VSm7m_fS",
        },
      },
      d: "EKNY8J1PflxKy72qqE05SKmej4SpEecFAGFA3cLSPTKj",
    },
  },
  size: 1269,
};

const multisigOfferSig = [
  "AABBRge2Ep77V-0IJqMRXkIY1D8xdk_OtHd-EcFWMzHyjXVAkMvfQtA6DTn5NOACCxmERr9vvmm7V5KeXRSPIqMB",
];

const multisigOfferEnd =
  "-LA35AACAA-e-exn-FABEBopw9UjL8plPiTfqJbb819-l2Jsr-0de7YXGxzKGRq40AAAAAAAAAAAAAAAAAAAAAAAEBopw9UjL8plPiTfqJbb819-l2Jsr-0de7YXGxzKGRq4-AABABCbsGn3CwRsUnzBhMitf8Mr6eHO5zv4-BNInB0rUTGhd86rIvz3kbzBqOBAAmbOOM4PwX08hzcgoomGk45cbxEO";

const ipexAdmitSerder = {
  kind: "JSON",
  raw: '{"v":"KERI10JSON0004b1_","t":"exn","d":"EIGHcMNSHqnRlQWy-tIg04k24wIy5_mqBfOXDhhAsHvx","i":"EHis8uP3C9jJ70OjwRfY9tLxvqefH7qVIazlpaVJI5zm","p":"","dt":"2024-08-15T08:44:16.867000+00:00","r":"/ipex/grant","q":{},"a":{"m":"","i":"EEozWLiY6DrCMCLfPqdBaIvUX1aUyjLKkT6-RxFrIMd9"},"e":{"acdc":{"v":"ACDC10JSON000197_","d":"EBJHAbtBAi8yYspNjLDaw0s5A7PZyjoj1lrhSE-Dn28r","i":"EEozWLiY6DrCMCLfPqdBaIvUX1aUyjLKkT6-RxFrIMd9","ri":"EPUFfq94pBLYKDRWyfOe7m-RKsET_zriJbfU3iUtM450","s":"EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao","a":{"d":"EIK0Xph_pH3RYIgLniWMuMVlgvoLK8eIICN7cIUJv2j8","i":"EHis8uP3C9jJ70OjwRfY9tLxvqefH7qVIazlpaVJI5zm","LEI":"5493001KJTIIGC8Y1R17","dt":"2024-08-15T08:44:13.141000+00:00"}},"iss":{"v":"KERI10JSON0000ed_","t":"iss","d":"EEuxEi0sa45nAcVQc_MwGh8EGK0Lh1pgiHY18hbh1yNF","i":"EBJHAbtBAi8yYspNjLDaw0s5A7PZyjoj1lrhSE-Dn28r","s":"0","ri":"EPUFfq94pBLYKDRWyfOe7m-RKsET_zriJbfU3iUtM450","dt":"2024-08-15T08:44:13.141000+00:00"},"anc":{"v":"KERI10JSON0000cd_","t":"ixn","d":"EK9x8RSjMJ_oxuBHIWftq5lYQcTW7WYZ3HwCT34s62jQ","i":"EEozWLiY6DrCMCLfPqdBaIvUX1aUyjLKkT6-RxFrIMd9","s":"1","p":"EBJHAbtBAi8yYspNjLDaw0s5A7PZyjoj1lrhSE-Dn28r","a":[{}]},"d":"EO_bCCneshP2lNWQ8gKSqyU9frP9V8Zo6tLczIHeXhXg"}}',
  ked: {
    v: "KERI10JSON000178_",
    t: "exn",
    d: "EOQf4E9vcTRVs5hsz4F1-zR7IaGV5O75GFE2el3LAmru",
    i: "ENEr59aBCXFU2TE6FyNc_Z7cZKv6PCqRFfXG6HrmSzdp",
    rp: "EBgG1lhkxiv_UQ8IiF2G4j5HQlnT5K5XZy_zRFg_EGCS",
    p: "ELI7vKj9mGu6BrYwjXOfco0SUThCBr8heO5q2g6OOVUJ",
    dt: "2024-10-04T02:19:09.287000+00:00",
    r: ExchangeRoute.IpexAdmit,
    q: {},
    a: {
      i: "EBgG1lhkxiv_UQ8IiF2G4j5HQlnT5K5XZy_zRFg_EGCS",
      m: "",
    },
    e: {},
  },
  size: 1201,
};

const ipexAdmitSig = [
  "AACfmWTQqrzUi9uSrnD439sFYFU95m4AFwLqihBzL94MltV7TFVOPKnFLl8z9O0hOyFCpspLmCPi9laBi7bocC8I",
];

const ipexAdmitEnd =
  " -LAg4AACA-e-acdc-IABEBJHAbtBAi8yYspNjLDaw0s5A7PZyjoj1lrhSE-Dn28r0AAAAAAAAAAAAAAAAAAAAAAAEEuxEi0sa45nAcVQc_MwGh8EGK0Lh1pgiHY18hbh1yNF-LAW5AACAA-e-iss-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAAAEK9x8RSjMJ_oxuBHIWftq5lYQcTW7WYZ3HwCT34s62jQ-LAa5AACAA-e-anc-AABAADHCaE5QMSHK1D83emSdbA5I6CvhRwmkMlGTm__zi4hB4dEvbcVPyexX1euccTCVW6pViLlqExvJBdz1J3PIgUI";

const ipexSubmitAdmitSerder = {
  kind: "JSON",
  raw: '{"v":"KERI10JSON00032d_","t":"exn","d":"EL3A2jk9gvmVe4ROISB2iWmM8yPSNwQlmar6-SFVWSPW","i":"EJ6cZ3ErT6857EAbYquE82waXZv2vftHTbBgtvNE3-J2","rp":"EDxLVG6ffRnsjqdvffpM4Id2W4q9APTu0Ej35sdjtKYN","p":"","dt":"2024-10-09T12:20:55.832000+00:00","r":"/multisig/exn","q":{},"a":{"i":"EDxLVG6ffRnsjqdvffpM4Id2W4q9APTu0Ej35sdjtKYN","gid":"EB6wkTnyxwgEgwgPv23OM-bWUSB_jdnlMIab9Q0JUNac"},"e":{"exn":{"v":"KERI10JSON000178_","t":"exn","d":"EJjQmGwlatWTgbaawivz0Qs-8O3XvburFSRLmi6fj25d","i":"EB6wkTnyxwgEgwgPv23OM-bWUSB_jdnlMIab9Q0JUNac","rp":"EBvkzD-Kn4bBQVjrpkjyh3PvUKF-9yuM3RYTvLK5k_5z","p":"EGic7AcZLZAwA_cLbXmzFZleQoitx_ghgQtv8E9QMShk","dt":"2024-10-09T12:20:43.875000+00:00","r":"/ipex/admit","q":{},"a":{"i":"EBvkzD-Kn4bBQVjrpkjyh3PvUKF-9yuM3RYTvLK5k_5z","m":""},"e":{}},"d":"EEtr51v8dSBepGheENmzRgySXbb5kkxibt7s-NyQyn_j"}}',
  ked: {
    v: "KERI10JSON00032d_",
    t: "exn",
    d: "EL3A2jk9gvmVe4ROISB2iWmM8yPSNwQlmar6-SFVWSPW",
    i: "EJ6cZ3ErT6857EAbYquE82waXZv2vftHTbBgtvNE3-J2",
    rp: "EDxLVG6ffRnsjqdvffpM4Id2W4q9APTu0Ej35sdjtKYN",
    p: "",
    dt: "2024-10-09T12:20:55.832000+00:00",
    r: NotificationRoute.MultiSigExn,
    q: {},
    a: {
      i: "EDxLVG6ffRnsjqdvffpM4Id2W4q9APTu0Ej35sdjtKYN",
      gid: "EB6wkTnyxwgEgwgPv23OM-bWUSB_jdnlMIab9Q0JUNac",
    },
    e: {
      exn: {
        v: "KERI10JSON000178_",
        t: "exn",
        d: "EJjQmGwlatWTgbaawivz0Qs-8O3XvburFSRLmi6fj25d",
        i: "EB6wkTnyxwgEgwgPv23OM-bWUSB_jdnlMIab9Q0JUNac",
        rp: "EBvkzD-Kn4bBQVjrpkjyh3PvUKF-9yuM3RYTvLK5k_5z",
        p: "EGic7AcZLZAwA_cLbXmzFZleQoitx_ghgQtv8E9QMShk",
        dt: "2024-10-09T12:20:43.875000+00:00",
        r: ExchangeRoute.IpexAdmit,
        q: {},
        a: {
          i: "EBvkzD-Kn4bBQVjrpkjyh3PvUKF-9yuM3RYTvLK5k_5z",
          m: "",
        },
        e: {},
      },
      d: "EEtr51v8dSBepGheENmzRgySXbb5kkxibt7s-NyQyn_j",
    },
  },
  size: 813,
};

const ipexSubmitAdmitSig = [
  "AABUXUS1XNVm2cwNDCNmzzyX5PdmKO8RfzfHwe5PfweuzYJdTyeHFqoSF-q5Fk0Wpt27FVpONnqlAkBNwoTKCwsA",
];

const ipexSubmitAdmitEnd =
  "-LA35AACAA-e-exn-FABEB6wkTnyxwgEgwgPv23OM-bWUSB_jdnlMIab9Q0JUNac0AAAAAAAAAAAAAAAAAAAAAAAEB6wkTnyxwgEgwgPv23OM-bWUSB_jdnlMIab9Q0JUNac-AABABDwPi6ZSD6AMwz-1VDbgGtVWMLUZKmbD6GHXqgYRdgklSO8x_qEwheY16XQvDz9uwpukMg2LyL9FBa64qu65xgE";

const credentialStateIssued = {
  vn: [1, 0],
  i: "EJd6GsxIhMXj1M8Ie0mq7oLgCcoEqp2p0YJIoh6wGa6M",
  s: "0",
  d: "EEFWKiBAQWh4RK2l_M8SxMZcPPsTaCG1-hIgl5Ve7Vy0",
  ri: "EEewa3h_r6kU-VW9RC-CvP6-ZBXhXQzzBQIMnI1_-_GX",
  ra: {},
  a: {
    s: 18,
    d: "EHQp2tuAj4RygtixT0QsYUtP6YW5L_yzPThBMwmaARlC",
  },
  dt: "2024-11-07T08:32:34.943000+00:00",
  et: "iss",
};

const credentialStateRevoked = {
  vn: [1, 0],
  i: "EJd6GsxIhMXj1M8Ie0mq7oLgCcoEqp2p0YJIoh6wGa6M",
  s: "0",
  d: "EEFWKiBAQWh4RK2l_M8SxMZcPPsTaCG1-hIgl5Ve7Vy0",
  ri: "EEewa3h_r6kU-VW9RC-CvP6-ZBXhXQzzBQIMnI1_-_GX",
  ra: {},
  a: {
    s: 18,
    d: "EHQp2tuAj4RygtixT0QsYUtP6YW5L_yzPThBMwmaARlC",
  },
  dt: "2024-11-07T08:32:34.943000+00:00",
  et: "rev",
};

export {
  QVISchema,
  credentialRecordProps,
  credentialMetadataRecord,
  grantForIssuanceExnMessage,
  applyForPresentingExnMessage,
  offerForPresentingExnMessage,
  agreeForPresentingExnMessage,
  admitForIssuanceExnMessage,
  groupIdentifierMetadataRecord,
  multisigExnOfferForPresenting,
  multisigExnAdmitForIssuance,
  multisigExnGrant,
  credentialRecord,
  getCredentialResponse,
  credentialProps,
  ipexOfferSerder,
  ipexOfferSig,
  multisigOfferSerder,
  multisigOfferSig,
  multisigOfferEnd,
  multisigParticipantsProps,
  ipexGrantSerder,
  ipexGrantSig,
  ipexGrantEnd,
  ipexSubmitGrantSerder,
  ipexSubmitGrantSig,
  ipexSubmitGrantEnd,
  ipexAdmitSerder,
  ipexAdmitSig,
  ipexAdmitEnd,
  ipexSubmitAdmitSerder,
  ipexSubmitAdmitSig,
  ipexSubmitAdmitEnd,
  credentialStateIssued,
  credentialStateRevoked,
};
