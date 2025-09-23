import {
  ExchangeRoute,
  NotificationRoute,
  Notification,
} from "../../agent/services/keriaNotificationService.types";
import { CredentialStatus } from "../../agent/services/credentialService.types";
import { MultiSigRoute } from "../../agent/services/multiSig.types";

const credentialMetadataMock = {
  type: "CredentialMetadataRecord",
  id: "EJuFvMGiT3uhEXtd7UQlkAm4N_MymeHfhkgnOgPhK0cJ",
  isArchived: false,
  pendingDeletion: false,
  createdAt: "2024-08-09T04:21:18.311Z",
  issuanceDate: "2024-08-09T04:21:12.575Z",
  credentialType: "Qualified vLEI Issuer Credential",
  status: CredentialStatus.CONFIRMED,
  connectionId: "EP0fEaRWZDR7caQbdserTOWlC_4trvqB1tzbr2xVo3a4",
  schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
  updatedAt: "2024-08-09T04:21:19.695Z",
};

const grantForIssuanceExnMessage = {
  exn: {
    v: "KERI10JSON000516_",
    t: "exn",
    d: "EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL",
    i: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
    rp: "EJ84hiNC0ts71HARE1ZkcnYAFJP0s-RiLNyzupnk7edn",
    p: "",
    dt: "2024-07-30T04:19:55.801000+00:00",
    r: ExchangeRoute.IpexGrant,
    q: {},
    a: {
      m: "",
      i: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
      gid: "gid",
    },
    e: {
      acdc: {
        d: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
        i: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
        s: "EBIFDhtSE0cM4nbTnaMqiV1vUIlcnbsqBMeVMmeGmXOu",
        ri: "EOIj7V-rqu_Q9aGSmPfviBceEtRk1UZBN5H2P_L-Hhx5",
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
    },
    e: {},
  },
  pathed: {},
};

const agreeForPresentingExnMessage = {
  exn: {
    v: "KERI10JSON000516_",
    t: "exn",
    d: "EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL",
    i: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
    p: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
    rp: "EBEWfIUOn789yJiNRnvKqpbWE3-m6fSDxtu6wggybbli",
    dt: "2024-07-30T04:19:55.801000+00:00",
    r: ExchangeRoute.IpexAgree,
    q: {},
    a: { m: "" },
    e: {},
  },
  pathed: {
    acdc: "-IABEEqfWy-6jx_FG0RNuNxZBh_jq6Lq1OPuvX5m3v1Bzxdn0AAAAAAAAAAAAAAAAAAAAAAAEHStOgwJku_Ln-YN2ohgWUH-CI07SyJnFppSbF8kG4PO",
    iss: "-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAAAEEO0xKzC8FOAXV-JgFZGgb0aIT2A3cPXPt9_0l_qcGM9",
    anc: "-AABAACBlQqbI_qNpKYkzIog6tauSgt0XufBvGtrumfbnhSInFjSwnaIqZi353QT-c1W_gE9KIz3rgX5QNNWLcqA7bcM",
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
  pathed: {},
};

const multisigExnApplyForPresenting = {
  exn: {
    r: MultiSigRoute.EXN,
    a: {
      gid: "EE8_Xc0ZUh_sUJLtmBpVSEr-RFS2mRUIpFyL-pmvtPvP",
    },
    e: {
      exn: {
        p: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
        r: ExchangeRoute.IpexApply,
      },
      d: "EE8_Xc0ZUh_sUJLtmBpVSEr-RFS2mRUIpFyL-pmvtPsvx",
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
  pathed: {},
};

const notificationMultisigRpyProp = {
  i: "string",
  dt: "2023-06-12T14:07:53.224866+00:00",
  r: false,
  a: {
    r: NotificationRoute.MultiSigRpy,
    d: "string",
    m: "",
  },
};

const notificationMultisigExnProp = {
  i: "string",
  dt: "2023-06-12T14:07:53.224866+00:00",
  r: false,
  a: {
    r: NotificationRoute.MultiSigExn,
    d: "string",
    m: "",
  },
};

const notificationMultisigIcpProp = {
  i: "string",
  dt: "2023-06-12T14:07:53.224866+00:00",
  r: false,
  a: {
    r: NotificationRoute.MultiSigIcp,
    d: "string",
    m: "",
  },
};

const notificationIpexGrantProp = {
  i: "string",
  dt: "2023-06-12T14:07:53.224866+00:00",
  r: false,
  a: {
    r: NotificationRoute.ExnIpexGrant,
    d: "string",
    m: "",
  },
};

const notificationIpexAgreeProp = {
  i: "string",
  dt: "2024-12-10T07:28:18.217384+00:00",
  r: false,
  a: {
    r: NotificationRoute.ExnIpexAgree,
    d: "string",
    m: "",
  },
};

const notificationIpexApplyProp = {
  i: "string",
  dt: "2023-06-12T14:07:53.224866+00:00",
  r: false,
  a: {
    r: NotificationRoute.ExnIpexApply,
    d: "string",
    m: "",
  },
};

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

const notificationIpexOfferProp = {
  i: "string",
  dt: "2023-06-12T14:07:53.224866+00:00",
  r: false,
  a: {
    r: NotificationRoute.ExnIpexOffer,
    d: "string",
    m: "",
  },
};

const groupIdentifierMetadataRecord = {
  type: "IdentifierMetadataRecord",
  id: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
  displayName: "holder",
  groupMemberPre: "EAL7pX9Hklc_iq7pkVYSjAilCfQX3sr5RbX76AxYs2UH",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const hab = {
  name: "00:Display name",
  prefix: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
  state: {
    vn: [1, 0],
    i: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
    s: "0",
    p: "",
    d: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
    f: "0",
    dt: "2024-08-09T07:23:52.839894+00:00",
    et: "icp",
    kt: "1",
    k: ["DM_vaN_p23a0DpK7brjTgaVWvIuL84G5UwNxY6M-Mv8Y"],
    nt: "1",
    n: ["EOvYVOWhxNxjlm5NYaxX0ivrZ7TqU9syRZPQdU1Yykzk"],
    bt: "3",
    b: [],
    c: [],
    ee: {
      s: "0",
      d: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
      br: [],
      ba: [],
    },
    di: "",
  },
  icp_dt: "2024-08-09T07:23:52.839894+00:00",
};

const findNotificationsResult = [
  {
    id: "0AC0W27tnnd2WyHWUh-368EI",
    createdAt: new Date("2024-08-09T07:23:52.839894+00:00"),
    a: { r: NotificationRoute.ExnIpexGrant },
    read: false,
    connectionId: "ED_3K5-VPI8N3iRrV7o75fIMOnJfoSmEJy679HTkWsFQ",
    receivingPre: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
    linkedRequest: { accepted: false },
    hidden: false,
  },
  {
    id: "0AC0W34tnnd2WyUCOy-790AY",
    createdAt: new Date("2024-08-09T07:23:52.839894+00:00"),
    a: { r: NotificationRoute.ExnIpexOffer },
    read: false,
    connectionId: "ED_5C2-UOA8N3iRrV7o75fIMOnJfoSmYAe829YCiSaVB",
    receivingPre: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
    linkedRequest: { accepted: false },
    hidden: false,
  },
];

const humanReadableExn = {
  exn: {
    v: "KERI10JSON000149_",
    t: "exn",
    d: "EGUCiIyweXtkmgAmvxHHjavfDKBnmbRbFiQ8wBPZuBdJ",
    i: "EMfeMGnsFnFC0L5awstpS_eSlHiFFb434_WplA6IKFpT",
    rp: "EBZNh4ChnTeP7R5CxL-IuGNm7TwKu-5ZnrbKToIbm7-d",
    p: "",
    dt: "2025-05-02T10:16:50.817000+00:00",
    r: "/hmessage",
    q: {},
    a: {
      m: "Certificate created",
      t: "Certificate created",
      st: "Everything is now fully signed",
      c: ["First paragraph", "Second paragraph"],
    },
    e: {},
  },
  pathed: {},
};

const humanReadableLinkedExn = {
  exn: {
    ...humanReadableExn.exn,
    a: {
      ...humanReadableExn.exn.a,
      l: {
        t: "View certificate",
        a: "http://test.com",
      },
    },
  },
  pathed: {},
};

const humanReadableNotification: Notification = {
  i: "0ADfXs42uwqd9lYDesWYJVFD",
  dt: "2025-05-01T11:33:20.613745+00:00",
  r: false,
  a: {
    r: "/exn/hmessage",
    d: "EGUCiIyweXtkmgAmvxHHjavfDKBnmbRbFiQ8wBPZuBdJ",
    m: "View certificate",
  },
};

const remoteSignReqNotification = {
  i: "0ADfXs42uwqd9lYDesWYJVFD",
  dt: "2025-05-01T11:33:20.613745+00:00",
  r: false,
  a: {
    r: "/exn/remotesign/ixn/req",
    d: "EMAFpQQYEoGVtNP6jTijgeap3UQB5LoY3U3FlyCdAsTE",
  },
};

const coordinationCredentialsInfoReqExn = {
  exn: {
    i: "E4Zq5_A-rV21bAgI2bBF21s3I4wT9xWjXG0iIe_q_h_p",
    p: "",
    a: {
      s: "E4Zq5_A-rV21bAgI2bBF21s3I4wT9xWjXG0iIe_q_h_p",
    },
    e: {},
    d: "E4Zq5_A-rV21bAgI2bBF21s3I4wT9xWjXG0iIe_q_h_p",
    r: "/exn/coordination/credentials/info/req",
    rp: "E4Zq5_A-rV21bAgI2bBF21s3I4wT9xWjXG0iIe_q_h_p",
  },
};

const notificationCoordinationCredentialsInfoReqProp = {
  i: "notification-id-for-coord-req",
  dt: new Date().toISOString(),
  r: false,
  a: {
    r: NotificationRoute.ExnCoordinationCredentialsInfoReq,
    d: "E4Zq5_A-rV21bAgI2bBF21s3I4wT9xWjXG0iIe_q_h_p",
    s: "A4Zq5_A-rV21bAgI2bBF21s3I4wT9xWjXG0iIe_q_h_p",
  },
};

export {
  credentialMetadataMock,
  grantForIssuanceExnMessage,
  applyForPresentingExnMessage,
  agreeForPresentingExnMessage,
  multisigExnAdmitForIssuance,
  multisigExnOfferForPresenting,
  multisigExnApplyForPresenting,
  multisigExnGrant,
  getCredentialResponse,
  notificationMultisigRpyProp,
  notificationMultisigExnProp,
  notificationMultisigIcpProp,
  notificationIpexGrantProp,
  notificationIpexAgreeProp,
  notificationIpexApplyProp,
  credentialStateIssued,
  notificationIpexOfferProp,
  groupIdentifierMetadataRecord,
  hab,
  findNotificationsResult,
  humanReadableExn,
  humanReadableLinkedExn,
  humanReadableNotification,
  remoteSignReqNotification,
  coordinationCredentialsInfoReqExn,
  notificationCoordinationCredentialsInfoReqProp,
};
