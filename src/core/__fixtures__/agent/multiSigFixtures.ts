import { CreateIdentifierBody, Tier } from "signify-ts";
import { ConnectionStatus, CreationStatus } from "../../agent/agent.types";
import {
  IdentifierMetadataRecord,
  IdentifierMetadataRecordProps,
} from "../../agent/records";
import { QueuedGroupCreation } from "../../agent/services/identifier.types";

const now = new Date();

const memberMetadataRecordProps: IdentifierMetadataRecordProps = {
  id: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
  displayName: "Identifier 2",
  createdAt: now,
  theme: 0,
  groupMetadata: {
    groupId: "group-id",
    groupInitiator: true,
    groupCreated: false,
  },
};

const memberMetadataRecord = new IdentifierMetadataRecord(
  memberMetadataRecordProps
);

const multisigMetadataRecord = {
  type: "IdentifierMetadataRecord",
  id: "EMkbq07RZoANCxluzl3zb8WfBkqDl-HMb0osYZckDWXg",
  displayName: "identifier",
  isDeleted: false,
  creationStatus: CreationStatus.COMPLETE,
  groupMemberPre: "EP_DgYAq7TCCyH9FohNjniJsEJTq7LjrNr_6M5zXbu91",
  theme: 1,
} as IdentifierMetadataRecord;

const getMemberIdentifierResponse = {
  name: "00:groupid:groupName",
  prefix: memberMetadataRecord.id,
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

const getMultisigIdentifierResponse = {
  name: "00:group",
  prefix: "ELWFo-DV4GujnvcwwIbzTzjc-nIf0ijv6W1ecajvQYBY",
  state: {
    vn: [1, 0],
    i: "ELWFo-DV4GujnvcwwIbzTzjc-nIf0ijv6W1ecajvQYBY",
    s: "0",
    p: "",
    d: "ELWFo-DV4GujnvcwwIbzTzjc-nIf0ijv6W1ecajvQYBY",
    f: "0",
    dt: "2024-07-24T02:22:14.257271+00:00",
    et: "icp",
    kt: "1",
    k: [
      "DIH7-xjcUC-xPS9I32b0ftZAT6gHJvfHiBR4UwxtWuEO",
      "DEbgy9MjAL-_cbSSKnf4-ex7QSrd-RoMZ12NzYFp6nX6",
    ],
    nt: "1",
    n: [
      "EGd8MBVVtKu-wjwsgw2fyKyhNZDnwH7zuI7ezUlm6ZwD",
      "EMrI55rI2XYkU5XakW_Okt012RjaC6zLZblvjcUm851t",
    ],
    bt: "0",
    b: [],
    c: [],
    ee: {
      s: "0",
      d: "ELWFo-DV4GujnvcwwIbzTzjc-nIf0ijv6W1ecajvQYBY",
      br: [],
      ba: [],
    },
    di: "",
  },
  icp_dt: "2024-08-10T07:23:54.839894+00:00",
};

const memberIdentifierRecord = {
  _tags: {
    groupId: "08f22dee-8cb0-4d65-8600-a82bbc3f6fd7",
    isDeleted: false,
    creationStatus: CreationStatus.COMPLETE,
    groupCreated: true,
  },
  type: "IdentifierMetadataRecord",
  id: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
  displayName: "multi-sig",
  isDeleted: false,
  creationStatus: CreationStatus.COMPLETE,
  createdAt: new Date("2024-06-28T03:54:03.514Z"),
  theme: 0,
  groupMetadata: {
    groupId: "08f22dee-8cb0-4d65-8600-a82bbc3f6fd7",
    groupInitiator: true,
    groupCreated: true,
  },
  updatedAt: new Date("2024-06-28T03:55:04.260Z"),
} as IdentifierMetadataRecordProps;

const getMultisigMembersResponse = {
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
          BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM: {
            http: "http://witness-demo:5643/",
            tcp: "tcp://witness-demo:5633/",
          },
          "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX": {
            http: "http://witness-demo:5644/",
            tcp: "tcp://witness-demo:5634/",
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
          BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM: {
            http: "http://witness-demo:5643/",
            tcp: "tcp://witness-demo:5633/",
          },
          "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX": {
            http: "http://witness-demo:5644/",
            tcp: "tcp://witness-demo:5634/",
          },
        },
      },
    },
  ],
  rotation: [
    {
      aid: "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF",
      ends: {
        agent: {
          EPzYLVzso0TWZS8_pZ4Ryea4xE3Sobf7Q0poSvELdwb7: {
            http: "http://keria:3902/",
          },
        },
        witness: {
          "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha": {
            http: "http://witness-demo:5642/",
            tcp: "tcp://witness-demo:5632/",
          },
          BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM: {
            http: "http://witness-demo:5643/",
            tcp: "tcp://witness-demo:5633/",
          },
          "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX": {
            http: "http://witness-demo:5644/",
            tcp: "tcp://witness-demo:5634/",
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
          BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM: {
            http: "http://witness-demo:5643/",
            tcp: "tcp://witness-demo:5633/",
          },
          "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX": {
            http: "http://witness-demo:5644/",
            tcp: "tcp://witness-demo:5634/",
          },
        },
      },
    },
  ],
};

const gHab = {
  name: "holder",
  prefix: "EFr4DyYerYKgdUq3Nw5wbq7OjEZT6cn45omHCiIZ0elD",
  group: {
    mhab: {
      name: "member1",
      prefix: "ELwIeWvrmPiK862H9Xzqy6MfiK9FPXQ3GlZpMJlz-CnO",
      salty: {
        sxlt: "1AAH1ccow-kQlS5EtY5ux05hNkX_pgmLq51zZ4ynP0hdHD1f8qkC0SqXM1D4C_OjSV_Ei4sbf1UEx8BOWoQJP0jPgQWF_K0DhPVC",
        pidx: 0,
        kidx: 0,
        stem: "signify:aid",
        tier: "low",
        dcode: "E",
        icodes: ["A"],
        ncodes: ["A"],
        transferable: true,
      },
      transferable: true,
      state: {
        vn: [1, 0],
        i: "ELwIeWvrmPiK862H9Xzqy6MfiK9FPXQ3GlZpMJlz-CnO",
        s: "0",
        p: "",
        d: "ELwIeWvrmPiK862H9Xzqy6MfiK9FPXQ3GlZpMJlz-CnO",
        f: "0",
        dt: "2024-08-09T08:46:24.797871+00:00",
        et: "icp",
        kt: "1",
        k: ["DAgW2DcJTYyrB90WwvzB8YxX7pCydK-umI4-rl7yE8gL"],
        nt: "1",
        n: ["EEAlQCVdmFoP1cmswOt5lOyePJ1QuBMmxKMshBQH7RfG"],
        bt: "3",
        b: [
          "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
          "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
          "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX",
        ],
        c: [],
        ee: {
          s: "0",
          d: "ELwIeWvrmPiK862H9Xzqy6MfiK9FPXQ3GlZpMJlz-CnO",
          br: [],
          ba: [],
        },
        di: "",
      },
      windexes: [0, 1, 2],
    },
    keys: [
      "DAgW2DcJTYyrB90WwvzB8YxX7pCydK-umI4-rl7yE8gL",
      "DB-MSRz5mltK4VKoUD7c_xm5WDSOKNqIiP7tW2hVybrl",
    ],
    ndigs: [
      "EEAlQCVdmFoP1cmswOt5lOyePJ1QuBMmxKMshBQH7RfG",
      "EDdBHEj9V2yopJFgR43uKVwFm2J4-D_vsSv3xWVHks5j",
    ],
  },
  transferable: true,
  state: {
    vn: [1, 0],
    i: "EMoyFLuJpu0B79yPM7QKFE_R_D4CTq7H7GLsKxIpukXX",
    s: "0",
    p: "",
    d: "EMoyFLuJpu0B79yPM7QKFE_R_D4CTq7H7GLsKxIpukXX",
    f: "0",
    dt: "2024-08-09T08:46:52.600648+00:00",
    et: "icp",
    kt: "2",
    k: [
      "DAgW2DcJTYyrB90WwvzB8YxX7pCydK-umI4-rl7yE8gL",
      "DB-MSRz5mltK4VKoUD7c_xm5WDSOKNqIiP7tW2hVybrl",
    ],
    nt: "2",
    n: [
      "EEAlQCVdmFoP1cmswOt5lOyePJ1QuBMmxKMshBQH7RfG",
      "EDdBHEj9V2yopJFgR43uKVwFm2J4-D_vsSv3xWVHks5j",
    ],
    bt: "3",
    b: [
      "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
      "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
      "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX",
    ],
    c: [],
    ee: {
      s: "0",
      d: "EMoyFLuJpu0B79yPM7QKFE_R_D4CTq7H7GLsKxIpukXX",
      br: [],
      ba: [],
    },
    di: "",
  },
  windexes: [0, 1, 2],
};

const mHab = {
  name: "member",
  prefix: "EF06lxIajm6o4pm0RfWQLzbn2dlMssc6keIL95Ux_ipo",
  salty: {
    sxlt: "1AAH6zRgnjBT3f_Dp5bW2GV3h01mZEXsgCd5v1h2zn4HXiQu1nidjbrvSN5MSor_-MrmJ5x9IC9A5S5rg3JcJ49ZCa1c1BnGnf3s",
    pidx: 0,
    kidx: 0,
    stem: "signify:aid",
    tier: "low",
    dcode: "E",
    icodes: ["A"],
    ncodes: ["A"],
    transferable: true,
  },
  transferable: true,
  state: {
    vn: [1, 0],
    i: "EF06lxIajm6o4pm0RfWQLzbn2dlMssc6keIL95Ux_ipo",
    s: "0",
    p: "",
    d: "EF06lxIajm6o4pm0RfWQLzbn2dlMssc6keIL95Ux_ipo",
    f: "0",
    dt: "2024-08-09T08:57:09.153532+00:00",
    et: "icp",
    kt: "1",
    k: ["DG3hEoRU0xAAXeQyIp-4ZjSDek4Th3Nwu8JEf8i0OwUV"],
    nt: "1",
    n: ["EDc8hJDL15LfjaAT8WsUnEcx3e0Hz59ge4Uf6krmRIK1"],
    bt: "3",
    b: [
      "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
      "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
      "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX",
    ],
    c: [],
    ee: {
      s: "0",
      d: "EF06lxIajm6o4pm0RfWQLzbn2dlMssc6keIL95Ux_ipo",
      br: [],
      ba: [],
    },
    di: "",
  },
  windexes: [0, 1, 2],
};

const multisigExnIpexGrantSerder = {
  kind: "JSON",
  raw: "{\"v\":\"KERI10JSON00025f_\",\"t\":\"exn\",\"d\":\"EFnDzHLeULKSm_jbQSIN427yWWFr82OBkkxg3iUf2FUW\",\"i\":\"EGUORQAs0r1mup1OmX1H23PITDV7td-o2XGdMVL6lmmk\",\"p\":\"\",\"dt\":\"2024-08-02T03:53:30.133000+00:00\",\"r\":\"/multisig/exn\",\"q\":{},\"a\":{\"gid\":\"EPIKswKD9AiVxIqU4QLn14qpNuiAfgVGzoK-HVU0znjC\"},\"e\":{\"exn\":{\"v\":\"KERI10JSON000111_\",\"t\":\"exn\",\"d\":\"EMTArfbjevIfB-fbxzsepKO35RWHN2gQxTTU5Lov2Dld\",\"i\":\"EPIKswKD9AiVxIqU4QLn14qpNuiAfgVGzoK-HVU0znjC\",\"p\":\"EH-_9IgodejkwXi2Hw--A53rVYcO6bDYnBrbpCId8LOu\",\"dt\":\"2024-08-02T03:53:29.400000+00:00\",\"r\":\"/ipex/admit\",\"q\":{},\"a\":{\"m\":\"\"},\"e\":{}},\"d\":\"ECxCLDUf8A1y62wf7YkWAcj5RN-KVzNaxRefzgE7oIjq\"}}",
  ked: {
    v: "KERI10JSON00066c_",
    t: "exn",
    d: "EEpfEHR6EedLnEzleK7mM3AKJSoPWuSQeREC8xjyq3pa",
    i: "EN-5a2OQkuImwAJh5o-SXx2Db-az-ZQo0EmHv4SK-xxw",
    p: "",
    dt: "2024-08-09T10:27:01.653000+00:00",
    r: "/multisig/exn",
    q: {},
    a: { gid: "EOfnSCpCa3XmSTUZ7vEgEJoYbruyiYIbl5DYsAwooXTY" },
    e: {
      exn: {
        v: "KERI10JSON00051e_",
        t: "exn",
        d: "EHCV5Bm4IZiICVzUTaiyoWqeA1YB-idHU0X5Pckac18I",
        i: "EOfnSCpCa3XmSTUZ7vEgEJoYbruyiYIbl5DYsAwooXTY",
        p: "",
        dt: "2024-08-09T10:27:00.155000+00:00",
        r: "/ipex/grant",
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
              d: "EA4LhtGr8YjfZV3d6NpoM6zHILhDi48ETUfAwwovv4w4",
              i: "ENDDYy0SVuFOI3rEnB3HbNFB_BFjhl4fQbZSeDZHGQf9",
              dt: "2024-08-09T10:26:43.853000+00:00",
              LEI: "5493001KJTIIGC8Y1R17",
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
                i: "EK0IO8nKiSEi6hQKRj5f4YjLkMSSonoxkFLwP1YgycJ1",
                s: "0",
                d: "EN3heuFbxVO29fXp87-tisLFKJ7hX2U2gISCRFBLzE0E",
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

const multisigExnIpexGrantSig = [
  "ABB5MNMwQNwDxo4hhNYdF2hjzJQfZe6nfjdO_WfjvnxJwkRMrkrbapdjW8BStprjhxASVKWHmWOEFVpGWwmDpyIP",
];

const multisigExnIpexGrantEnd =
  "-LA35AACAA-e-exn-FABEPIKswKD9AiVxIqU4QLn14qpNuiAfgVGzoK-HVU0znjC0AAAAAAAAAAAAAAAAAAAAAAAEPIKswKD9AiVxIqU4QLn14qpNuiAfgVGzoK-HVU0znjC-AABAABTAefC5IBObzL5ZteOa6me6iLQXV1v1rTcsBOrJDfk6uwRfR1nxm2DKWxehRMHEdq6YlqxysCdWfVBIvd4t3gH";

const resolvedOobiOpResponse = {
  op: {
    name: "oobi.ABi0yV6LhFudjaGT4wkCNpVChyHOSFii_idAIAEhyfot",
    metadata: {
      oobi: "http://keria:3902/oobi/EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7/agent/EFv5qAoixFv0WwsekWSqS5ypXQUl2f_N4j8GGURs3QUT",
    },
    done: true,
    error: null,
    response: {
      vn: [1, 0],
      i: "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
      s: "0",
      p: "",
      d: "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
      f: "0",
      dt: "2024-08-09T11:04:09.343208+00:00",
      et: "icp",
      kt: "1",
      k: ["DLt2-jru3tSgE9Ui2dSRCYy5BJjWsyGXsX7klF_ecylO"],
      nt: "1",
      n: ["EIxuzxaSiS6HHdff1M8vzkRlJSFK4YwpD813PPmnBZSe"],
      bt: "3",
      b: [
        "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
        "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
        "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX",
      ],
      c: [],
      ee: {
        s: "0",
        d: "EH_rgokxkQE886aZf7ZRBgqN2y6aALPAmUvI5haK4yr7",
        br: [],
        ba: [],
      },
      di: "",
    },
  },
  alias: "alias",
  connection: {},
};

const initiatorConnectionShortDetails = {
  id: "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ",
  label: "f4732f8a-1967-454a-8865-2bbf2377c26e",
  oobi: "http://127.0.0.1:3902/oobi/EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ/agent/EF_dfLFGvUh9kMsV2LIJQtrkuXWG_-wxWzC_XjCWjlkQ",
  status: ConnectionStatus.CONFIRMED,
  createdAtUTC: new Date().toISOString(),
};

const notificationMultisigExnRotation = {
  id: "EBRg2Ur0JYi92jP0r0ZEO385sWr_8KNMqRIsv9s2JUFI",
  createdAt: new Date().toISOString(),
  a: {
    d: "EKE4luv7mA_z5Tg4ZCHnWLPTKcEPcyDuPL_ql_ChwwZx",
    r: "/multisig/exn",
    m: "",
  },
  connectionId: "EGR7Jm38EcsXRIidKDZBYDm_xox6eapfU1tqxdAUzkFd",
  read: true,
};

const getRequestMultisigIcp = {
  exn: {
    v: "KERI10JSON000735_",
    t: "exn",
    d: "EI8fS00-AxbbqXmwoivpw-0ui0qgZtGbh8Ue-ZVbxYS-",
    i: "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ",
    p: "",
    dt: "2024-08-19T10:20:54.591000+00:00",
    r: "/multisig/icp",
    q: {},
    a: {
      gid: "EBHG7UW-48EAF4bMYbaCsPQfSuFk-INidVXLexDMk6pN",
      smids: [
        "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
        "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ",
      ],
      rmids: [
        "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
        "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ",
      ],
      rstates: [
        {
          vn: [1, 0],
          i: "ELLb0OvktIxeHDeeOnRJ2pc9IkYJ38An4PXYigUQ_3AO",
          s: "0",
          p: "",
          d: "ELLb0OvktIxeHDeeOnRJ2pc9IkYJ38An4PXYigUQ_3AO",
          f: "0",
          dt: "2024-08-19T10:15:45.995222+00:00",
          et: "icp",
          kt: "1",
          k: ["DF3YsSD2hvoQDDUPL39AtMOPou0IXUPdXoslqtAK70AC"],
          nt: "1",
          n: ["EN9Gd-_TlXafq_8EEHOy_HZQyqYLj2_fW_JvbyNeDvpC"],
          bt: "0",
          b: [],
          c: [],
          ee: {
            s: "0",
            d: "ELLb0OvktIxeHDeeOnRJ2pc9IkYJ38An4PXYigUQ_3AO",
            br: [],
            ba: [],
          },
          di: "",
        },
        {
          vn: [1, 0],
          i: "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ",
          s: "0",
          p: "",
          d: "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ",
          f: "0",
          dt: "2024-08-19T10:20:40.417504+00:00",
          et: "icp",
          kt: "1",
          k: ["DJQU5RElChMsVUPbsbITts-rb564VYznYougeh2onWS4"],
          nt: "1",
          n: ["EOWP49ymarMj78Xjct0UnN25e9kRHYdKqQ6ZfK0YxQ85"],
          bt: "0",
          b: [],
          c: [],
          ee: {
            s: "0",
            d: "EKlUo3CAqjPfFt0Wr2vvSc7MqT9WiL2EGadRsAP3V1IJ",
            br: [],
            ba: [],
          },
          di: "",
        },
      ],
      name: "70498152-ffed-452f-8db5-59935b53bb40",
    },
    e: {
      icp: {
        v: "KERI10JSON000189_",
        t: "icp",
        d: "EBHG7UW-48EAF4bMYbaCsPQfSuFk-INidVXLexDMk6pN",
        i: "EBHG7UW-48EAF4bMYbaCsPQfSuFk-INidVXLexDMk6pN",
        s: "0",
        kt: "2",
        k: [
          "DF3YsSD2hvoQDDUPL39AtMOPou0IXUPdXoslqtAK70AC",
          "DJQU5RElChMsVUPbsbITts-rb564VYznYougeh2onWS4",
        ],
        nt: "2",
        n: [
          "EN9Gd-_TlXafq_8EEHOy_HZQyqYLj2_fW_JvbyNeDvpC",
          "EOWP49ymarMj78Xjct0UnN25e9kRHYdKqQ6ZfK0YxQ85",
        ],
        bt: "4",
        b: [
          "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
          "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
          "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX",
          "BM35JN8XeJSEfpxopjn5jr7tAHCE5749f0OobhMLCorE",
          "BIj15u5V11bkbtAxMA7gcNJZcax-7TgaBMLsQnMHpYHP",
          "BF2rZTW79z4IXocYRQnjjsOuvFUQv-ptCf8Yltd7PfsM",
        ],
        c: [],
        a: [],
      },
      d: "ELn2y_BHqVhW4JR5xvev4owCavz9t2cHfVs7ZmB-S2uO",
    },
  },
  paths: {
    icp: "-AABAADSDDjDH9It5BHpwj7hufTqlxGlAIlq6SkT9oaCxAMb2emBU-jgY60pIe7prYJJAzQglcyLGB1F_U4HKr6ncWEL",
  },
};

const getExchangeGrantMessage = {
  exn: {
    v: "KERI10JSON00054a_",
    t: "exn",
    d: "ENWC07JjS0R1NYHDd2ZFGayMA42r7ow9QxKRiD37DUs7",
    i: "EA1r4XIfyob03nijT7jOsJ6gXLjCcaD_ReZxoWzU2p9h",
    rp: "EPy-YsdV2wcohLkL9RdCboet2o6EFxSUP1MJ4bgNPw7G",
    p: "",
    dt: "2024-09-18T03:51:55.780000+00:00",
    r: "/ipex/grant",
    q: {},
    a: {
      i: "EPy-YsdV2wcohLkL9RdCboet2o6EFxSUP1MJ4bgNPw7G",
      m: "",
    },
    e: {
      acdc: {
        v: "ACDC10JSON00018f_",
        d: "EErIOmrF9QwX5zg7ksVqDht4jHj-UTPJ1gMz6EctqiTh",
        i: "EA1r4XIfyob03nijT7jOsJ6gXLjCcaD_ReZxoWzU2p9h",
        ri: "EJBrpuX4E3Gpm-ost9ikpwCOZgBOgDeRaScuuRl_jhJE",
        s: "EJxnJdxkHbRw2wVFNe4IUOPLt8fEtg9Sr3WyTjlgKoIb",
        a: {
          d: "EJWnd0z2l0vvAs_y9jZ_cX5LrWWyOzHqXc2fqE3IK40U",
          i: "EPy-YsdV2wcohLkL9RdCboet2o6EFxSUP1MJ4bgNPw7G",
          attendeeName: "123",
          dt: "2024-09-18T03:51:55.258000+00:00",
        },
      },
      iss: {
        v: "KERI10JSON0000ed_",
        t: "iss",
        d: "EHZJEklSifPdSy1t9HcgGER8NxzTZu_qBsM5zV2vXARe",
        i: "EErIOmrF9QwX5zg7ksVqDht4jHj-UTPJ1gMz6EctqiTh",
        s: "0",
        ri: "EJBrpuX4E3Gpm-ost9ikpwCOZgBOgDeRaScuuRl_jhJE",
        dt: "2024-09-18T03:51:55.258000+00:00",
      },
      anc: {
        v: "KERI10JSON00013a_",
        t: "ixn",
        d: "ENWczSEc4XFdqMMldRVBQylDDXdoK5QJ9aatC4Q-jEpH",
        i: "EA1r4XIfyob03nijT7jOsJ6gXLjCcaD_ReZxoWzU2p9h",
        s: "9",
        p: "EMw0YuNgl_g-KTNVEZja7oiYUA54Bmq8xdVGjcZtzrgb",
        a: [
          {
            i: "EErIOmrF9QwX5zg7ksVqDht4jHj-UTPJ1gMz6EctqiTh",
            s: "0",
            d: "EHZJEklSifPdSy1t9HcgGER8NxzTZu_qBsM5zV2vXARe",
          },
        ],
      },
      d: "ECwwzX4gP2CYV1i4o_iYQ7oLAvDoGK3q1EhnK58Jrpsh",
    },
  },
  pathed: {
    acdc: "-IABEErIOmrF9QwX5zg7ksVqDht4jHj-UTPJ1gMz6EctqiTh0AAAAAAAAAAAAAAAAAAAAAAAEHZJEklSifPdSy1t9HcgGER8NxzTZu_qBsM5zV2vXARe",
    iss: "-VAS-GAB0AAAAAAAAAAAAAAAAAAAAAAAENWczSEc4XFdqMMldRVBQylDDXdoK5QJ9aatC4Q-jEpH",
    anc: "-AABAABQ2IulOkf_ExRjgm83rVpUvWYaiY3W0gCWZ4oCh0fdM_pHXyMYf40gihUpN8Uzs4OzUXb6o-F-Uf8VKgw-CVkO",
  },
};

const memberKeyStateIcp = {
  name: "query.AM3es3rJ201QzbzYuclUipYzgzysegLeQsjRqykNrmwC",
  metadata: {
    sn: "1",
  },
  done: true,
  error: null,
  response: {
    vn: [1, 0],
    i: "EJwDuZ8YpU-1g6QVwioZG-PmyufLXaDHXvfFLWkqENeL",
    s: "0",
    p: "",
    d: "EJwDuZ8YpU-1g6QVwioZG-PmyufLXaDHXvfFLWkqENeL",
    f: "0",
    dt: "2024-07-23T08:58:23.530757+00:00",
    et: "icp",
    kt: "1",
    k: ["DI3bh31vfuGyV14LvtBxHHljnDnSqbKQ7DZ9iiB_51Oh"],
    nt: "1",
    n: ["EEhLvnvKE4eTV17ts4ngXOmri7gJA9Gs0593MCAMQjTu"],
    bt: "0",
    b: [],
    c: [],
    ee: {
      s: "0",
      d: "EJwDuZ8YpU-1g6QVwioZG-PmyufLXaDHXvfFLWkqENeL",
      br: [],
      ba: [],
    },
    di: "",
  },
};

const rotatedMemberAid = "EJwDuZ8YpU-1g6QVwioZG-PmyufLXaDHXvfFLWkqENeL";
const memberKeyStateRot = {
  name: "query.AM3es3rJ201QzbzYuclUipYzgzysegLeQsjRqykNrmwC",
  metadata: {
    sn: "1",
  },
  done: true,
  error: null,
  response: {
    vn: [1, 0],
    i: rotatedMemberAid,
    s: "1",
    p: rotatedMemberAid,
    d: "ELxPbNybLoBLM0EPmI9oHb6Yp40UcT-lN1JAST3sD3b9",
    f: "0",
    dt: "2024-07-23T08:59:16.747281+00:00",
    et: "rot",
    kt: "1",
    k: ["DIH7-xjcUC-xPS9I32b0ftZAT6gHJvfHiBR4UwxtWuEO"],
    nt: "1",
    n: ["EKIctKY0IGPbd7njANV6P-ANncFr1kRUZgKGGzCfzNnG"],
    bt: "0",
    b: [],
    c: [],
    ee: {
      s: "0",
      d: "EGvWn-Zv7DXa8-Te6nTBb2vWUOsDQHPdaKshNUMjJssB",
      br: [],
      ba: [],
    },
    di: "",
  },
};

const inceptionDataFix: CreateIdentifierBody = {
  name: "id1",
  icp: {
    v: "KERI10JSON0001e7_",
    t: "icp",
    d: "EP10ooRj0DJF0HWZePEYMLPl-arMV-MAoTKK-o3DXbgX",
    i: "EP10ooRj0DJF0HWZePEYMLPl-arMV-MAoTKK-o3DXbgX",
    s: "0",
    kt: "2",
    k: [
      "DGBw7C7AfC7jbD3jLLRS3SzIWFndM947TyNWKQ52iQx5",
      "DD_bHYFsgWXuCbz3SD0HjCIe_ITjRvEoCGuZ4PcNFFDz",
    ],
    nt: "2",
    n: [
      "EML5FrjCpz8SEl4dh0U15l8bMRhV_O5iDcR1opLJGBSH",
      "EJpKquuibYTqpwMDqEFAFs0gwq0PASAHZ_iDmSF3I2Vg",
    ],
    bt: "0",
    b: [],
    c: [],
    a: [],
  },
  sigs: [
    "AAD9_IgPaUEBjAl1Ck61Jkn78ErzsnVkIxpaFBYSdSEAW4NbtXsLiUn1olijzdTQYn_Byq6MaEk-eoMN3Oc0WEEC",
    "ABBWJ7KkAXXiRK8JyEUpeARHJTTzlBHu_ev-jUrNEhV9sX4_4lI7wxowrQisumt5r50bUNfYBK7pxSwHk8I4IFQP",
  ],
  smids: [
    "EIwvED_NNIxszmE9FSCnjFrKcXn3mohHbCGYSuZj5Ai1",
    "EB3VkeAMhhPh2GZnDYs68N8-jJ1xrB6ptX5JxPuPFpZ7",
  ],
  rmids: [
    "EIwvED_NNIxszmE9FSCnjFrKcXn3mohHbCGYSuZj5Ai1",
    "EB3VkeAMhhPh2GZnDYs68N8-jJ1xrB6ptX5JxPuPFpZ7",
  ],
  group: {
    mhab: {
      name: "member2",
      prefix: "EB3VkeAMhhPh2GZnDYs68N8-jJ1xrB6ptX5JxPuPFpZ7",
      salty: {
        sxlt: "1AAHxXEH1bVIGCXdySPMIplcq3WF1WcWcoeohQv8h1mBBzF9bOw8894KBhV5vJiW6Nyv0KYsFOZezINCgYO55q8iSw-VbJ-9Cr4z",
        pidx: 0,
        kidx: 0,
        stem: "signify:aid",
        tier: Tier.low,
        dcode: "E",
        icodes: ["A"],
        ncodes: ["A"],
        transferable: true,
      },
      icp_dt: "2025-02-12T19:05:15.163405+00:00",
      transferable: true,
      state: {
        vn: [1, 0],
        i: "EB3VkeAMhhPh2GZnDYs68N8-jJ1xrB6ptX5JxPuPFpZ7",
        s: "0",
        p: "",
        d: "EB3VkeAMhhPh2GZnDYs68N8-jJ1xrB6ptX5JxPuPFpZ7",
        f: "0",
        dt: "2025-02-12T19:05:15.163405+00:00",
        et: "icp",
        kt: "1",
        k: ["DGp2jd7mX6MJ1Feu6QkfUxRtXeZVGTfpg0NygZn3Y-P3"],
        nt: "1",
        n: ["EFTnI8OOKoXTGA9Qunzljn7lkkz-DjcesJgUOqtdIwhd"],
        bt: "3",
        b: [
          "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
          "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
          "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX",
        ],
        c: [],
        ee: {
          s: "0",
          d: "EB3VkeAMhhPh2GZnDYs68N8-jJ1xrB6ptX5JxPuPFpZ7",
        },
        di: "",
      },
      windexes: [0, 1, 2],
    },
    keys: [
      "DOYbsl4dwkxEv9nwIQ9D9CF5gWojIb6A4ev7KJmHSwYL",
      "DGp2jd7mX6MJ1Feu6QkfUxRtXeZVGTfpg0NygZn3Y-P3",
    ],
    ndigs: [
      "EI80i_fWRfVd9e1KArsrZ5moY27TwQD0DmUI1VnzcRvi",
      "EFTnI8OOKoXTGA9Qunzljn7lkkz-DjcesJgUOqtdIwhd",
    ],
  },
};

const linkedContacts = [
  {
    id: "ENsj-3icUgAutHtrUHYnUPnP8RiafT5tOdVIZarFHuyP",
    label: "f4732f8a-1967-454a-8865-2bbf2377c26e",
    oobi: "http://127.0.0.1:3902/oobi/ENsj-3icUgAutHtrUHYnUPnP8RiafT5tOdVIZarFHuyP/agent/EF_dfLFGvUh9kMsV2LIJQtrkuXWG_-wxWzC_XjCWjlkQ",
    status: ConnectionStatus.CONFIRMED,
    createdAtUTC: new Date().toISOString(),
    groupId: "group-id",
  },
];

const queuedIdentifier: QueuedGroupCreation & { initiator: true } = {
  name: "0:Identifier 2",
  data: inceptionDataFix,
  initiator: true,
  groupConnections: linkedContacts,
  threshold: linkedContacts.length + 1,
};

const queuedJoin: QueuedGroupCreation & { initiator: false } = {
  name: "0:Identifier 2",
  data: inceptionDataFix,
  initiator: false,
  notificationId: "notification-id",
  notificationSaid: "notification-said",
};

const getAvailableWitnesses = {
  toad: 4,
  witnesses: [
    {
      eid: "BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha",
      oobi: "http://witness-demo:5642/oobi/BBilc4-L3tFUnfM_wJr4S4OJanAv_VmF_dJNN6vkf2Ha/witness",
    },
    {
      eid: "BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM",
      oobi: "http://witness-demo:5643/oobi/BLskRTInXnMxWaGqcpSyMgo0nYbalW99cGZESrz3zapM/witness",
    },
    {
      eid: "BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX",
      oobi: "http://witness-demo:5644/oobi/BIKKuvBwpmDVA4Ds-EpL5bt9OqPzWPja2LigFYZN2YfX/witness",
    },
    {
      eid: "BM35JN8XeJSEfpxopjn5jr7tAHCE5749f0OobhMLCorE",
      oobi: "http://witness-demo:5645/oobi/BM35JN8XeJSEfpxopjn5jr7tAHCE5749f0OobhMLCorE/witness",
    },
    {
      eid: "BIj15u5V11bkbtAxMA7gcNJZcax-7TgaBMLsQnMHpYHP",
      oobi: "http://witness-demo:5646/oobi/BIj15u5V11bkbtAxMA7gcNJZcax-7TgaBMLsQnMHpYHP/witness",
    },
    {
      eid: "BF2rZTW79z4IXocYRQnjjsOuvFUQv-ptCf8Yltd7PfsM",
      oobi: "http://witness-demo:5647/oobi/BF2rZTW79z4IXocYRQnjjsOuvFUQv-ptCf8Yltd7PfsM/witness",
    },
  ],
};

export {
  memberMetadataRecord,
  getMemberIdentifierResponse,
  getMultisigIdentifierResponse,
  memberIdentifierRecord,
  getMultisigMembersResponse,
  gHab,
  mHab,
  multisigExnIpexGrantSerder,
  multisigExnIpexGrantSig,
  multisigExnIpexGrantEnd,
  resolvedOobiOpResponse,
  initiatorConnectionShortDetails,
  multisigMetadataRecord,
  memberKeyStateIcp,
  memberKeyStateRot,
  notificationMultisigExnRotation,
  getRequestMultisigIcp,
  getExchangeGrantMessage,
  memberMetadataRecordProps,
  inceptionDataFix,
  linkedContacts,
  queuedIdentifier,
  queuedJoin,
  getAvailableWitnesses,
};
