import React from 'react';
import {IonGrid, IonPage, IonRow, IonText} from '@ionic/react';
import CustomPage from '../../../main/CustomPage';
import './Credentials.css';
import CREDENTIALS_RESPONSE from '../../../test/mock/credentials.json';
import {Swiper, SwiperSlide} from 'swiper/react';
import {IDWCard} from '../../UI/IDWCard';

const Credentials = (props: any) => {
  const pageName = 'My Credentials';

  return (
    <IonPage id={pageName}>
      <CustomPage
        name={pageName}
        sideMenu={false}
        sideMenuPosition="start">
        <IonGrid>
          {Object.keys(CREDENTIALS_RESPONSE)?.map((key) => {
            return (
              <IonRow
                key={key}
                className="ion-margin">
                <IonText color="dark">
                  <p className="title font-extrabold">{key}</p>
                </IonText>
                <Swiper
                  spaceBetween={10}
                  slidesPerView={
                    CREDENTIALS_RESPONSE[key] &&
                    CREDENTIALS_RESPONSE[key].length > 1
                      ? 1.2
                      : 1
                  }
                  loop={true}
                  onSlideChange={() => {}}
                  onSwiper={(swiper) => {}}>
                  {CREDENTIALS_RESPONSE[key] &&
                    CREDENTIALS_RESPONSE[key].map((cred) => {
                      return (
                        <SwiperSlide key={cred.id}>
                          <IDWCard
                            type="CREDENTIAL"
                            id={cred.id}
                            qr={cred.id}
                            name={cred.name}
                            createdOn={cred.createDate}
                            logo={cred.imageUrl}
                            data={cred}
                          />
                        </SwiperSlide>
                      );
                    })}
                </Swiper>
              </IonRow>
            );
          })}
        </IonGrid>
      </CustomPage>
    </IonPage>
  );
};

export default Credentials;
