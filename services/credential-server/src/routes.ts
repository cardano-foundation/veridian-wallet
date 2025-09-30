import express, { Router } from "express";
import { contactList, deleteContact } from "./apis/contact.api";
import {
  contactCredentials,
  issueAcdcCredential,
  requestDisclosure,
  revokeCredential,
  verifyIpexPresentation,
  getPresentationRequests,
} from "./apis/credential.api";
import { keriOobiApi } from "./apis/invitation.api";
import { resolveOobi } from "./apis/oobi.api";
import { ping } from "./apis/ping.api";
import { schemaApi } from "./apis/schema.api";
import { config } from "./config";

export const router: Router = express.Router();
router.get(config.path.ping, ping);
router.get(config.path.keriOobi, keriOobiApi);
router.post(config.path.issueAcdcCredential, issueAcdcCredential);
router.post(config.path.resolveOobi, resolveOobi);
router.get(config.path.contacts, contactList);
router.get(config.path.contactCredentials, contactCredentials);
router.get(config.path.schemas, schemaApi);
router.post(config.path.requestDisclosure, requestDisclosure);
router.post(config.path.revokeCredential, revokeCredential);
router.post(config.path.verifyIpexPresentation, verifyIpexPresentation);
router.get(config.path.getPresentationRequests, getPresentationRequests);
router.delete(config.path.deleteContact, deleteContact);
