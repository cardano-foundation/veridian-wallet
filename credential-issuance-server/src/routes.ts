import express from "express";
import { config } from "./config";
import { ping } from "./apis/ping.api";
import { invitationApi } from "./apis/invitation.api";
import { createOfferInvitation, invitationWithCredential, credentialApi } from "./apis/credential.api";

const router = express.Router();
router.get(config.path.ping, ping);
router.get(config.path.invitation, invitationApi);
router.get(config.path.credential, credentialApi);
router.get(config.path.createOfferInvitation, createOfferInvitation);
router.get(config.path.createOfferInvitationWithConnectionLess, invitationWithCredential);

export default router;