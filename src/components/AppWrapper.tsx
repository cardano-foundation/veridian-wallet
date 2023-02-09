import React, {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {CardanoAPI} from '../lib/CardanoAPI';
import {Account} from '../models/Account/Account';
import {useAppDispatch, useAppSelector} from "../store/hooks";
import {selectCount} from "../store/reducers/counter";
import {Cache} from "../models/Cache/Cache";
import {Settings} from "../models/Settings/Settings";
import {getCachedAccount, setAccountsIdsInCache, setCache} from "../store/reducers/cache";
import {setCurrentAccount} from "../store/reducers/account";
import {setSettings} from "../store/reducers/settings";
import {changeTheme} from "../theme/handleTheme";

const AppWrapper = (props: { children: any }) => {
  const {t, i18n} = useTranslation();

  const count = useAppSelector(selectCount);
  const cachedAccount = useAppSelector(getCachedAccount);
  const dispatch = useAppDispatch();
  const [incrementAmount] = useState('2');

  const useIsMounted = () => {
    const isMounted = useRef(false);

    // @ts-ignore
    useEffect(() => {
      isMounted.current = true;
      return () => (isMounted.current = false);
    }, []);
    return isMounted;
  };

  const isMounted = useIsMounted();

  useEffect(() => {
    const init = async () => {
      await initApp();

    };
    if (isMounted.current) {
      // call the function
      init()
          // make sure to catch any error
          .catch(console.error);
    }
  }, []);

  const initApp = async () => {
    await CardanoAPI.init();
    await Cache.init();
    dispatch(setCache(Cache.get()));
    await Settings.init();

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      console.log("OS is dark mode")
    } else {
      console.log("OS is dark mode")
    }

    if (Settings.theme?.length) {
      // Use matchMedia to check the user preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      if (
          (prefersDark.matches && Settings.theme !== 'dark')
          || (!prefersDark.matches && Settings.theme !== 'light')
      ) {
        changeTheme();
      }
    }

    dispatch(setSettings(Settings.get()));


    const accountsIds: string[] = await Account.getAllAccountsIds() || [];
    dispatch(setAccountsIdsInCache(accountsIds));

    const currentAccount = await Account.getAccount(cachedAccount);
    if (currentAccount) {
      dispatch(setCurrentAccount(currentAccount.get()));
    } else {
      const firstAccount = await Account.getFirstAccount();
      if (firstAccount) dispatch(setCurrentAccount(firstAccount.get()));
    }


    /*
    console.log("lets init blockfrost");
    await Blockfrost.init('preview');
    const latestParameters = await Blockfrost.epochsLatestParameters();
    console.log("latestParameters");
    console.log(latestParameters);
    const accountState = await Blockfrost.accountState('stake_test1uz4j5w46kceey5kflku62xh9szvk2n3rj88qwct0pcdhxjc4vk9ws');
    console.log("accountState");
    console.log(accountState);
    */


  };

  useEffect(() => {


    const init = async () => {
      /*
     console.log("query graph");
     const graphqlStatus = await GraphQl.epochsLatestParameters();
     console.log("graphqlStatus");
     console.log(graphqlStatus);
     */


      /*
       const seed = CardanoAPI.generateSeedPhrase(
           ERA_PARAMS[ERA.SHELLEY].mneSize[24]
       );
       const account: Account = await createAccount(
           'jaime7',
           seed,
           ERA.SHELLEY,
           'B1234567B'
       );
      account.commit();
      */
    };

    if (isMounted.current) {
      // call the function
      init()
        // make sure to catch any error
        .catch(console.error);
    }

  }, []);

  return (
    <div
      id="appWrapper"
      data-theme="light">
      {props.children}
    </div>
  );
};

export default AppWrapper;
