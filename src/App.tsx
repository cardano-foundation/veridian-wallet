import React, {useRef} from 'react';
import {IonApp, setupIonicReact} from '@ionic/react';
import {useHistory} from 'react-router-dom';
import {useEffect} from 'react';
import NavRoutes from './main/nav/NavRoutes';
import {SideMenuProvider} from './main/SideMenuProvider';
/* Core CSS required for Ionic components to work properly */
import './theme/tailwind.css';
import './theme/App.scss';
import './theme/variables.css';
import './theme/structure.css';
import AppWrapper from './components/AppWrapper';
import {HandleConnect} from './api/p2p/HandleConnect';

export const handleConnect = new HandleConnect();

setupIonicReact();

const App = (isExtension?: boolean) => {
  const history = useHistory();

  if (isExtension && history) {
    console.log('isExtension44');
    console.log(window.location.pathname);
    history.push('/');
  }

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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const init = async () => {};
    if (isMounted.current) {
      init().catch(console.error);
    }
  }, []);

  return (
    <IonApp>
      <AppWrapper>
        <SideMenuProvider>
          <NavRoutes />
        </SideMenuProvider>
      </AppWrapper>
    </IonApp>
  );
};

export default App;
