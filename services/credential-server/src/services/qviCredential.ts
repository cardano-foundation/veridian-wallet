import { SignifyApi } from "../modules/signify/signifyApi";
import { config } from "../config";
import { ISSUER_AID_NAME, HOLDER_AID_NAME, QVI_SCHEMA_SAID } from "../consts";

async function createQVICredential(
  signifyApi: SignifyApi,
  signifyApiIssuer: SignifyApi,
  keriIssuerRegistryRegk: string
): Promise<string> {
  const issuerAid = await signifyApiIssuer.getIdentifierByName(ISSUER_AID_NAME);
  const holderAid = await signifyApi.getIdentifierByName(HOLDER_AID_NAME);

  const issuerAidOobi = await signifyApiIssuer.getOobi(issuerAid.name);
  const holderAidOobi = await signifyApi.getOobi(holderAid.name);

  await signifyApi.resolveOobi(issuerAidOobi);
  await signifyApiIssuer.resolveOobi(holderAidOobi);

  const qviCredentialId = await signifyApiIssuer.issueQVICredential(
    issuerAid.name,
    keriIssuerRegistryRegk,
    holderAid.prefix
  );

  // wait for notification
  const getHolderNotifications = async () => {
    let holderNotifications = await signifyApi.getNotifications();

    while (!holderNotifications.total) {
      holderNotifications = await signifyApi.getNotifications();
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    return holderNotifications;
  };

  const grantNotification = (await getHolderNotifications()).notes[0];

  // resolve schema
  await signifyApi.resolveOobi(
    `${config.oobiEndpoint}/oobi/${QVI_SCHEMA_SAID}`
  );

  // holder IPEX admit
  await signifyApi.admitCredential(
    holderAid.name,
    grantNotification.a.d!,
    issuerAid.prefix
  );
  await signifyApi.deleteNotification(grantNotification.i);

  return qviCredentialId;
}

export { createQVICredential };
