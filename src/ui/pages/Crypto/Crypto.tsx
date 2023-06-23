import {
  IonButton,
  IonCol,
  IonGrid,
  IonIcon,
  IonModal,
  IonPage,
  IonRow,
  useIonViewWillEnter,
} from "@ionic/react";
import { useState } from "react";
import { walletOutline, addOutline } from "ionicons/icons";
import { TabLayout } from "../../components/layout/TabLayout";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setCurrentRoute } from "../../../store/reducers/stateCache";
import { TabsRoutePath } from "../../../routes/paths";
import { CardsPlaceholder } from "../../components/CardsPlaceholder";
import { getCryptoAccountsCache } from "../../../store/reducers/cryptoAccountsCache";
import { i18n } from "../../../i18n";
import "./Crypto.scss";
import { PageLayout } from "../../components/layout/PageLayout";

const Crypto = () => {
  const dispatch = useAppDispatch();
  const cryptoAccountsData = []; // useAppSelector(getCryptoAccountsCache);
  const [myWalletsIsOpen, setMyWalletsIsOpen] = useState(false);

  const handleAddCryptoAccount = () => {
    //
  };

  useIonViewWillEnter(() =>
    dispatch(setCurrentRoute({ path: TabsRoutePath.CRYPTO }))
  );

  const AdditionalButtons = () => {
    return (
      <IonButton
        shape="round"
        className="share-button"
        data-testid="share-button"
        onClick={() => {
          setMyWalletsIsOpen(true);
        }}
      >
        <IonIcon
          slot="icon-only"
          icon={walletOutline}
          color="primary"
        />
      </IonButton>
    );
  };

  const MyWallets = () => {
    return (
      <IonModal
        isOpen={myWalletsIsOpen}
        initialBreakpoint={1}
        breakpoints={[1]}
        className="page-layout"
        data-testid="my-wallets"
        onDidDismiss={() => setMyWalletsIsOpen(false)}
      >
        <div className="my-wallets modal">
          <PageLayout
            header={true}
            closeButton={false}
            title={`${i18n.t("crypto.mywalletsmodal.title")}`}
          >
            <IonGrid>
              <IonRow>
                <IonCol
                  size="12"
                  className="my-wallets-body"
                >
                  <i>{i18n.t("crypto.mywalletsmodal.empty")}</i>
                </IonCol>
              </IonRow>
            </IonGrid>
            <IonGrid>
              <IonRow>
                <IonCol
                  size="12"
                  className="my-wallets-footer"
                >
                  <IonButton
                    shape="round"
                    expand="block"
                    className="ion-primary-button"
                    onClick={handleAddCryptoAccount}
                  >
                    <IonIcon
                      slot="icon-only"
                      size="small"
                      icon={addOutline}
                      color="primary"
                    />
                    {i18n.t("crypto.mywalletsmodal.create")}
                  </IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </PageLayout>
        </div>
      </IonModal>
    );
  };

  return (
    <>
      <IonPage
        className="tab-layout"
        data-testid="crypto-tab"
      >
        <TabLayout
          header={true}
          title=""
          menuButton={true}
          additionalButtons={<AdditionalButtons />}
        >
          {cryptoAccountsData.length ? (
            <div>Account details here</div>
          ) : (
            <CardsPlaceholder
              buttonLabel={i18n.t("crypto.tab.create")}
              buttonAction={handleAddCryptoAccount}
            />
          )}
        </TabLayout>
      </IonPage>
      <MyWallets />
    </>
  );
};

export { Crypto };
