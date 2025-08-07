import { IonButton, IonIcon } from "@ionic/react";
import { addOutline } from "ionicons/icons";
import { useMemo, useRef } from "react";
import { SubMenuData, SubMenuKey } from "../Menu.types";
import { ConnectWallet, ConnectWalletOptionRef } from "./ConnectWallet";

const emptySubMenu = {
  Component: () => <></>,
  title: "",
  closeButtonLabel: undefined,
  closeButtonAction: undefined,
  additionalButtons: <></>,
  actionButton: false,
  actionButtonAction: undefined,
  actionButtonLabel: undefined,
  pageId: "empty",
  nestedMenu: false,
  renderAsModal: false,
};

const SubMenuItems = () => {
  const connectWalletRef = useRef<ConnectWalletOptionRef>(null);

  const menuMapData: [SubMenuKey, SubMenuData][] = [
    [
      SubMenuKey.ConnectWallet,
      {
        Component: () => <ConnectWallet ref={connectWalletRef} />,
        title: "tabs.menu.tab.items.connectwallet.tabheader",
        pageId: "connect-wallet",
        nestedMenu: false,
        additionalButtons: (
          <IonButton
            shape="round"
            className="connect-wallet-button"
            data-testid="menu-add-connection-button"
            onClick={() => connectWalletRef.current?.openConnectWallet()}
          >
            <IonIcon
              slot="icon-only"
              icon={addOutline}
              color="primary"
            />
          </IonButton>
        ),
        renderAsModal: false,
      },
    ],
  ];

  const subMenuMapData: [SubMenuKey, SubMenuData][] = [...menuMapData];

  return useMemo(() => new Map(subMenuMapData), []);
};

export { emptySubMenu, SubMenuItems };
