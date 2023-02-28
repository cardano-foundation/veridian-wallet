import React, {useEffect, useState} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {
  IonButton,
  IonChip,
  IonCol,
  IonGrid,
  IonItem,
  IonLabel,
  IonPage,
  IonProgressBar,
  IonRow,
} from '@ionic/react';
import {addOutline} from 'ionicons/icons';
import CustomPage from '../layouts/PageLayout';
import {equals, shuffle} from '../../utils/utils';
import {Account} from '../../models/Account/Account';
import {createAccount} from '../../lib/wallet';
import {ERA} from '../../models/types';
import {
  getCachedAccounts,
  setAccountsIdsInCache,
} from '../../store/reducers/cache';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

const VerifySeedPhrase = ({}) => {
  const pageName = 'Verify Seed Phrase';
  const location = useLocation();
  const nav = useHistory();
  const dispatch = useAppDispatch();
  const cachedAccounts = useAppSelector(getCachedAccounts);
  const originalSeedPhrase = location.state?.seedPhrase;
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [seedMatch, setSeedMatch] = useState<string[]>([]);

  const handleNavigation = (route: string) => {
    nav.push({
      pathname: route,
      state: {
        seedPhrase,
      },
    });
  };

  useEffect(() => {
    if (originalSeedPhrase && originalSeedPhrase.length) {
      setSeedPhrase(shuffle(originalSeedPhrase));
    }
  }, []);

  const addSeedMatch = (word: string, i: number) => {
    setSeedMatch((seedMatch) => [...seedMatch, word]);

    const index = seedPhrase.indexOf(word);
    if (index > -1) {
      seedPhrase.splice(index, 1);
    }
    setSeedPhrase(seedPhrase);
  };

  const removeWordFromSeedPhrase = (array: string[], word: string) => {
    const seedPhrase = [...array];
    const index = seedPhrase.indexOf(word);
    if (index > -1) {
      seedPhrase.splice(index, 1);
    }
    return seedPhrase;
  };
  const removeSeedMatch = (word: string, i: number) => {
    setSeedPhrase((seedPhrase) => [...seedPhrase, word]);

    setSeedMatch((seedMatch) => removeWordFromSeedPhrase(seedMatch, word));
  };

  const onVerifySeedPhrase = async () => {
    try {
      if (location.state?.walletName && location.state?.walletPassword) {
        const account: Account = await createAccount(
          location.state?.walletName,
          originalSeedPhrase.join(' '),
          ERA.SHELLEY,
          location.state?.walletPassword
        );

        if (account?.id) {
          account.commit();
          dispatch(
            setAccountsIdsInCache(
              cachedAccounts ? [...cachedAccounts, account.id] : [account.id]
            )
          );
          handleNavigation('/tabs/crypto');
        }
      }
    } catch (err) {
      console.log('Error: ', err);
    }
  };

  return (
    <IonPage id={pageName}>
      <CustomPage
        name={pageName}
        sideMenu={false}
        sideMenuPosition="start"
        backButton={true}
        backButtonText="Back"
        backButtonPath={'/recoveryseedphrase'}
        actionButton={false}
        actionButtonIcon={addOutline}
        actionButtonIconSize="1.7rem">
        <IonProgressBar
          value={0.75}
          buffer={1}
        />
        <IonGrid className="min-h-[60vh]">
          <IonRow>
            <IonCol size="12">
              <IonItem>
                <IonLabel className="my-2 disclaimer-text">
                  Enter your secret recovery seed phrase in the correct order to
                  continue to the next step.
                </IonLabel>
              </IonItem>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12">
              <div className="grid grid-cols-3 gap-2 p-2 m-2 border min-h-[6rem] rounded-lg">
                {seedMatch.map((word, index) => (
                  <IonChip
                    className="text-sm"
                    key={index}
                    onClick={(event) => {
                      removeSeedMatch(word, index);
                    }}>
                    <span className="w-full text-left">
                      <span className="text-gray-500 mr-2">{index + 1}</span>
                      <span>{word}</span>
                    </span>
                  </IonChip>
                ))}
              </div>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12">
              <div className="grid grid-cols-3 gap-2 px-2 m-2">
                {seedPhrase.map((word, index) => (
                  <IonChip
                    className="text-sm"
                    key={index}
                    onClick={(event) => {
                      addSeedMatch(word, index);
                    }}>
                    <span className="w-full text-center">{word}</span>
                  </IonChip>
                ))}
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonGrid className="mt-3">
          <IonRow>
            <IonCol>
              <IonButton
                shape="round"
                color="primary"
                expand="block"
                className="h-auto my-4"
                onClick={() => onVerifySeedPhrase()}
                disabled={!equals(originalSeedPhrase, seedMatch)}>
                Continue
              </IonButton>
              <IonButton
                shape="round"
                expand="block"
                className="h-auto my-4 secondary-button"
                onClick={() => handleNavigation('/tabs/crypto')}>
                Cancel
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </CustomPage>
    </IonPage>
  );
};

export default VerifySeedPhrase;
