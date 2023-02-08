import React, {useEffect, useRef, useState} from 'react';
import {useHistory} from 'react-router-dom';
import {
  IonCol,
  IonGrid,
  IonPage,
  IonRow,
  IonButton,
  IonIcon,
  IonModal,
  IonContent,
  IonItem,
  IonLabel,
  IonPopover,
  IonCardHeader,
  IonCard,
} from '@ionic/react';
import {
  addOutline,
  copyOutline,
  ellipsisVertical,
  informationCircleOutline,
  trashOutline,
} from 'ionicons/icons';
import CustomPage from '../../../main/CustomPage';
import './Crypto.css';
import {subscribe} from '../../../utils/events';

const Crypto = (props) => {
  const pageName = 'My Wallets';
  const wallets = [
    {
      name: 'Wallet #1',
      id: 'CW0001',
      currency: 'ADA ₳',
      balance: '10,000.000000',
    },
    {
      name: 'Wallet #2',
      id: 'CW0002',
      currency: 'ADA ₳',
      balance: '5,000.000000',
    },
    {
      name: 'Wallet #3',
      id: 'CW0003',
      currency: 'ADA ₳',
      balance: '250.000000',
    },
  ];
  const nav = useHistory();
  const modal = useRef(null);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const popover = useRef<HTMLIonPopoverElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    subscribe('ionBackButton', () => {
      nav.replace('/tabs/crypto');
    });
  }, []);

  const renderWallets = (wallets) => {
    return wallets.map((wallet, index) => (
      <IonRow
        className="ion-text-center"
        key={index}>
        <IonCol>
          <IonCard>
            <IonCardHeader>
              <div className="py-2">
                <IonItem className="w-full">
                  <IonRow className={'pl-4'}>
                    <IonLabel className="font-extrabold w-full">
                      {wallet.name}
                    </IonLabel>

                    <IonLabel className="text-sm">
                      {wallet.currency}
                      {wallet.balance}
                    </IonLabel>
                  </IonRow>
                  <IonIcon
                    id={`popover-button-${wallet.id}-${wallet.name}`}
                    icon={ellipsisVertical}
                    className="float-right"
                    slot="end"
                  />
                </IonItem>
                <IonPopover
                  className="scroll-y-hidden"
                  trigger={`popover-button-${wallet.id}-${wallet.name}`}
                  dismissOnSelect={true}
                  size={'auto'}
                  side="bottom"
                  ref={popover}
                  isOpen={popoverOpen}
                  onDidDismiss={() => setPopoverOpen(false)}>
                  <>
                    <IonRow>
                      <IonItem
                        className="px-4 py-2"
                        onClick={() => handleNavigation(`/did/${wallet.id}`)}>
                        <IonIcon
                          slot="start"
                          icon={informationCircleOutline}
                        />
                        <IonLabel> More details</IonLabel>
                      </IonItem>
                    </IonRow>
                    <IonRow>
                      <IonItem className="px-4 py-2">
                        <IonIcon
                          slot="start"
                          icon={copyOutline}
                        />
                        <IonLabel> Copy Address</IonLabel>
                      </IonItem>
                    </IonRow>
                    <IonRow>
                      <IonItem className="px-4 py-2">
                        <IonIcon
                          slot="start"
                          icon={trashOutline}
                        />
                        <IonLabel>Delete</IonLabel>
                      </IonItem>
                    </IonRow>
                  </>
                </IonPopover>
              </div>
            </IonCardHeader>
          </IonCard>
        </IonCol>
      </IonRow>
    ));
  };

  const history = useHistory();

  const handleNavigation = (route: string) => {
    setShowAddWallet(false);
    history.push({
      pathname: route,
    });
  };

  const WalletButtons = () => {
    return (
      <IonGrid className="ion-margin buttons_grid">
        <IonRow className="ion-text-center">
          <IonCol>
            <IonButton
              shape="round"
              color="dark"
              expand="block"
              onClick={() => {
                handleNavigation('/createwallet');
              }}
              className="h-auto my-4">
              Create New Wallet
            </IonButton>
            <IonButton
              shape="round"
              color="light"
              expand="block"
              className="h-auto my-4">
              Recover Existing Wallet
            </IonButton>
          </IonCol>
        </IonRow>
      </IonGrid>
    );
  };

  return (
    <IonPage id={pageName}>
      <CustomPage
        name={pageName}
        sideMenu={false}
        sideMenuPosition="start"
        actionButton={!!wallets.length}
        actionButtonIcon={addOutline}
        actionButtonIconSize="1.7rem"
        actionButtonClickEvent={() => {
          setShowAddWallet(true);
          nav.push(nav.location.pathname + '?modalOpened=true');
        }}>
        <IonModal
          id="create-wallet-modal"
          isOpen={showAddWallet}
          ref={modal}
          trigger="open-create"
          onWillDismiss={() => setShowAddWallet(false)}
          initialBreakpoint={0.6}
          breakpoints={[0, 0.6]}>
          <IonContent className="ion-padding">
            <WalletButtons />
          </IonContent>
        </IonModal>
        {wallets.length ? (
          <IonGrid className="ion-margin">{renderWallets(wallets)}</IonGrid>
        ) : (
          <WalletButtons />
        )}
      </CustomPage>
    </IonPage>
  );
};

export default Crypto;
