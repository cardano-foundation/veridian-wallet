import { Saider, Serder } from "signify-ts";
import { CoreEventEmitter } from "../event";
import { IpexCommunicationService } from "./ipexCommunicationService";
import { Agent } from "../agent";
import { ConfigurationService } from "../../configuration";
import { OperationPendingRecordType } from "../records/operationPendingRecord.type";
import { CredentialStatus } from "./credentialService.types";
import { EventTypes } from "../event.types";
import {
  applyForPresentingExnMessage,
  grantForIssuanceExnMessage,
  QVISchema,
  credentialRecordProps,
  groupIdentifierMetadataRecord,
  multisigExnOfferForPresenting,
  multisigExnAdmitForIssuance,
  credentialRecord,
  multisigExnGrant,
  agreeForPresentingExnMessage,
  credentialProps,
  ipexGrantSerder,
  ipexSubmitGrantSerder,
  ipexSubmitGrantSig,
  ipexSubmitGrantEnd,
  multisigParticipantsProps,
  multisigOfferSerder,
  multisigOfferSig,
  multisigOfferEnd,
  ipexAdmitEnd,
  ipexAdmitSig,
  ipexAdmitSerder,
  ipexSubmitAdmitSerder,
  ipexSubmitAdmitSig,
  ipexSubmitAdmitEnd,
  credentialStateIssued,
  credentialStateRevoked,
  admitForIssuanceExnMessage,
} from "../../__fixtures__/agent/ipexCommunicationFixtures";
import { NotificationRoute } from "./keriaNotificationService.types";
import {
  gHab,
  mHab,
  memberIdentifierRecord,
} from "../../__fixtures__/agent/multiSigFixtures";
import {
  ConnectionHistoryType,
  KeriaContactKeyPrefix,
} from "./connectionService.types";
import { MultiSigRoute } from "./multiSig.types";
import { NotificationRecord } from "../records";
import { StorageMessage } from "../../storage/storage.types";

const notificationStorage = jest.mocked({
  open: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  deleteById: jest.fn(),
  update: jest.fn(),
  findById: jest.fn().mockImplementation((id: string) => {
    if (id === "uuid") {
      return {
        id,
        createdAt: new Date("2024-04-29T11:01:04.903Z"),
        a: {
          d: "saidForUuid",
        },
      };
    }
    return null;
  }),
  findAllByQuery: jest.fn(),
  getAll: jest.fn(),
});

const identifierStorage = jest.mocked({
  getIdentifierMetadata: jest.fn(),
  getUserFacingIdentifierRecords: jest.fn(),
  getAllIdentifiers: jest.fn(),
  updateIdentifierMetadata: jest.fn(),
  createIdentifierMetadataRecord: jest.fn(),
});

const credentialStorage = jest.mocked({
  getAllCredentialMetadata: jest.fn(),
  deleteCredentialMetadata: jest.fn(),
  getCredentialMetadata: jest.fn(),
  getCredentialMetadataByConnectionId: jest.fn(),
  saveCredentialMetadataRecord: jest.fn(),
  updateCredentialMetadata: jest.fn(),
  getCredentialMetadatasById: jest.fn(),
});

const saveOperationPendingMock = jest.fn();
const operationPendingStorage = jest.mocked({
  save: saveOperationPendingMock,
  delete: jest.fn(),
  deleteById: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByQuery: jest.fn(),
  getAll: jest.fn(),
});

const multisigService = jest.mocked({
  offerPresentMultisigACDC: jest
    .fn()
    .mockResolvedValue({ name: "opName", done: true }),
  getMultisigParticipants: jest.fn(),
});

const credentialListMock = jest.fn();
const credentialGetMock = jest.fn();
const credentialStateMock = jest.fn();
const identifierListMock = jest.fn();
const identifiersMemberMock = jest.fn();
let identifiersGetMock = jest.fn();
const getManagerMock = jest.fn().mockResolvedValue("hahaha");
const getRequestMock = jest.fn();
const createExchangeMessageMock = jest.fn();

let getExchangeMock = jest.fn().mockImplementation((id: string) => {
  if (id == "saidForUuid") {
    return {
      exn: {
        a: {
          i: "uuid",
          a: {},
          s: "schemaSaid",
        },
        i: "i",
        e: {
          acdc: {
            d: "id",
            a: {
              dt: DATETIME.toISOString(),
            },
          },
        },
      },
    };
  }
  return;
});

const ipexOfferMock = jest.fn();
const ipexGrantMock = jest.fn();
const schemaGetMock = jest.fn();
const ipexSubmitOfferMock = jest.fn().mockResolvedValue({
  name: "opName",
  done: true,
});
const ipexSubmitGrantMock = jest
  .fn()
  .mockResolvedValue({ name: "opName", done: true });
const ipexSubmitAdmitMock = jest.fn().mockResolvedValue({
  name: "opName",
  done: true,
});
const markNotificationMock = jest.fn();
const ipexAdmitMock = jest.fn();
const updateContactMock = jest.fn();

const signifyClient = jest.mocked({
  connect: jest.fn(),
  boot: jest.fn(),
  identifiers: () => ({
    list: identifierListMock,
    get: identifiersGetMock,
    create: jest.fn(),
    addEndRole: jest.fn(),
    interact: jest.fn(),
    rotate: jest.fn(),
    members: identifiersMemberMock,
  }),
  operations: () => ({
    get: jest.fn().mockImplementation((id: string) => {
      return {
        done: true,
        response: {
          i: id,
        },
      };
    }),
  }),
  oobis: () => ({
    get: jest.fn(),
    resolve: jest.fn().mockImplementation((name: string) => {
      return {
        done: true,
        response: {
          i: name,
        },
      };
    }),
  }),
  contacts: () => ({
    list: jest.fn(),
    update: updateContactMock,
    get: jest.fn().mockImplementation((id: string) => {
      return {
        alias: "e57ee6c2-2efb-4158-878e-ce36639c761f",
        oobi: "oobi",
        id,
      };
    }),
    delete: jest.fn(),
  }),
  notifications: () => ({
    list: jest.fn(),
    mark: markNotificationMock,
  }),
  ipex: () => ({
    admit: ipexAdmitMock,
    submitAdmit: ipexSubmitAdmitMock,
    offer: ipexOfferMock,
    submitOffer: ipexSubmitOfferMock,
    grant: ipexGrantMock,
    submitGrant: ipexSubmitGrantMock,
  }),
  credentials: () => ({
    list: credentialListMock,
    get: credentialGetMock,
    state: credentialStateMock,
  }),
  exchanges: () => ({
    get: getExchangeMock,
    send: jest.fn(),
    createExchangeMessage: createExchangeMessageMock,
  }),
  agent: {
    pre: "pre",
  },
  keyStates: () => ({
    query: jest.fn(),
    get: jest.fn(),
  }),
  schemas: () => ({
    get: schemaGetMock,
  }),
  manager: {
    get: getManagerMock,
  },
  groups: () => ({
    getRequest: getRequestMock,
  }),
});

jest.mock("signify-ts", () => ({
  Serder: jest.fn().mockImplementation(() => {
    return {};
  }),
  Saider: {
    saidify: jest.fn().mockImplementation(() => {
      return ["mockSaid", { d: "mockKed" }];
    }),
  },
  Siger: jest.fn().mockImplementation(() => {
    return {};
  }),
  messagize: jest.fn().mockImplementation(() => {
    return {};
  }),
  d: jest.fn().mockImplementation(() => "d"),
  b: jest.fn().mockImplementation(() => "b"),
  Ilks: {
    iss: "iss",
  },
  Tier: {
    low: "low",
  },
}));

const eventEmitter = new CoreEventEmitter();

const agentServicesProps = {
  signifyClient: signifyClient as any,
  eventEmitter: eventEmitter,
};

jest.mock("../../../core/agent/agent", () => ({
  Agent: {
    MISSING_DATA_ON_KERIA: "Missing data error msg mock",
    agent: {},
  },
}));

const connections = jest.mocked({
  resolveOobi: jest.fn(),
  getConnectionById: jest.fn().mockResolvedValue({
    serviceEndpoints: [
      "http://127.0.0.1:3902/oobi/EKSGUkKBfg5PG3nAvWZwY4pax2ZD-9LC7JpXeks7IKEj/agent/EKxIbNtsJytfgJjW_AkXV-XLTg_vSyPUMxuwkP7zbgbu",
    ],
  }),
});

const ipexCommunicationService = new IpexCommunicationService(
  agentServicesProps,
  identifierStorage as any,
  credentialStorage as any,
  notificationStorage as any,
  operationPendingStorage as any,
  multisigService as any,
  connections as any
);

let originalFetch;
beforeAll(() => {
  originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({
    text: () =>
      "{\"v\":\"KERI10JSON00012b_\",\"t\":\"icp\",\"d\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"i\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"s\":\"0\",\"kt\":\"1\",\"k\":[\"DGKzvhMMz2_MYhXyV5lGso_akvBYpGnOG5fTD299IsmO\"],\"nt\":\"1\",\"n\":[\"EBhg4MS4f4GZpuNZxk1D4mln9sv9l30rbtsk17AVOEmh\"],\"bt\":\"0\",\"b\":[],\"c\":[],\"a\":[]}-VAn-AABAADt-Cs8HoN9KBS5Kk23JCAaJzOl1InvbZ4FT0AQ0muKe6pSr8QvUJNNFTUImZg8XtBFqT75AY184rX3mKPKKgYI-EAB0AAAAAAAAAAAAAAAAAAAAAAA1AAG2025-01-21T13c24c58d219360p00c00{\"v\":\"KERI10JSON00013a_\",\"t\":\"ixn\",\"d\":\"EE_oRQa2Lq6g9C4jItfGPa9BMFsnmSPgS8_oB747-KHL\",\"i\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"s\":\"1\",\"p\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"a\":[{\"i\":\"EHm5kvOMHAdKkLBYazkUG54cyusm8d6SODrnJ2ZOP9-l\",\"s\":\"0\",\"d\":\"EHm5kvOMHAdKkLBYazkUG54cyusm8d6SODrnJ2ZOP9-l\"}]}-VAn-AABAADGIyEdPqQ4wJw6KWgFOF3guadzJYWTzy9EjDbxqnBEBmUIiGquNZvNtk--gDOYcOf_EsgIsmfZ8jwIvP0xICgL-EAB0AAAAAAAAAAAAAAAAAAAAAAB1AAG2025-01-21T13c24c59d693615p00c00{\"v\":\"KERI10JSON00013a_\",\"t\":\"ixn\",\"d\":\"EHfvjSm2o673Ps3dPy6FI_80OjvJicpwZG6FMQoARllG\",\"i\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"s\":\"2\",\"p\":\"EE_oRQa2Lq6g9C4jItfGPa9BMFsnmSPgS8_oB747-KHL\",\"a\":[{\"i\":\"EMcWk38kBLvGdKH2b93HMujB_Xx5-ugwD-vrQJVVIJIl\",\"s\":\"0\",\"d\":\"EIlV2FfP39_0EOLUKDi2_ljF9FMty8OCp9myBepidVij\"}]}-VAn-AABAACDrd4dm-E3OT2IlRwu4A3M7OzLkOgsoYi2-FPfS9Tmwr3awoCP2R-718qVHHUPNCb0MsnzQ2rTqVnNEw0QLWUB-EAB0AAAAAAAAAAAAAAAAAAAAAAC1AAG2025-01-21T13c47c06d452176p00c00{\"v\":\"KERI10JSON00013a_\",\"t\":\"ixn\",\"d\":\"EJRetyFJqp1yRs3hbleyAnqE3VqQQC2o4L3JDhIL0j2S\",\"i\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"s\":\"3\",\"p\":\"EHfvjSm2o673Ps3dPy6FI_80OjvJicpwZG6FMQoARllG\",\"a\":[{\"i\":\"EDR-8z0CviOyrntUK3pyabMTiIuKn0AXGhQvD0C12gkX\",\"s\":\"0\",\"d\":\"EGCPj1fDEsyLgRAXwDoD9qrX6lJkwxXfBx0XNoDHtMLl\"}]}-VAn-AABAAD6qIPXPrbqhKNPDRuU91_-EzQi01V53f1RFw0AV1sMe4JBjQmOdIwn4-FW88Lo-oht6e7C7sObbgk3-aJbQS4H-EAB0AAAAAAAAAAAAAAAAAAAAAAD1AAG2025-01-21T14c03c51d890362p00c00{\"v\":\"KERI10JSON00013a_\",\"t\":\"ixn\",\"d\":\"EBVYE7oXrSUvo2wNSTzXOK28SMEg6v_qrh2s_8Jk7Jdx\",\"i\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"s\":\"4\",\"p\":\"EJRetyFJqp1yRs3hbleyAnqE3VqQQC2o4L3JDhIL0j2S\",\"a\":[{\"i\":\"EGsSqpbkJ-0SQnhyS-1FxNChZ7p1NV6yTXPPHIdyvjkZ\",\"s\":\"0\",\"d\":\"EMNJNkHlDqyrOHWbafUGPpHVrvvj5VbrCZML_ZgXk-Rk\"}]}-VAn-AABAAAVj_8Zldpds_naKbRyuIOef3RKABaF23AHjkEKfc_Gb2j1559uY6NA8BV6ZmCKQU1_mpJbLbtaBMes-Oub2yUL-EAB0AAAAAAAAAAAAAAAAAAAAAAE1AAG2025-01-21T14c11c23d141088p00c00{\"v\":\"KERI10JSON00013a_\",\"t\":\"ixn\",\"d\":\"EC0Gh5X0JGSEkhUllR5sINwapxeAzYoKOWwP9UU7KdLn\",\"i\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"s\":\"5\",\"p\":\"EBVYE7oXrSUvo2wNSTzXOK28SMEg6v_qrh2s_8Jk7Jdx\",\"a\":[{\"i\":\"ENMi3aqTIgCSuXROeMywH7VFuUD1-ubK3EMlumKkRkc7\",\"s\":\"0\",\"d\":\"EKdvQCM1oSTgjcPezvOw2YanOe8Wdi6wkbViE6vHpEjg\"}]}-VAn-AABAABAaL6bwARu41XPQHGnHXuxmvPrIPP8vkghXhQbOTd07xdRZ5X2_kjMXu4UsHNyQcR7mNOht0kPeUPmafGx23EP-EAB0AAAAAAAAAAAAAAAAAAAAAAF1AAG2025-01-21T14c14c51d268032p00c00{\"v\":\"KERI10JSON00012b_\",\"t\":\"icp\",\"d\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"i\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"s\":\"0\",\"kt\":\"1\",\"k\":[\"DGKzvhMMz2_MYhXyV5lGso_akvBYpGnOG5fTD299IsmO\"],\"nt\":\"1\",\"n\":[\"EBhg4MS4f4GZpuNZxk1D4mln9sv9l30rbtsk17AVOEmh\"],\"bt\":\"0\",\"b\":[],\"c\":[],\"a\":[]}-VAn-AABAADt-Cs8HoN9KBS5Kk23JCAaJzOl1InvbZ4FT0AQ0muKe6pSr8QvUJNNFTUImZg8XtBFqT75AY184rX3mKPKKgYI-EAB0AAAAAAAAAAAAAAAAAAAAAAA1AAG2025-01-21T13c24c58d219360p00c00{\"v\":\"KERI10JSON00013a_\",\"t\":\"ixn\",\"d\":\"EE_oRQa2Lq6g9C4jItfGPa9BMFsnmSPgS8_oB747-KHL\",\"i\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"s\":\"1\",\"p\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"a\":[{\"i\":\"EHm5kvOMHAdKkLBYazkUG54cyusm8d6SODrnJ2ZOP9-l\",\"s\":\"0\",\"d\":\"EHm5kvOMHAdKkLBYazkUG54cyusm8d6SODrnJ2ZOP9-l\"}]}-VAn-AABAADGIyEdPqQ4wJw6KWgFOF3guadzJYWTzy9EjDbxqnBEBmUIiGquNZvNtk--gDOYcOf_EsgIsmfZ8jwIvP0xICgL-EAB0AAAAAAAAAAAAAAAAAAAAAAB1AAG2025-01-21T13c24c59d693615p00c00{\"v\":\"KERI10JSON00013a_\",\"t\":\"ixn\",\"d\":\"EHfvjSm2o673Ps3dPy6FI_80OjvJicpwZG6FMQoARllG\",\"i\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"s\":\"2\",\"p\":\"EE_oRQa2Lq6g9C4jItfGPa9BMFsnmSPgS8_oB747-KHL\",\"a\":[{\"i\":\"EMcWk38kBLvGdKH2b93HMujB_Xx5-ugwD-vrQJVVIJIl\",\"s\":\"0\",\"d\":\"EIlV2FfP39_0EOLUKDi2_ljF9FMty8OCp9myBepidVij\"}]}-VAn-AABAACDrd4dm-E3OT2IlRwu4A3M7OzLkOgsoYi2-FPfS9Tmwr3awoCP2R-718qVHHUPNCb0MsnzQ2rTqVnNEw0QLWUB-EAB0AAAAAAAAAAAAAAAAAAAAAAC1AAG2025-01-21T13c47c06d452176p00c00{\"v\":\"KERI10JSON00013a_\",\"t\":\"ixn\",\"d\":\"EJRetyFJqp1yRs3hbleyAnqE3VqQQC2o4L3JDhIL0j2S\",\"i\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"s\":\"3\",\"p\":\"EHfvjSm2o673Ps3dPy6FI_80OjvJicpwZG6FMQoARllG\",\"a\":[{\"i\":\"EDR-8z0CviOyrntUK3pyabMTiIuKn0AXGhQvD0C12gkX\",\"s\":\"0\",\"d\":\"EGCPj1fDEsyLgRAXwDoD9qrX6lJkwxXfBx0XNoDHtMLl\"}]}-VAn-AABAAD6qIPXPrbqhKNPDRuU91_-EzQi01V53f1RFw0AV1sMe4JBjQmOdIwn4-FW88Lo-oht6e7C7sObbgk3-aJbQS4H-EAB0AAAAAAAAAAAAAAAAAAAAAAD1AAG2025-01-21T14c03c51d890362p00c00{\"v\":\"KERI10JSON00013a_\",\"t\":\"ixn\",\"d\":\"EBVYE7oXrSUvo2wNSTzXOK28SMEg6v_qrh2s_8Jk7Jdx\",\"i\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"s\":\"4\",\"p\":\"EJRetyFJqp1yRs3hbleyAnqE3VqQQC2o4L3JDhIL0j2S\",\"a\":[{\"i\":\"EGsSqpbkJ-0SQnhyS-1FxNChZ7p1NV6yTXPPHIdyvjkZ\",\"s\":\"0\",\"d\":\"EMNJNkHlDqyrOHWbafUGPpHVrvvj5VbrCZML_ZgXk-Rk\"}]}-VAn-AABAAAVj_8Zldpds_naKbRyuIOef3RKABaF23AHjkEKfc_Gb2j1559uY6NA8BV6ZmCKQU1_mpJbLbtaBMes-Oub2yUL-EAB0AAAAAAAAAAAAAAAAAAAAAAE1AAG2025-01-21T14c11c23d141088p00c00{\"v\":\"KERI10JSON00013a_\",\"t\":\"ixn\",\"d\":\"EC0Gh5X0JGSEkhUllR5sINwapxeAzYoKOWwP9UU7KdLn\",\"i\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"s\":\"5\",\"p\":\"EBVYE7oXrSUvo2wNSTzXOK28SMEg6v_qrh2s_8Jk7Jdx\",\"a\":[{\"i\":\"ENMi3aqTIgCSuXROeMywH7VFuUD1-ubK3EMlumKkRkc7\",\"s\":\"0\",\"d\":\"EKdvQCM1oSTgjcPezvOw2YanOe8Wdi6wkbViE6vHpEjg\"}]}-VAn-AABAABAaL6bwARu41XPQHGnHXuxmvPrIPP8vkghXhQbOTd07xdRZ5X2_kjMXu4UsHNyQcR7mNOht0kPeUPmafGx23EP-EAB0AAAAAAAAAAAAAAAAAAAAAAF1AAG2025-01-21T14c14c51d268032p00c00{\"v\":\"KERI10JSON0000f9_\",\"t\":\"rpy\",\"d\":\"ELrQF_D6YFL_2SU7RbDOrTYRtGj0v_GlOmi-YWVyChol\",\"dt\":\"2025-01-21T13:24:59.001000+00:00\",\"r\":\"/loc/scheme\",\"a\":{\"eid\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"url\":\"http://127.0.0.1:3001\",\"scheme\":\"http\"}}-VA0-FABEKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--80AAAAAAAAAAAAAAAAAAAAAAAEKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8-AABAAA8QzT_XDXtB_5bK8P-dVrCZIlQ69WniFPWkGmGthK683v1E2ymGA7RlkXogXtIEHekVjdl0Tg5r6lr5aREjxcL{\"v\":\"KERI10JSON000113_\",\"t\":\"rpy\",\"d\":\"EA5z8Q3g-llvOK86bvE1QAceLb7g0FzcY9INn4Ch0Hu5\",\"dt\":\"2025-01-21T13:24:58.660000+00:00\",\"r\":\"/end/role/add\",\"a\":{\"cid\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\",\"role\":\"indexer\",\"eid\":\"EKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8\"}}-VA0-FABEKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--80AAAAAAAAAAAAAAAAAAAAAAAEKxN8WjtIewcbCp_cGih5Dd42PJ-IZ8KTPbc5Xx5q--8-AABAADCsrTysi5_3hhzgP9VUyilJIPE8x-8Yi-lNtyB28tbc0a_S3igdY_v0yLg14tTzOyQn9sv3rGZEt4ZKb4-xl8D",
  }) as jest.Mock;
});

afterAll(() => {
  global.fetch = originalFetch!;
});

const DATETIME = new Date();

describe("Receive individual ACDC actions", () => {
  beforeAll(async () => {
    await new ConfigurationService().start();
  });

  test("Can accept ACDC from individual identifier and remove notification", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const id = "uuid";
    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: id,
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: true,
      linkedRequest: { accepted: false },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });
    getExchangeMock = jest.fn().mockReturnValue(grantForIssuanceExnMessage);
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      id: "identifierId",
    });
    schemaGetMock.mockResolvedValue(QVISchema);
    credentialStorage.getCredentialMetadata = jest.fn().mockResolvedValue({
      id: "id",
    });
    eventEmitter.emit = jest.fn();
    saveOperationPendingMock.mockResolvedValue({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeReceiveCredential,
    });
    ipexAdmitMock.mockResolvedValue([
      { ked: { d: "admit-said" } },
      "sigs",
      "aend",
    ]);
    credentialStorage.saveCredentialMetadataRecord = jest
      .fn()
      .mockResolvedValue({
        ...credentialRecordProps,
        identifierId: "identifierId",
        identifierType: "individual",
        createdAt: new Date(credentialRecordProps.issuanceDate),
      });
    markNotificationMock.mockResolvedValueOnce({ status: "done" });

    await ipexCommunicationService.admitAcdcFromGrant(id);

    expect(credentialStorage.saveCredentialMetadataRecord).toBeCalledWith({
      ...credentialRecordProps,
      identifierId: "identifierId",
      identifierType: "individual",
      createdAt: new Date(credentialRecordProps.issuanceDate),
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.AcdcStateChanged,
      payload: {
        credential: {
          ...credentialRecordProps,
          identifierId: "identifierId",
          identifierType: "individual",
          isArchived: undefined,
        },
        status: CredentialStatus.PENDING,
      },
    });
    expect(ipexAdmitMock).toBeCalledWith({
      datetime: expect.any(String),
      message: "",
      senderName: "identifierId",
      recipient: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
      grantSaid: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
    });
    expect(ipexSubmitAdmitMock).toBeCalledWith(
      "identifierId",
      { ked: { d: "admit-said" } },
      "sigs",
      "aend",
      ["EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x"]
    );
    expect(operationPendingStorage.save).toBeCalledWith({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeReceiveCredential,
    });
    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        id,
        route: NotificationRoute.ExnIpexGrant,
        linkedRequest: {
          accepted: true,
          current: "admit-said",
        },
        hidden: true,
      })
    );
  });

  test("Can accept ACDC from individual identifier even if already exists (idempotent)", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const id = "uuid";
    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: id,
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: true,
      linkedRequest: { accepted: false },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });
    getExchangeMock = jest.fn().mockReturnValue(grantForIssuanceExnMessage);
    identifierStorage.getIdentifierMetadata = jest.fn().mockResolvedValue({
      id: "identifierId",
    });
    schemaGetMock.mockResolvedValue(QVISchema);
    credentialStorage.getCredentialMetadata = jest.fn().mockResolvedValue({
      id: "id",
    });
    eventEmitter.emit = jest.fn();
    saveOperationPendingMock.mockResolvedValue({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeReceiveCredential,
    });
    ipexAdmitMock.mockResolvedValue([
      { ked: { d: "admit-said" } },
      "sigs",
      "aend",
    ]);
    markNotificationMock.mockResolvedValueOnce({ status: "done" });
    credentialStorage.saveCredentialMetadataRecord.mockRejectedValueOnce(
      new Error(StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG)
    );

    await ipexCommunicationService.admitAcdcFromGrant(id);

    expect(credentialStorage.saveCredentialMetadataRecord).toBeCalledWith({
      ...credentialRecordProps,
      identifierId: "identifierId",
      identifierType: "individual",
      createdAt: new Date(credentialRecordProps.issuanceDate),
    });
    expect(eventEmitter.emit).not.toBeCalled();
    expect(ipexAdmitMock).toBeCalledWith({
      datetime: expect.any(String),
      message: "",
      senderName: "identifierId",
      recipient: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
      grantSaid: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
    });
    expect(ipexSubmitAdmitMock).toBeCalledWith(
      "identifierId",
      { ked: { d: "admit-said" } },
      "sigs",
      "aend",
      ["EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x"]
    );
    expect(operationPendingStorage.save).toBeCalledWith({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeReceiveCredential,
    });
    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        id,
        route: NotificationRoute.ExnIpexGrant,
        linkedRequest: {
          accepted: true,
          current: "admit-said",
        },
        hidden: true,
      })
    );
  });

  test("Cannot accept ACDC if the notification is missing in the DB", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const id = "not-found-id";
    notificationStorage.findById = jest.fn().mockResolvedValue(null);

    await expect(
      ipexCommunicationService.admitAcdcFromGrant(id)
    ).rejects.toThrowError(
      `${IpexCommunicationService.NOTIFICATION_NOT_FOUND} ${id}`
    );

    expect(ipexAdmitMock).not.toBeCalled();
    expect(ipexSubmitAdmitMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Cannot accept ACDC if identifier is not locally stored", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const id = "uuid";
    notificationStorage.findById = jest.fn().mockResolvedValue({
      id,
      createdAt: new Date("2024-04-29T11:01:04.903Z"),
      a: {
        d: "saidForUuid",
      },
      linkedRequest: {
        current: "EL3A2jk9gvmVe4ROISB2iWmM8yPSNwQlmar6-SFVWSPW",
        accepted: false,
      },
    });
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(undefined);

    await expect(
      ipexCommunicationService.admitAcdcFromGrant(id)
    ).rejects.toThrowError(IpexCommunicationService.ISSUEE_NOT_FOUND_LOCALLY);

    expect(ipexAdmitMock).not.toBeCalled();
    expect(ipexSubmitAdmitMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });
});

describe("Receive group ACDC actions", () => {
  beforeAll(async () => {
    await new ConfigurationService().start();
  });

  test("Can begin admitting an ACDC for a group and the notification remains", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const id = "uuid";

    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: id,
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: true,
      linkedRequest: {
        accepted: false,
      },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });
    getExchangeMock.mockReturnValue(grantForIssuanceExnMessage);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(groupIdentifierMetadataRecord);
    schemaGetMock.mockResolvedValue(QVISchema);
    multisigService.getMultisigParticipants.mockResolvedValue({
      ourIdentifier: {
        id: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
        displayName: "Identifier 2",
        createdAt: "2024-09-23T08:53:11.981Z",
        theme: 0,
        groupMetadata: {
          groupId: "group-id",
          groupInitiator: true,
          groupCreated: true,
        },
      },
      multisigMembers: [
        {
          aid: "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF",
          ends: [],
        },
        {
          aid: "EGaEIhOGSTPccSMvnXvfvOVyC1C5AFq62GLTrRKVZBS5",
          ends: [],
        },
      ],
    });
    identifiersGetMock = jest
      .fn()
      .mockResolvedValueOnce(gHab)
      .mockResolvedValueOnce(mHab);
    createExchangeMessageMock.mockResolvedValue([
      ipexSubmitAdmitSerder,
      ipexSubmitAdmitSig,
      ipexSubmitAdmitEnd,
    ]);

    (Saider.saidify as jest.Mock).mockImplementation(
      jest.fn().mockReturnValue([{} as Saider, ipexGrantSerder.ked])
    );
    (Serder as jest.Mock).mockImplementation(
      jest.fn().mockReturnValue({
        ked: { d: "EKJEr0WbRERI1j2GjjfuReOIHjBSjC0tXguEaNYo5Hl6" },
      })
    );

    notificationStorage.findAllByQuery = jest.fn().mockResolvedValue([
      {
        type: "NotificationRecord",
        id: id,
        createdAt: DATETIME,
        a: {
          r: NotificationRoute.ExnIpexGrant,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexGrant,
        read: true,
        linkedRequest: {
          "EDm8iNyZ9I3P93jb0lFtL6DJD-4Mtd2zw1ADFOoEQAqw": false,
        },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        updatedAt: DATETIME,
      },
    ]);
    eventEmitter.emit = jest.fn();
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeReceiveCredential,
    });
    ipexAdmitMock.mockResolvedValue(["admit", ["sigs"], "aend"]);

    credentialStorage.saveCredentialMetadataRecord = jest
      .fn()
      .mockResolvedValue({
        ...credentialRecordProps,
        identifierId: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
        identifierType: "group",
        createdAt: new Date(credentialRecordProps.issuanceDate),
      });

    await ipexCommunicationService.admitAcdcFromGrant(id);

    expect(credentialStorage.saveCredentialMetadataRecord).toBeCalledWith({
      ...credentialRecordProps,
      identifierId: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      identifierType: "group",
      createdAt: new Date(credentialRecordProps.issuanceDate),
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.AcdcStateChanged,
      payload: {
        credential: {
          ...credentialRecordProps,
          identifierId: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
          identifierType: "group",
          isArchived: undefined,
        },
        status: CredentialStatus.PENDING,
      },
    });
    expect(ipexSubmitAdmitMock).toBeCalledWith(
      "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      ipexSubmitAdmitSerder,
      ipexSubmitAdmitSig,
      ipexSubmitAdmitEnd,
      [
        "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF",
        "EGaEIhOGSTPccSMvnXvfvOVyC1C5AFq62GLTrRKVZBS5",
      ]
    );
    expect(notificationStorage.update).toBeCalledWith({
      type: "NotificationRecord",
      id: id,
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: true,
      linkedRequest: {
        accepted: true,
        current: "EL3A2jk9gvmVe4ROISB2iWmM8yPSNwQlmar6-SFVWSPW",
      },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });
    expect(operationPendingStorage.save).toBeCalledWith({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeReceiveCredential,
    });
    expect(notificationStorage.deleteById).not.toBeCalled();
  });

  test("Cannot begin admitting an ACDC twice", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const id = "uuid";

    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: id,
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: true,
      linkedRequest: {
        accepted: true,
        current: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });

    await expect(
      ipexCommunicationService.admitAcdcFromGrant(id)
    ).rejects.toThrowError(IpexCommunicationService.IPEX_ALREADY_REPLIED);

    expect(ipexAdmitMock).not.toBeCalled();
    expect(ipexSubmitAdmitMock).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Can join group admit of an ACDC", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);

    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: "id",
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: true,
      linkedRequest: {
        accepted: false,
        current: "EL3A2jk9gvmVe4ROISB2iWmM8yPSNwQlmar6-SFVWSPW",
      },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });
    getExchangeMock
      .mockReturnValueOnce(multisigExnAdmitForIssuance)
      .mockReturnValueOnce(grantForIssuanceExnMessage);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(groupIdentifierMetadataRecord);
    multisigService.getMultisigParticipants.mockResolvedValue({
      ourIdentifier: {
        id: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
        displayName: "Identifier 2",
        createdAt: "2024-09-23T08:53:11.981Z",
        theme: 0,
        groupMetadata: {
          groupId: "group-id",
          groupInitiator: true,
          groupCreated: true,
        },
      },
      multisigMembers: [
        {
          aid: "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF",
          ends: [],
        },
        {
          aid: "EGaEIhOGSTPccSMvnXvfvOVyC1C5AFq62GLTrRKVZBS5",
          ends: [],
        },
      ],
    });
    getManagerMock.mockReturnValue({
      sign: () => [
        "ABDEouKAUhCDedOkqA5oxlMO4OB1C8p5M4G-_DLJWPf-ZjegTK-OxN4s6veE_7hXXuFzX4boq6evbLs5vFiVl-MB",
      ],
    });
    identifiersGetMock = jest
      .fn()
      .mockResolvedValueOnce(gHab)
      .mockResolvedValueOnce(mHab);
    createExchangeMessageMock.mockResolvedValue([
      ipexSubmitAdmitSerder,
      ipexSubmitAdmitSig,
      ipexSubmitAdmitEnd,
    ]);
    schemaGetMock.mockResolvedValue(QVISchema);
    ipexAdmitMock.mockResolvedValue([
      ipexAdmitSerder,
      ipexAdmitSig,
      ipexAdmitEnd,
    ]);
    eventEmitter.emit = jest.fn();
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeReceiveCredential,
    });

    (Saider.saidify as jest.Mock).mockImplementation(
      jest.fn().mockReturnValue([{} as Saider, ipexGrantSerder.ked])
    );
    (Serder as jest.Mock).mockImplementation(
      jest.fn().mockReturnValue({
        ked: { d: "EKJEr0WbRERI1j2GjjfuReOIHjBSjC0tXguEaNYo5Hl6" },
      })
    );
    credentialStorage.saveCredentialMetadataRecord = jest
      .fn()
      .mockResolvedValue({
        ...credentialRecordProps,
        identifierId: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
        identifierType: "group",
        createdAt: new Date(credentialRecordProps.issuanceDate),
      });

    await ipexCommunicationService.joinMultisigAdmit("id");

    expect(getManagerMock).toBeCalledWith(gHab);
    expect(ipexSubmitAdmitMock).toBeCalledWith(
      "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      ipexSubmitAdmitSerder,
      ipexSubmitAdmitSig,
      ipexSubmitAdmitEnd,
      [
        "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF",
        "EGaEIhOGSTPccSMvnXvfvOVyC1C5AFq62GLTrRKVZBS5",
      ]
    );
    expect(credentialStorage.saveCredentialMetadataRecord).toBeCalledWith({
      ...credentialRecordProps,
      identifierId: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      identifierType: "group",
      createdAt: new Date(credentialRecordProps.issuanceDate),
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith({
      type: EventTypes.AcdcStateChanged,
      payload: {
        credential: {
          ...credentialRecordProps,
          identifierId: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
          identifierType: "group",
          isArchived: undefined,
        },
        status: CredentialStatus.PENDING,
      },
    });
    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: "id",
        route: NotificationRoute.ExnIpexGrant,
        linkedRequest: {
          accepted: true,
          current: "EL3A2jk9gvmVe4ROISB2iWmM8yPSNwQlmar6-SFVWSPW",
        },
      })
    );
    expect(operationPendingStorage.save).toBeCalledWith({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeReceiveCredential,
    });
    expect(notificationStorage.deleteById).not.toBeCalled();
  });

  test("Can join group admit of an ACDC even if ACDC already exists (idempotent)", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);

    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: "id",
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: true,
      linkedRequest: {
        accepted: false,
        current: "EL3A2jk9gvmVe4ROISB2iWmM8yPSNwQlmar6-SFVWSPW",
      },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });
    getExchangeMock
      .mockReturnValueOnce(multisigExnAdmitForIssuance)
      .mockReturnValueOnce(grantForIssuanceExnMessage);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValue(groupIdentifierMetadataRecord);
    multisigService.getMultisigParticipants.mockResolvedValue({
      ourIdentifier: {
        id: "EGrdtLIlSIQHF1gHhE7UVfs9yRF-EDhqtLT41pJlj_z8",
        displayName: "Identifier 2",
        createdAt: "2024-09-23T08:53:11.981Z",
        theme: 0,
        groupMetadata: {
          groupId: "group-id",
          groupInitiator: true,
          groupCreated: true,
        },
      },
      multisigMembers: [
        {
          aid: "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF",
          ends: [],
        },
        {
          aid: "EGaEIhOGSTPccSMvnXvfvOVyC1C5AFq62GLTrRKVZBS5",
          ends: [],
        },
      ],
    });
    getManagerMock.mockReturnValue({
      sign: () => [
        "ABDEouKAUhCDedOkqA5oxlMO4OB1C8p5M4G-_DLJWPf-ZjegTK-OxN4s6veE_7hXXuFzX4boq6evbLs5vFiVl-MB",
      ],
    });
    identifiersGetMock = jest
      .fn()
      .mockResolvedValueOnce(gHab)
      .mockResolvedValueOnce(mHab);
    createExchangeMessageMock.mockResolvedValue([
      ipexSubmitAdmitSerder,
      ipexSubmitAdmitSig,
      ipexSubmitAdmitEnd,
    ]);
    schemaGetMock.mockResolvedValue(QVISchema);
    ipexAdmitMock.mockResolvedValue([
      ipexAdmitSerder,
      ipexAdmitSig,
      ipexAdmitEnd,
    ]);
    eventEmitter.emit = jest.fn();
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeReceiveCredential,
    });

    (Saider.saidify as jest.Mock).mockImplementation(
      jest.fn().mockReturnValue([{} as Saider, ipexGrantSerder.ked])
    );
    (Serder as jest.Mock).mockImplementation(
      jest.fn().mockReturnValue({
        ked: { d: "EKJEr0WbRERI1j2GjjfuReOIHjBSjC0tXguEaNYo5Hl6" },
      })
    );
    credentialStorage.saveCredentialMetadataRecord.mockRejectedValueOnce(
      new Error(StorageMessage.RECORD_ALREADY_EXISTS_ERROR_MSG)
    );

    await ipexCommunicationService.joinMultisigAdmit("id");

    expect(getManagerMock).toBeCalledWith(gHab);
    expect(ipexSubmitAdmitMock).toBeCalledWith(
      "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      ipexSubmitAdmitSerder,
      ipexSubmitAdmitSig,
      ipexSubmitAdmitEnd,
      [
        "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF",
        "EGaEIhOGSTPccSMvnXvfvOVyC1C5AFq62GLTrRKVZBS5",
      ]
    );
    expect(credentialStorage.saveCredentialMetadataRecord).toBeCalledWith({
      ...credentialRecordProps,
      identifierId: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      identifierType: "group",
      createdAt: new Date(credentialRecordProps.issuanceDate),
    });
    expect(eventEmitter.emit).not.toBeCalled();
    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: "id",
        route: NotificationRoute.ExnIpexGrant,
        linkedRequest: {
          accepted: true,
          current: "EL3A2jk9gvmVe4ROISB2iWmM8yPSNwQlmar6-SFVWSPW",
        },
      })
    );
    expect(operationPendingStorage.save).toBeCalledWith({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeReceiveCredential,
    });
    expect(notificationStorage.deleteById).not.toBeCalled();
  });

  test("Cannot join group admit for a grant notification that does not exist", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const id = "uuid";

    notificationStorage.findById = jest.fn().mockResolvedValue(null);

    await expect(
      ipexCommunicationService.joinMultisigAdmit(id)
    ).rejects.toThrowError(IpexCommunicationService.NOTIFICATION_NOT_FOUND);

    expect(ipexSubmitAdmitMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Cannot join group admit of an ACDC twice", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const id = "uuid";

    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: "id",
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: true,
      linkedRequest: {
        accepted: true,
        current: "current-admit-said",
      },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });

    await expect(
      ipexCommunicationService.joinMultisigAdmit(id)
    ).rejects.toThrowError(IpexCommunicationService.IPEX_ALREADY_REPLIED);

    expect(ipexSubmitAdmitMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Cannot join group admit of an ACDC if there is no current admit to join", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const id = "uuid";

    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: "id",
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: true,
      linkedRequest: {
        accepted: false,
      },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });

    await expect(
      ipexCommunicationService.joinMultisigAdmit(id)
    ).rejects.toThrowError(
      IpexCommunicationService.NO_CURRENT_IPEX_MSG_TO_JOIN
    );

    expect(ipexSubmitAdmitMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Cannot join group admit of an ACDC if group identifier is not locally stored", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const id = "uuid";

    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: "id",
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexGrant,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexGrant,
      read: true,
      linkedRequest: {
        accepted: false,
        current: "EL3A2jk9gvmVe4ROISB2iWmM8yPSNwQlmar6-SFVWSPW",
      },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });
    getExchangeMock
      .mockReturnValueOnce(multisigExnAdmitForIssuance)
      .mockReturnValueOnce(grantForIssuanceExnMessage);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValueOnce(undefined);

    await expect(
      ipexCommunicationService.joinMultisigAdmit(id)
    ).rejects.toThrowError(IpexCommunicationService.ISSUEE_NOT_FOUND_LOCALLY);

    expect(ipexSubmitAdmitMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });
});

describe("Receive group ACDC progress", () => {
  beforeAll(async () => {
    await new ConfigurationService().start();
  });

  test("Cannot get linkedRequest from ipex/grant if the notification is missing in the DB", async () => {
    const id = "uuid";
    const date = DATETIME.toISOString();
    const notification = {
      id,
      createdAt: date,
      a: {
        d: "d",
      },
      connectionId: "EGR7Jm38EcsXRIidKDZBYDm_xox6eapfU1tqxdAUzkFd",
      read: true,
    };
    notificationStorage.findById.mockResolvedValueOnce(null);

    await expect(
      ipexCommunicationService.getLinkedGroupFromIpexGrant(notification.id)
    ).rejects.toThrowError(
      `${IpexCommunicationService.NOTIFICATION_NOT_FOUND} ${id}`
    );
  });

  test("Should return the current progress of an admit linked to a grant", async () => {
    const grantNoteRecord = {
      linkedRequest: {
        accepted: true,
        current: "currentsaid",
      },
      a: { d: "d" },
    };

    notificationStorage.findById.mockResolvedValueOnce(grantNoteRecord);
    getExchangeMock.mockImplementationOnce(() => ({
      exn: { e: { acdc: { d: "credentialSaid" } }, rp: "i" },
    }));

    identifiersGetMock = jest.fn().mockResolvedValueOnce({
      state: {
        kt: "2",
      },
    });

    identifiersMemberMock.mockResolvedValueOnce({
      signing: [
        {
          aid: "memberA",
        },
        {
          aid: "memberB",
        },
        {
          aid: "memberC",
        },
      ],
    });

    getRequestMock.mockResolvedValueOnce([
      { exn: { i: "memberB" } },
      { exn: { i: "memberC" } },
    ]);

    const result = await ipexCommunicationService.getLinkedGroupFromIpexGrant(
      "id"
    );

    expect(result).toEqual({
      members: ["memberA", "memberB", "memberC"],
      threshold: "2",
      othersJoined: ["memberB", "memberC"],
      linkedRequest: {
        accepted: true,
        current: "currentsaid",
      },
    });
  });

  test("Should return the defaults when there is no admit linked to a grant", async () => {
    const grantNoteRecord = {
      linkedRequest: { accepted: false },
      a: { d: "d" },
    };

    identifiersMemberMock.mockResolvedValueOnce({
      signing: [
        {
          aid: "memberA",
        },
        {
          aid: "memberB",
        },
        {
          aid: "memberC",
        },
      ],
    });

    notificationStorage.findById.mockResolvedValueOnce(grantNoteRecord);
    getExchangeMock.mockImplementationOnce(() => ({
      exn: { e: { acdc: { d: "credentialSaid" } }, rp: "i" },
    }));

    identifiersGetMock = jest.fn().mockResolvedValueOnce({
      state: {
        kt: "2",
      },
    });

    const result = await ipexCommunicationService.getLinkedGroupFromIpexGrant(
      "id"
    );

    expect(result).toEqual({
      members: ["memberA", "memberB", "memberC"],
      threshold: "2",
      othersJoined: [],
      linkedRequest: {
        accepted: false,
      },
    });
  });
});

describe("Offer ACDC individual actions", () => {
  beforeAll(async () => {
    await new ConfigurationService().start();
  });

  test("Can offer ACDC in response to IPEX apply", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const id = "uuid";
    eventEmitter.emit = jest.fn();
    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: id,
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexApply,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexApply,
      read: true,
      linkedRequest: {
        current: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
        accepted: false,
      },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });
    getExchangeMock = jest.fn().mockReturnValueOnce({
      exn: {
        a: {
          s: "schemaSaid",
        },
        i: "i",
        d: "d",
      },
    });
    identifierStorage.getIdentifierMetadata = jest.fn().mockReturnValue({
      id: "abc123",
    });
    ipexOfferMock.mockResolvedValue([
      { ked: { d: "offer-said" } },
      "sigs",
      "gend",
    ]);
    ipexSubmitOfferMock.mockResolvedValue({ name: "opName", done: true });
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeOfferCredential,
    });
    markNotificationMock.mockResolvedValueOnce({ status: "done" });

    await ipexCommunicationService.offerAcdcFromApply(
      id,
      grantForIssuanceExnMessage.exn.e.acdc
    );

    expect(operationPendingStorage.save).toBeCalledWith({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeOfferCredential,
    });
    expect(ipexOfferMock).toBeCalledWith({
      senderName: "abc123",
      recipient: "i",
      acdc: new Serder(grantForIssuanceExnMessage.exn.e.acdc),
      applySaid: "d",
    });
    expect(ipexSubmitOfferMock).toBeCalledWith(
      "abc123",
      { ked: { d: "offer-said" } },
      "sigs",
      "gend",
      ["i"]
    );
    expect(operationPendingStorage.save).toBeCalledWith({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeOfferCredential,
    });
    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        id,
        route: NotificationRoute.ExnIpexApply,
        linkedRequest: {
          accepted: true,
          current: "offer-said",
        },
        hidden: true,
      })
    );
  });

  test("Cannot offer ACDC if the apply notification is missing in the DB", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const id = "not-found-id";
    eventEmitter.emit = jest.fn();
    notificationStorage.findById.mockResolvedValueOnce(null);

    await expect(
      ipexCommunicationService.offerAcdcFromApply(
        id,
        grantForIssuanceExnMessage.exn.e.acdc
      )
    ).rejects.toThrowError(
      `${IpexCommunicationService.NOTIFICATION_NOT_FOUND} ${id}`
    );

    expect(ipexOfferMock).not.toBeCalled();
    expect(ipexSubmitOfferMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
    expect(notificationStorage.delete).not.toBeCalled();
  });
});

describe("Offer ACDC group actions", () => {
  beforeAll(async () => {
    await new ConfigurationService().start();
  });

  test("Can begin offering an ACDC from a group identifier", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const id = "uuid";
    eventEmitter.emit = jest.fn();
    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: id,
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexApply,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexApply,
      read: true,
      linkedRequest: { accepted: false },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });
    getExchangeMock.mockReturnValueOnce(multisigExnOfferForPresenting);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValueOnce(groupIdentifierMetadataRecord);
    multisigService.getMultisigParticipants.mockResolvedValueOnce(
      multisigParticipantsProps
    );
    identifiersGetMock = jest
      .fn()
      .mockResolvedValueOnce(gHab)
      .mockResolvedValueOnce(mHab);
    ipexOfferMock.mockResolvedValue(["offer", ["sigs"], "oend"]);
    createExchangeMessageMock.mockResolvedValue([
      multisigOfferSerder,
      multisigOfferSig,
      multisigOfferEnd,
    ]);
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeOfferCredential,
    });

    await ipexCommunicationService.offerAcdcFromApply(id, credentialRecord);

    expect(ipexOfferMock).toBeCalledWith({
      senderName: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      recipient: "ECS7jn05fIP_JK1Ub4E6hPviRKEdC55QhxZToxDIHo_E",
      acdc: new Serder(grantForIssuanceExnMessage.exn.e.acdc),
      applySaid: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      message: "",
      datetime: expect.any(String),
    });
    expect(ipexSubmitOfferMock).toBeCalledWith(
      "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      multisigOfferSerder,
      multisigOfferSig,
      multisigOfferEnd,
      [
        "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF",
        "EGaEIhOGSTPccSMvnXvfvOVyC1C5AFq62GLTrRKVZBS5",
      ]
    );
    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        id,
        route: NotificationRoute.ExnIpexApply,
        linkedRequest: {
          accepted: true,
          current: "EARi8kQ1PkSSRyFEIPOFPdnsnv7P2QZYEQqnmr1Eo2N8",
        },
      })
    );
    expect(operationPendingStorage.save).toBeCalledWith({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeOfferCredential,
    });
    expect(markNotificationMock).not.toBeCalled();
    expect(notificationStorage.deleteById).not.toBeCalled();
  });

  test("Cannot begin offering an ACDC twice", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    eventEmitter.emit = jest.fn();
    const applyNoteRecord = {
      linkedRequest: {
        accepted: true,
        current: "currentsaid",
      },
    };
    notificationStorage.findById.mockResolvedValue(applyNoteRecord);

    await expect(
      ipexCommunicationService.offerAcdcFromApply(
        "id",
        grantForIssuanceExnMessage.exn.e.acdc
      )
    ).rejects.toThrowError(IpexCommunicationService.IPEX_ALREADY_REPLIED);

    expect(ipexOfferMock).not.toBeCalled();
    expect(ipexSubmitOfferMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Can join group offer of an ACDC", async () => {
    eventEmitter.emit = jest.fn();
    const notificationRecord = {
      type: "NotificationRecord",
      id: "id",
      a: {
        r: NotificationRoute.ExnIpexApply,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexApply,
      read: true,
      linkedRequest: {
        accepted: false,
        current: "current-offer-said",
      },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
    };
    notificationStorage.findById.mockResolvedValue(notificationRecord);
    getExchangeMock.mockReturnValueOnce(multisigExnOfferForPresenting);
    multisigService.getMultisigParticipants.mockResolvedValueOnce(
      multisigParticipantsProps
    );
    identifiersGetMock = jest
      .fn()
      .mockResolvedValueOnce(gHab)
      .mockResolvedValueOnce(mHab);
    getManagerMock.mockReturnValue({
      sign: () => [
        "ABDEouKAUhCDedOkqA5oxlMO4OB1C8p5M4G-_DLJWPf-ZjegTK-OxN4s6veE_7hXXuFzX4boq6evbLs5vFiVl-MB",
      ],
    });
    (Saider.saidify as jest.Mock).mockImplementation(
      jest.fn().mockReturnValue([{} as Saider, ipexGrantSerder.ked])
    );
    (Serder as jest.Mock).mockImplementation(
      jest.fn().mockReturnValue({
        ked: { d: "EKJEr0WbRERI1j2GjjfuReOIHjBSjC0tXguEaNYo5Hl6" },
      })
    );
    createExchangeMessageMock.mockResolvedValue([
      multisigOfferSerder,
      multisigOfferSig,
      multisigOfferEnd,
    ]);
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeOfferCredential,
    });

    await ipexCommunicationService.joinMultisigOffer("apply-note-id");

    expect(createExchangeMessageMock).toBeCalledWith(
      mHab,
      MultiSigRoute.EXN,
      { gid: "EFr4DyYerYKgdUq3Nw5wbq7OjEZT6cn45omHCiIZ0elD" },
      {
        exn: [
          { ked: { d: "EKJEr0WbRERI1j2GjjfuReOIHjBSjC0tXguEaNYo5Hl6" } },
          "d",
        ],
      },
      "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF"
    );
    expect(ipexSubmitOfferMock).toBeCalledWith(
      "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      multisigOfferSerder,
      multisigOfferSig,
      multisigOfferEnd,
      [
        "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF",
        "EGaEIhOGSTPccSMvnXvfvOVyC1C5AFq62GLTrRKVZBS5",
      ]
    );
    expect(operationPendingStorage.save).toBeCalledWith({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangeOfferCredential,
    });
    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: "id",
        route: NotificationRoute.ExnIpexApply,
        linkedRequest: {
          accepted: true,
          current: "current-offer-said",
        },
      })
    );
  });

  test("Cannot join group to offer ACDC if linked apply notification does not exist", async () => {
    notificationStorage.findById.mockResolvedValue(null);

    await expect(
      ipexCommunicationService.joinMultisigOffer("apply-note-id")
    ).rejects.toThrowError(IpexCommunicationService.NOTIFICATION_NOT_FOUND);

    expect(ipexSubmitOfferMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Cannot join group to offer ACDC twice", async () => {
    const notificationRecord = {
      type: "NotificationRecord",
      id: "id",
      a: {
        r: NotificationRoute.ExnIpexApply,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexApply,
      read: true,
      linkedRequest: {
        accepted: true,
        current: "current-offer-said",
      },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
    };
    notificationStorage.findById.mockResolvedValue(notificationRecord);

    await expect(
      ipexCommunicationService.joinMultisigOffer("apply-note-id")
    ).rejects.toThrowError(IpexCommunicationService.IPEX_ALREADY_REPLIED);

    expect(ipexSubmitOfferMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Cannot join group to offer ACDC if there is no current offer", async () => {
    const notificationRecord = {
      type: "NotificationRecord",
      id: "id",
      a: {
        r: NotificationRoute.ExnIpexApply,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexApply,
      read: true,
      linkedRequest: {
        accepted: false,
      },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
    };
    notificationStorage.findById.mockResolvedValue(notificationRecord);

    await expect(
      ipexCommunicationService.joinMultisigOffer("apply-note-id")
    ).rejects.toThrowError(
      IpexCommunicationService.NO_CURRENT_IPEX_MSG_TO_JOIN
    );

    expect(ipexSubmitOfferMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Can retrieve the current offered credential SAID", async () => {
    getExchangeMock.mockReturnValueOnce(multisigExnOfferForPresenting);

    const result = await ipexCommunicationService.getOfferedCredentialSaid(
      "current-said"
    );

    expect(result).toEqual("EEuFpvZ2G_YMm3smqbwZn4SWArxQOen7ZypVVfr6fVCT");
    expect(getExchangeMock).toBeCalledWith("current-said");
  });
});

describe("Offer ACDC group progress", () => {
  beforeAll(async () => {
    await new ConfigurationService().start();
  });

  test("Cannot get group offer progress if the apply notification is missing in the DB", async () => {
    notificationStorage.findById.mockResolvedValueOnce(null);

    await expect(
      ipexCommunicationService.getLinkedGroupFromIpexApply("apply-note-id")
    ).rejects.toThrowError(
      `${IpexCommunicationService.NOTIFICATION_NOT_FOUND} ${"apply-note-id"}`
    );
  });

  test("Should return the current progress of a group offer", async () => {
    const applyNoteRecord = {
      linkedRequest: {
        accepted: true,
        current: "current-offer-said",
      },
      a: { d: "d" },
    };
    notificationStorage.findById.mockResolvedValueOnce(applyNoteRecord);
    getExchangeMock.mockImplementationOnce(() => ({
      exn: { rp: "i" },
    }));
    identifiersGetMock = jest.fn().mockResolvedValueOnce({
      state: {
        kt: "2",
      },
    });
    identifiersMemberMock.mockResolvedValueOnce({
      signing: [
        {
          aid: "memberA",
        },
        {
          aid: "memberB",
        },
        {
          aid: "memberC",
        },
      ],
    });
    getRequestMock.mockResolvedValueOnce([
      { exn: { i: "memberB" } },
      { exn: { i: "memberC" } },
    ]);

    const result = await ipexCommunicationService.getLinkedGroupFromIpexApply(
      "id"
    );

    expect(result).toEqual({
      members: ["memberA", "memberB", "memberC"],
      threshold: "2",
      linkedRequest: {
        accepted: true,
        current: "current-offer-said",
      },
      othersJoined: ["memberB", "memberC"],
    });
  });

  test("Should return the defaults when there is no offer linked to the apply", async () => {
    const applyNoteRecord = {
      linkedRequest: {
        accepted: false,
      },
      a: { d: "d" },
    };
    getExchangeMock.mockImplementation(() => ({
      exn: { rp: "i" },
    }));
    identifiersGetMock = jest.fn().mockResolvedValue({
      state: {
        kt: "2",
      },
    });
    identifiersMemberMock.mockResolvedValue({
      signing: [
        {
          aid: "memberA",
        },
        {
          aid: "memberB",
        },
      ],
    });
    notificationStorage.findById.mockResolvedValue(applyNoteRecord);

    const result = await ipexCommunicationService.getLinkedGroupFromIpexApply(
      "id"
    );

    expect(result).toEqual({
      members: ["memberA", "memberB"],
      threshold: "2",
      linkedRequest: { accepted: false },
      othersJoined: [],
    });
  });
});

describe("Grant ACDC individual actions", () => {
  beforeAll(async () => {
    await new ConfigurationService().start();
  });

  test("Can present ACDC in response to agree", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    eventEmitter.emit = jest.fn();
    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: "note-id",
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexAgree,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexAgree,
      read: true,
      linkedRequest: { accepted: false },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });
    getExchangeMock.mockResolvedValue(agreeForPresentingExnMessage);
    identifierStorage.getIdentifierMetadata = jest.fn().mockReturnValue({
      id: "abc123",
    });
    credentialGetMock.mockResolvedValue(credentialProps);
    saveOperationPendingMock.mockResolvedValueOnce({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangePresentCredential,
    });
    ipexGrantMock.mockResolvedValue([
      { ked: { d: "grant-said" } },
      "sigs",
      "gend",
    ]);
    markNotificationMock.mockResolvedValueOnce({ status: "done" });

    await ipexCommunicationService.grantAcdcFromAgree("agree-note-id");

    expect(ipexGrantMock).toBeCalledWith({
      acdc: new Serder(credentialProps.sad),
      acdcAttachment: credentialProps.atc,
      anc: new Serder(credentialProps.anc),
      ancAttachment: credentialProps.ancatc,
      iss: new Serder(credentialProps.iss),
      issAttachment: undefined,
      recipient: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
      senderName: "abc123",
      agreeSaid: "EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL",
    });
    expect(ipexSubmitGrantMock).toBeCalledWith(
      "abc123",
      { ked: { d: "grant-said" } },
      "sigs",
      "gend",
      ["EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x"]
    );
    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: "note-id",
        route: NotificationRoute.ExnIpexAgree,
        linkedRequest: {
          accepted: true,
          current: "grant-said",
        },
      })
    );
    expect(operationPendingStorage.save).toBeCalledWith({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangePresentCredential,
    });
    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: "note-id",
        hidden: true,
        linkedRequest: { accepted: true, current: "grant-said" },
      })
    );
    expect(updateContactMock).toBeCalledWith(
      "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
      {
        [`${KeriaContactKeyPrefix.HISTORY_IPEX}EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL`]:
          JSON.stringify({
            id: "EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL",
            dt: agreeForPresentingExnMessage.exn.dt,
            credentialType: QVISchema.title,
            connectionId: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
            historyType: ConnectionHistoryType.IPEX_AGREE_COMPLETE,
          }),
      }
    );
  });

  test("Cannot present ACDC if the notification is missing in the DB", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const id = "not-found-id";
    notificationStorage.findById = jest.fn().mockResolvedValue(null);

    await expect(
      ipexCommunicationService.grantAcdcFromAgree(id)
    ).rejects.toThrowError(
      `${IpexCommunicationService.NOTIFICATION_NOT_FOUND} ${id}`
    );

    expect(ipexGrantMock).not.toBeCalled();
    expect(ipexSubmitGrantMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
    expect(updateContactMock).not.toBeCalled();
  });

  test("Cannot present non existing ACDC", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    eventEmitter.emit = jest.fn();
    notificationStorage.findById = jest.fn().mockResolvedValueOnce({
      type: "NotificationRecord",
      id: "note-id",
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexAgree,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexAgree,
      read: true,
      linkedRequest: { accepted: false, current: "current-grant-said" },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });
    getExchangeMock.mockResolvedValue(agreeForPresentingExnMessage);
    identifierStorage.getIdentifierMetadata = jest.fn().mockReturnValue({
      id: "abc123",
    });
    credentialGetMock.mockRejectedValue(
      new Error("request - 404 - SignifyClient message")
    );

    await expect(
      ipexCommunicationService.grantAcdcFromAgree("id")
    ).rejects.toThrowError(IpexCommunicationService.CREDENTIAL_NOT_FOUND);

    expect(ipexGrantMock).not.toBeCalled();
    expect(ipexSubmitGrantMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
    expect(updateContactMock).not.toBeCalled();
  });

  test("Should throw if unknown error occurs when fetching ACDC to present", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    getExchangeMock.mockReturnValue(agreeForPresentingExnMessage);
    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: "note-id",
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexAgree,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexAgree,
      read: true,
      linkedRequest: { accepted: false },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });
    const errorMessage = new Error("Error - 500");
    credentialGetMock.mockRejectedValue(errorMessage);

    await expect(
      ipexCommunicationService.grantAcdcFromAgree("id")
    ).rejects.toThrow(errorMessage);

    expect(ipexGrantMock).not.toBeCalled();
    expect(ipexSubmitGrantMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
    expect(updateContactMock).not.toBeCalled();
  });
});

describe("Grant ACDC group actions", () => {
  beforeAll(async () => {
    await new ConfigurationService().start();
    eventEmitter.emit = jest.fn();
  });

  test("Can begin presenting an ACDC in response to agree", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: "note-id",
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexAgree,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexAgree,
      read: true,
      linkedRequest: { accepted: false },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });
    getExchangeMock.mockResolvedValue(agreeForPresentingExnMessage);
    credentialGetMock.mockResolvedValue(credentialProps);
    getManagerMock.mockResolvedValue({
      sign: () => [
        "ABDEouKAUhCDedOkqA5oxlMO4OB1C8p5M4G-_DLJWPf-ZjegTK-OxN4s6veE_7hXXuFzX4boq6evbLs5vFiVl-MB",
      ],
    });
    saveOperationPendingMock.mockResolvedValue({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangePresentCredential,
    });
    ipexGrantMock.mockResolvedValue(["grant", ["sigs"], "gend"]);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValueOnce(groupIdentifierMetadataRecord);
    multisigService.getMultisigParticipants.mockResolvedValueOnce(
      multisigParticipantsProps
    );
    identifiersGetMock = jest
      .fn()
      .mockResolvedValueOnce(gHab)
      .mockResolvedValueOnce(mHab);
    ipexOfferMock.mockResolvedValue(["offer", ["sigs"], "oend"]);
    createExchangeMessageMock.mockResolvedValue([
      ipexSubmitGrantSerder,
      ipexSubmitGrantSig,
      ipexSubmitGrantEnd,
    ]);
    schemaGetMock.mockResolvedValue(QVISchema);

    await ipexCommunicationService.grantAcdcFromAgree("agree-note-id");

    expect(ipexGrantMock).toBeCalledWith({
      acdc: new Serder(credentialProps.sad),
      acdcAttachment: credentialProps.atc,
      anc: new Serder(credentialProps.anc),
      ancAttachment: credentialProps.ancatc,
      iss: new Serder(credentialProps.iss),
      issAttachment: undefined,
      recipient: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
      senderName: "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      message: "",
      datetime: expect.any(String),
      agreeSaid: "EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL",
    });
    expect(ipexSubmitGrantMock).toBeCalledWith(
      "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      ipexSubmitGrantSerder,
      ipexSubmitGrantSig,
      ipexSubmitGrantEnd,
      [
        "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF",
        "EGaEIhOGSTPccSMvnXvfvOVyC1C5AFq62GLTrRKVZBS5",
      ]
    );
    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: "note-id",
        route: NotificationRoute.ExnIpexAgree,
        linkedRequest: {
          accepted: true,
          current: "EEpfEHR6EedLnEzleK7mM3AKJSoPWuSQeREC8xjyq3pa",
        },
      })
    );
    expect(operationPendingStorage.save).toBeCalledWith({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangePresentCredential,
    });
    expect(notificationStorage.deleteById).not.toBeCalled();

    expect(updateContactMock).toBeCalledWith(
      "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
      {
        [`${KeriaContactKeyPrefix.HISTORY_IPEX}EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL`]:
          JSON.stringify({
            id: "EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL",
            dt: agreeForPresentingExnMessage.exn.dt,
            credentialType: QVISchema.title,
            connectionId: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
            historyType: ConnectionHistoryType.IPEX_AGREE_COMPLETE,
          }),
      }
    );
  });

  test("Cannot begin presenting an ACDC twice", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    notificationStorage.findById = jest.fn().mockResolvedValue({
      type: "NotificationRecord",
      id: "note-id",
      createdAt: DATETIME,
      a: {
        r: NotificationRoute.ExnIpexAgree,
        d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
      },
      route: NotificationRoute.ExnIpexAgree,
      read: true,
      linkedRequest: { accepted: true, current: "current-grant-said" },
      connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
      updatedAt: DATETIME,
    });

    await expect(
      ipexCommunicationService.grantAcdcFromAgree("id")
    ).rejects.toThrowError(IpexCommunicationService.IPEX_ALREADY_REPLIED);

    expect(ipexGrantMock).not.toBeCalled();
    expect(ipexSubmitGrantMock).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });

  test("Can join group presentation of an ACDC", async () => {
    multisigService.getMultisigParticipants.mockResolvedValue(
      multisigParticipantsProps
    );
    identifiersGetMock = jest
      .fn()
      .mockResolvedValueOnce(gHab)
      .mockResolvedValueOnce(mHab);
    getManagerMock.mockReturnValue({
      sign: () => [
        "ABDEouKAUhCDedOkqA5oxlMO4OB1C8p5M4G-_DLJWPf-ZjegTK-OxN4s6veE_7hXXuFzX4boq6evbLs5vFiVl-MB",
      ],
    });
    (Saider.saidify as jest.Mock).mockImplementation(
      jest.fn().mockReturnValue([{} as Saider, ipexGrantSerder.ked])
    );
    (Serder as jest.Mock).mockImplementation(
      jest.fn().mockReturnValue({
        ked: { d: "EKJEr0WbRERI1j2GjjfuReOIHjBSjC0tXguEaNYo5Hl6" },
      })
    );
    createExchangeMessageMock.mockResolvedValue([
      ipexSubmitGrantSerder,
      ipexSubmitGrantSig,
      ipexSubmitGrantEnd,
    ]);
    saveOperationPendingMock.mockResolvedValue({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangePresentCredential,
    });

    await ipexCommunicationService.joinMultisigGrant(
      multisigExnGrant,
      new NotificationRecord({
        id: "note-id",
        createdAt: DATETIME,
        a: {
          r: NotificationRoute.ExnIpexAgree,
          d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
        },
        route: NotificationRoute.ExnIpexAgree,
        read: true,
        linkedRequest: {
          accepted: false,
          current: "current-grant-said",
        },
        connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
        receivingPre: "EI8fS00-AxbbqXmwoivpw-0ui0qgZtGbh8Ue-ZVbxYSZ",
      })
    );

    expect(createExchangeMessageMock).toBeCalledWith(
      mHab,
      MultiSigRoute.EXN,
      { gid: "EFr4DyYerYKgdUq3Nw5wbq7OjEZT6cn45omHCiIZ0elD" },
      {
        exn: [
          { ked: { d: "EKJEr0WbRERI1j2GjjfuReOIHjBSjC0tXguEaNYo5Hl6" } },
          "d",
        ],
      },
      "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF"
    );
    expect(ipexSubmitGrantMock).toBeCalledWith(
      "EC1cyV3zLnGs4B9AYgoGNjXESyQZrBWygz3jLlRD30bR",
      ipexSubmitGrantSerder,
      ipexSubmitGrantSig,
      ipexSubmitGrantEnd,
      [
        "ELmrDKf0Yq54Yq7cyrHwHZlA4lBB8ZVX9c8Ea3h2VJFF",
        "EGaEIhOGSTPccSMvnXvfvOVyC1C5AFq62GLTrRKVZBS5",
      ]
    );
    expect(operationPendingStorage.save).toBeCalledWith({
      id: "opName",
      recordType: OperationPendingRecordType.ExchangePresentCredential,
    });
    expect(notificationStorage.update).toBeCalledWith(
      expect.objectContaining({
        id: "note-id",
        route: NotificationRoute.ExnIpexAgree,
        linkedRequest: {
          accepted: true,
          current: "current-grant-said",
        },
      })
    );
  });

  test("Cannot join group to offer ACDC if there is no current offer", async () => {
    await expect(
      ipexCommunicationService.joinMultisigGrant(
        multisigExnGrant,
        new NotificationRecord({
          id: "id",
          a: {
            r: NotificationRoute.ExnIpexApply,
            d: "EIDUavcmyHBseNZAdAHR3SF8QMfX1kSJ3Ct0OqS0-HCW",
          },
          route: NotificationRoute.ExnIpexApply,
          read: true,
          linkedRequest: {
            accepted: false,
          },
          createdAt: new Date(),
          connectionId: "EEFjBBDcUM2IWpNF7OclCme_bE76yKE3hzULLzTOFE8E",
          receivingPre: "EI8fS00-AxbbqXmwoivpw-0ui0qgZtGbh8Ue-ZVbxYSZ",
        })
      )
    ).rejects.toThrowError(
      IpexCommunicationService.NO_CURRENT_IPEX_MSG_TO_JOIN
    );

    expect(ipexSubmitGrantMock).not.toBeCalled();
    expect(notificationStorage.save).not.toBeCalled();
    expect(operationPendingStorage.save).not.toBeCalled();
    expect(eventEmitter.emit).not.toBeCalled();
  });
});

// @TODO - foconnor: Split into individual describes and tidy up.
describe("IPEX communication service of agent", () => {
  beforeAll(async () => {
    await new ConfigurationService().start();
  });

  test("Can get matching credential for apply", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const notiId = "notiId";
    const mockExchange = {
      exn: {
        a: {
          i: "uuid",
          a: {
            fullName: "Mr. John Lucas Smith",
            licenseNumber: "SMITH01192OP",
          },
          s: "schemaSaid",
        },
        i: "i",
        rp: "id",
        e: {},
      },
    };
    getExchangeMock = jest.fn().mockResolvedValueOnce(mockExchange);
    const noti = {
      id: notiId,
      createdAt: new Date("2024-04-29T11:01:04.903Z").toISOString(),
      a: {
        d: "saidForUuid",
      },
      connectionId: "EGR7Jm38EcsXRIidKDZBYDm_xox6eapfU1tqxdAUzkFd",
      read: true,
      groupReplied: false,
    };
    schemaGetMock.mockResolvedValue(QVISchema);
    credentialStorage.getCredentialMetadatasById.mockResolvedValue([
      {
        id: "d",
        status: "confirmed",
        connectionId: "connectionId",
        isArchived: false,
        pendingDeletion: false,
      },
    ]);
    credentialListMock.mockResolvedValue([
      {
        sad: {
          d: "d",
        },
      },
    ]);
    expect(await ipexCommunicationService.getIpexApplyDetails(noti)).toEqual({
      credentials: [{ acdc: { d: "d" }, connectionId: "connectionId" }],
      schema: {
        description: "Qualified vLEI Issuer Credential",
        name: "Qualified vLEI Issuer Credential",
      },
      attributes: {
        fullName: "Mr. John Lucas Smith",
        licenseNumber: "SMITH01192OP",
      },
      identifier: "id",
    });
    expect(credentialListMock).toBeCalledWith({
      filter: expect.objectContaining({
        "-s": { $eq: mockExchange.exn.a.s },
        "-a-i": mockExchange.exn.rp,
      }),
    });
  });

  test("Can create linked ipex message record with message exchange route ipex/apply", async () => {
    schemaGetMock.mockResolvedValueOnce(QVISchema);

    await ipexCommunicationService.createLinkedIpexMessageRecord(
      applyForPresentingExnMessage,
      ConnectionHistoryType.CREDENTIAL_REQUEST_PRESENT
    );

    expect(updateContactMock).toBeCalledWith(
      applyForPresentingExnMessage.exn.i,
      {
        [`${KeriaContactKeyPrefix.HISTORY_IPEX}${applyForPresentingExnMessage.exn.d}`]:
          JSON.stringify({
            id: applyForPresentingExnMessage.exn.d,
            dt: applyForPresentingExnMessage.exn.dt,
            credentialType: QVISchema.title,
            connectionId: applyForPresentingExnMessage.exn.i,
            historyType: ConnectionHistoryType.CREDENTIAL_REQUEST_PRESENT,
          }),
      }
    );
    expect(schemaGetMock).toBeCalledWith(applyForPresentingExnMessage.exn.a.s);
    expect(connections.resolveOobi).toBeCalledTimes(1);
  });

  test("Can link credential presentation history items to the correct connection", async () => {
    schemaGetMock.mockResolvedValueOnce(QVISchema);

    await ipexCommunicationService.createLinkedIpexMessageRecord(
      grantForIssuanceExnMessage,
      ConnectionHistoryType.CREDENTIAL_PRESENTED
    );

    expect(updateContactMock).toBeCalledWith(
      grantForIssuanceExnMessage.exn.rp,
      {
        [`${KeriaContactKeyPrefix.HISTORY_IPEX}${grantForIssuanceExnMessage.exn.d}`]:
          JSON.stringify({
            id: grantForIssuanceExnMessage.exn.d,
            dt: grantForIssuanceExnMessage.exn.dt,
            credentialType: QVISchema.title,
            connectionId: grantForIssuanceExnMessage.exn.rp,
            historyType: ConnectionHistoryType.CREDENTIAL_PRESENTED,
          }),
      }
    );
    expect(schemaGetMock).toBeCalledWith(
      grantForIssuanceExnMessage.exn.e.acdc.s
    );
    expect(connections.resolveOobi).toBeCalledTimes(1);
  });

  test("Can create linked ipex message record with history type is credential revoked", async () => {
    schemaGetMock.mockResolvedValueOnce(QVISchema);
    getExchangeMock.mockResolvedValueOnce(grantForIssuanceExnMessage);

    await ipexCommunicationService.createLinkedIpexMessageRecord(
      grantForIssuanceExnMessage,
      ConnectionHistoryType.CREDENTIAL_REVOKED
    );

    expect(updateContactMock).toBeCalledWith(grantForIssuanceExnMessage.exn.i, {
      [`${KeriaContactKeyPrefix.HISTORY_REVOKE}${grantForIssuanceExnMessage.exn.e.acdc.d}`]:
        JSON.stringify({
          id: grantForIssuanceExnMessage.exn.d,
          dt: grantForIssuanceExnMessage.exn.dt,
          credentialType: QVISchema.title,
          connectionId: grantForIssuanceExnMessage.exn.i,
          historyType: ConnectionHistoryType.CREDENTIAL_REVOKED,
        }),
    });
    expect(schemaGetMock).toBeCalledWith(
      grantForIssuanceExnMessage.exn.e.acdc.s
    );
    expect(connections.resolveOobi).toBeCalledTimes(1);
  });

  test("Can create linked ipex message record with history type is credential admitted", async () => {
    schemaGetMock.mockResolvedValueOnce(QVISchema);
    getExchangeMock.mockResolvedValueOnce(grantForIssuanceExnMessage);

    await ipexCommunicationService.createLinkedIpexMessageRecord(
      grantForIssuanceExnMessage,
      ConnectionHistoryType.CREDENTIAL_ISSUANCE
    );

    expect(updateContactMock).toBeCalledWith(grantForIssuanceExnMessage.exn.i, {
      [`${KeriaContactKeyPrefix.HISTORY_IPEX}${grantForIssuanceExnMessage.exn.d}`]:
        JSON.stringify({
          id: grantForIssuanceExnMessage.exn.d,
          dt: grantForIssuanceExnMessage.exn.dt,
          credentialType: QVISchema.title,
          connectionId: grantForIssuanceExnMessage.exn.i,
          historyType: ConnectionHistoryType.CREDENTIAL_ISSUANCE,
        }),
    });
    expect(schemaGetMock).toBeCalledWith(
      grantForIssuanceExnMessage.exn.e.acdc.s
    );
    expect(connections.resolveOobi).toBeCalledTimes(1);
  });

  test("Should return early without error if there's no existing connection", async () => {
    connections.getConnectionById.mockRejectedValueOnce(
      new Error(Agent.MISSING_DATA_ON_KERIA)
    );

    await ipexCommunicationService.createLinkedIpexMessageRecord(
      admitForIssuanceExnMessage,
      ConnectionHistoryType.CREDENTIAL_ISSUANCE
    );

    expect(updateContactMock).not.toBeCalled();
    expect(connections.resolveOobi).not.toBeCalled();
  });

  test("Should throw error if history type invalid", async () => {
    schemaGetMock.mockResolvedValueOnce(QVISchema);
    getExchangeMock.mockResolvedValueOnce(agreeForPresentingExnMessage);
    await expect(
      ipexCommunicationService.createLinkedIpexMessageRecord(
        agreeForPresentingExnMessage,
        "invalid" as any
      )
    ).rejects.toThrowError(IpexCommunicationService.INVALID_HISTORY_TYPE);
  });

  test("Should throw error if schemas.get has an unexpected error", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    schemaGetMock.mockRejectedValueOnce(new Error("Unknown error"));
    await expect(
      ipexCommunicationService.createLinkedIpexMessageRecord(
        grantForIssuanceExnMessage,
        ConnectionHistoryType.CREDENTIAL_REQUEST_PRESENT
      )
    ).rejects.toThrowError(new Error("Unknown error"));
  });

  test("Cannot get matching credential for apply if cannot get the schema", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValueOnce(true);
    const notiId = "notiId";
    getExchangeMock = jest.fn().mockResolvedValueOnce({
      exn: {
        a: {
          i: "uuid",
          a: {},
          s: "schemaSaid",
        },
        i: "i",
        e: {},
      },
    });
    const noti = {
      id: notiId,
      createdAt: new Date("2024-04-29T11:01:04.903Z").toISOString(),
      a: {
        d: "saidForUuid",
      },
      connectionId: "EGR7Jm38EcsXRIidKDZBYDm_xox6eapfU1tqxdAUzkFd",
      read: true,
      groupReplied: false,
    };
    schemaGetMock.mockRejectedValue(
      new Error("request - 404 - SignifyClient message")
    );
    await expect(
      ipexCommunicationService.getIpexApplyDetails(noti)
    ).rejects.toThrowError(IpexCommunicationService.SCHEMA_NOT_FOUND);
  });

  test("Should throw error when KERIA is offline", async () => {
    await expect(
      ipexCommunicationService.admitAcdcFromGrant("id")
    ).rejects.toThrowError(Agent.KERIA_CONNECTION_BROKEN);
    const noti = {
      id: "id",
      createdAt: DATETIME.toISOString(),
      a: {
        d: "keri",
      },
      connectionId: "EGR7Jm38EcsXRIidKDZBYDm_xox6eapfU1tqxdAUzkFd",
      read: true,
      groupReplied: false,
    };
    await expect(
      ipexCommunicationService.offerAcdcFromApply(noti.id, {})
    ).rejects.toThrowError(Agent.KERIA_CONNECTION_BROKEN);
    await expect(
      ipexCommunicationService.grantAcdcFromAgree(noti.a.d)
    ).rejects.toThrowError(Agent.KERIA_CONNECTION_BROKEN);
    await expect(
      ipexCommunicationService.getIpexApplyDetails(noti)
    ).rejects.toThrowError(Agent.KERIA_CONNECTION_BROKEN);
  });

  test("Cannot get ipex apply details if the schema cannot be located", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const mockNotification = {
      a: {
        d: "msgSaid",
      },
    } as any;

    const mockMsg = {
      exn: {
        a: {
          s: "schemaSaid",
          a: {},
        },
        rp: "recipient",
      },
    };

    getExchangeMock.mockResolvedValueOnce(mockMsg);
    const error404 = new Error("Not Found - 404");
    schemaGetMock.mockRejectedValueOnce(error404);

    await expect(
      ipexCommunicationService.getIpexApplyDetails(mockNotification)
    ).rejects.toThrow(IpexCommunicationService.SCHEMA_NOT_FOUND);

    expect(getExchangeMock).toHaveBeenCalledWith("msgSaid");
    expect(schemaGetMock).toHaveBeenCalledWith("schemaSaid");
  });

  test("Should throw error for non-404 errors - getIpexApplyDetails", async () => {
    Agent.agent.getKeriaOnlineStatus = jest.fn().mockReturnValue(true);
    const mockNotification = {
      a: {
        d: "msgSaid",
      },
    } as any;

    const mockMsg = {
      exn: {
        a: {
          s: "schemaSaid",
          a: {},
        },
        rp: "recipient",
      },
    };

    getExchangeMock.mockResolvedValueOnce(mockMsg);
    const errorMessage = "Error - 500";
    schemaGetMock.mockRejectedValueOnce(new Error(errorMessage));

    await expect(
      ipexCommunicationService.getIpexApplyDetails(mockNotification)
    ).rejects.toThrow(new Error(errorMessage));

    expect(getExchangeMock).toHaveBeenCalledWith("msgSaid");
    expect(schemaGetMock).toHaveBeenCalledWith("schemaSaid");
  });

  test("Can get acdc detail", async () => {
    getExchangeMock.mockReturnValueOnce(grantForIssuanceExnMessage);
    schemaGetMock.mockResolvedValue(QVISchema);
    credentialStateMock.mockResolvedValueOnce(credentialStateIssued);

    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValueOnce(memberIdentifierRecord);

    expect(
      await ipexCommunicationService.getAcdcFromIpexGrant(
        "EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL"
      )
    ).toEqual({
      id: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
      schema: "EBIFDhtSE0cM4nbTnaMqiV1vUIlcnbsqBMeVMmeGmXOu",
      i: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
      a: {
        d: "ELHCh_X2aw7C-aYesOM4La23a5lsoNuJDuCsJuxwO2nq",
        i: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
        dt: "2024-07-30T04:19:55.348000+00:00",
        attendeeName: "ccc",
      },
      s: QVISchema,
      lastStatus: { s: "0", dt: "2024-11-07T08:32:34.943Z" },
      status: "pending",
      identifierId: grantForIssuanceExnMessage.exn.rp,
      connectionId: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
    });
  });

  test("Can get acdc detail when the schema has not been resolved", async () => {
    getExchangeMock.mockReturnValueOnce(grantForIssuanceExnMessage);
    credentialStateMock.mockResolvedValueOnce(credentialStateIssued);
    const error404 = new Error("Not Found - 404");
    schemaGetMock.mockRejectedValueOnce(error404);
    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValueOnce(memberIdentifierRecord);

    expect(
      await ipexCommunicationService.getAcdcFromIpexGrant(
        "EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL"
      )
    ).toEqual({
      id: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
      schema: "EBIFDhtSE0cM4nbTnaMqiV1vUIlcnbsqBMeVMmeGmXOu",
      i: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
      a: {
        d: "ELHCh_X2aw7C-aYesOM4La23a5lsoNuJDuCsJuxwO2nq",
        i: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
        dt: "2024-07-30T04:19:55.348000+00:00",
        attendeeName: "ccc",
      },
      s: QVISchema,
      lastStatus: { s: "0", dt: "2024-11-07T08:32:34.943Z" },
      status: "pending",
      identifierId: grantForIssuanceExnMessage.exn.rp,
      connectionId: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
    });
    expect(connections.resolveOobi).toBeCalledWith(
      "http://127.0.0.1:3001/oobi/EBIFDhtSE0cM4nbTnaMqiV1vUIlcnbsqBMeVMmeGmXOu",
      true
    );
  });

  test("Throws error if the schema has not been resolved and with a non-404 error - getAcdcFromIpexGrant", async () => {
    getExchangeMock.mockReturnValueOnce(grantForIssuanceExnMessage);
    const error = new Error("Some other error - 500");
    schemaGetMock.mockRejectedValueOnce(error);

    await expect(
      ipexCommunicationService.getAcdcFromIpexGrant("said")
    ).rejects.toThrow("Some other error - 500");
    expect(schemaGetMock).toHaveBeenCalledTimes(1);
    expect(connections.resolveOobi).not.toHaveBeenCalled();
  });

  test("Should return last status is revoked when getting credential state from cloud", async () => {
    getExchangeMock.mockReturnValueOnce(grantForIssuanceExnMessage);
    schemaGetMock.mockResolvedValue(QVISchema);
    credentialStateMock.mockResolvedValueOnce(credentialStateRevoked);

    identifierStorage.getIdentifierMetadata = jest
      .fn()
      .mockResolvedValueOnce(memberIdentifierRecord);

    expect(
      await ipexCommunicationService.getAcdcFromIpexGrant(
        "EJ1jbI8vTFCEloTfSsZkBpV0bUJnhGVyak5q-5IFIglL"
      )
    ).toEqual({
      id: "EAe_JgQ636ic-k34aUQMjDFPp6Zd350gEsQA6HePBU5W",
      schema: "EBIFDhtSE0cM4nbTnaMqiV1vUIlcnbsqBMeVMmeGmXOu",
      i: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
      a: {
        d: "ELHCh_X2aw7C-aYesOM4La23a5lsoNuJDuCsJuxwO2nq",
        i: "EE-gjeEni5eCdpFlBtG7s4wkv7LJ0JmWplCS4DNQwW2G",
        dt: "2024-07-30T04:19:55.348000+00:00",
        attendeeName: "ccc",
      },
      s: QVISchema,
      lastStatus: { s: "1", dt: "2024-11-07T08:32:34.943Z" },
      status: "pending",
      identifierId: grantForIssuanceExnMessage.exn.rp,
      connectionId: "EC9bQGHShmp2Juayqp0C5XcheBiHyc1p54pZ_Op-B95x",
    });
  });
});
