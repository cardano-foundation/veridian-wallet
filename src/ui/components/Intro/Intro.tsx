import { IonIcon } from "@ionic/react";
import "@ionic/react/css/ionic-swiper.css";
import { pauseCircleOutline, playCircleOutline } from "ionicons/icons";
import Lottie from "lottie-react";
import { useState } from "react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperClass } from "swiper/types";
import { i18n } from "../../../i18n";
import introImg0 from "../../assets/images/intro-0.png";
import introImg1 from "../../assets/images/intro-1.png";
import introImg2 from "../../assets/images/intro-2.png";
import introImg3 from "../../assets/images/intro-3.png";
import "./Intro.scss";
import { SlideItem } from "./Intro.types";

const items: SlideItem[] = [
  {
    title: `${i18n.t("onboarding.slides.0.title")}`,
    description: `${i18n.t("onboarding.slides.0.description")}`,
    image: introImg0,
  },
  {
    title: `${i18n.t("onboarding.slides.1.title")}`,
    description: `${i18n.t("onboarding.slides.1.description")}`,
    image: introImg1,
  },
  {
    title: `${i18n.t("onboarding.slides.2.title")}`,
    description: `${i18n.t("onboarding.slides.2.description")}`,
    image: introImg2,
  },
  {
    title: `${i18n.t("onboarding.slides.3.title")}`,
    description: `${i18n.t("onboarding.slides.3.description")}`,
    image: introImg3,
  },
];

const Intro = () => {
  const [swiper, setSwiper] = useState<SwiperClass | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [autoplayIsClicked, setAutoplayIsClicked] = useState(false);

  const handleAutoplay = () => {
    if (autoplay) {
      swiper?.autoplay?.stop();
      setAutoplay(false);
    } else {
      swiper?.autoplay?.start();
      setAutoplay(true);
    }

    setAutoplayIsClicked(true);
    setTimeout(() => setAutoplayIsClicked(false), 300);
  };

  return (
    <div className="slides-container">
      <div className="slides">
        <Swiper
          className="swiper-container"
          onSwiper={(swiper: SwiperClass) => setSwiper(swiper)}
          onSlideChange={() =>
            swiper ? setActiveIndex(swiper.realIndex) : null
          }
          slidesPerView={1}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          loop={true}
          modules={[Autoplay]}
        >
          {items.map((slide, index) => (
            <SwiperSlide key={index}>
              {slide.lottie ? (
                <Lottie
                  className={activeIndex === index ? "text-fadein-down" : ""}
                  animationData={slide.lottie}
                  loop={false}
                />
              ) : (
                <img
                  src={slide.image}
                  alt={slide.title}
                  className={`image ${
                    activeIndex === index ? "text-fadein-down" : ""
                  }`}
                />
              )}
              {slide.title && (
                <h2 className={activeIndex === index ? "text-fadein" : ""}>
                  {slide.title}
                </h2>
              )}
              {slide.description && (
                <p className={activeIndex === index ? "text-fadein" : ""}>
                  {slide.description}
                </p>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      {items.length > 1 && (
        <div
          data-testid="slide-controls"
          className="pagination"
        >
          {items.map((_, index) => (
            <div
              key={index}
              className={
                activeIndex === index
                  ? "page-indicator-active"
                  : "page-indicator"
              }
            />
          ))}
          <div className="play-container">
            <IonIcon
              data-testid="play-indicator"
              className={`play-indicator ${autoplayIsClicked ? "clicked" : ""}`}
              icon={autoplay ? pauseCircleOutline : playCircleOutline}
              onClick={handleAutoplay}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export { Intro };
