import { addOutline } from "ionicons/icons";
import { useState } from "react";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  getAuthentication,
  getCurrentAccount,
  setShowWelcomePage,
} from "../../../../../store/reducers/stateCache";
import IdImage from "../../../../assets/images/id.png";
import WelcomeBG from "../../../../assets/images/welcome-bg.svg";
import { CreateIdentifier } from "../../../../components/CreateIdentifier";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { ResponsivePageLayout } from "../../../../components/layout/ResponsivePageLayout";
import "./Welcome.scss";
import { Agent } from "../../../../../core/agent/agent";
import { MiscRecordId } from "../../../../../core/agent/agent.types";
import { IdentifierShortDetails } from "../../../../../core/agent/services/identifier.types";

interface WelcomeProps {
  onCreateGroupIdentifier?: (identifier: IdentifierShortDetails) => void;
}

const Welcome = ({ onCreateGroupIdentifier }: WelcomeProps) => {
  const pageId = "welcome";
  const currentAccount = useAppSelector(getCurrentAccount);
  const dispatch = useAppDispatch();
  const [openCreate, setOpenCreate] = useState(false);

  const skip = () => {
    Agent.agent.basicStorage.deleteById(MiscRecordId.APP_FIRST_INSTALL);
    dispatch(setShowWelcomePage(false));
  };

  const onView = () => {
    setOpenCreate(true);
  };

  const handleCloseModal = (identifier?: IdentifierShortDetails) => {
    if (identifier) {
      if (identifier.groupMetadata) {
        onCreateGroupIdentifier?.(identifier);
      }
      skip();
    }

    setOpenCreate(false);
  };

  return (
    <>
      <ResponsivePageLayout
        pageId={pageId}
        header={
          <PageHeader
            actionButton
            actionButtonLabel={`${i18n.t("tabs.identifiers.tab.welcome.skip")}`}
            actionButtonAction={skip}
          />
        }
        customClass="welcome-page"
      >
        <div
          className="background-image"
          style={{ backgroundImage: `url(${WelcomeBG})` }}
        />
        <div className="content">
          <h2>
            {i18n.t("tabs.identifiers.tab.welcome.welcometext", {
              name: currentAccount || "",
            })}
          </h2>
          <p>{i18n.t("tabs.identifiers.tab.welcome.text")}</p>
          <div className="icon">
            <img
              src={IdImage}
              alt="id"
            />
          </div>
        </div>
        <PageFooter
          pageId={pageId}
          primaryButtonText={`${i18n.t("tabs.identifiers.tab.welcome.add")}`}
          primaryButtonAction={onView}
          primaryButtonIcon={addOutline}
        />
      </ResponsivePageLayout>
      <CreateIdentifier
        modalIsOpen={openCreate}
        setModalIsOpen={setOpenCreate}
        onClose={handleCloseModal}
      />
    </>
  );
};

export { Welcome };
