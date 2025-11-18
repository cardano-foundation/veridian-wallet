import { IonButton, IonList } from "@ionic/react";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { KeriaNotification } from "../../../../core/agent/services/keriaNotificationService.types";
import { i18n } from "../../../../i18n";
import { NotificationItem } from "../NotificationItem";
import {
  NotificationSectionProps,
  NotificationSectionRef,
} from "./NotificationSection.types";

const DEFAULT_INITIAL_DISPLAY = 3;
const DEFAULT_LOAD_MORE = 5;

const NotificationSection = forwardRef<
  NotificationSectionRef,
  NotificationSectionProps
>(
  (
    {
      title,
      data,
      pageId,
      onNotificationClick,
      enableInfiniteScroll = false,
      initialDisplayCount = DEFAULT_INITIAL_DISPLAY,
      loadMoreCount = DEFAULT_LOAD_MORE,
      testId,
    },
    ref
  ) => {
    const [displayLength, setDisplayLength] = useState(initialDisplayCount);

    const displayNotifications =
      enableInfiniteScroll && displayLength >= data.length
        ? data
        : data.slice(0, displayLength);

    const shouldDisplayExpandButton =
      enableInfiniteScroll &&
      data.length > displayLength &&
      displayLength === initialDisplayCount;

    useImperativeHandle(ref, () => ({
      reset: () => {
        setDisplayLength(initialDisplayCount);
      },
    }));

    const loadMore = useCallback(() => {
      setDisplayLength((value) => value + loadMoreCount);
    }, [loadMoreCount]);

    if (!data.length) return null;

    const content = (
      <IonList
        lines="none"
        data-testid="notifications-items"
      >
        {displayNotifications.map((item: KeriaNotification) => (
          <NotificationItem
            key={item.id}
            item={item}
            onClick={onNotificationClick}
          />
        ))}
      </IonList>
    );

    return (
      <div
        className="notifications-tab-section"
        data-testid={testId}
      >
        <h3 className="notifications-tab-section-title">{title}</h3>
        {enableInfiniteScroll ? (
          <>
            <InfiniteScroll
              dataLength={displayNotifications.length}
              next={loadMore}
              loader={<div></div>}
              hasMore={
                data.length >= displayLength && !shouldDisplayExpandButton
              }
              scrollableTarget={pageId}
            >
              {content}
            </InfiniteScroll>
            {shouldDisplayExpandButton && (
              <IonButton
                onClick={loadMore}
                fill="outline"
                className="show-ealier-btn secondary-button"
                data-testid="show-earlier-btn"
              >
                {i18n.t(
                  "tabs.notifications.tab.sections.earlier.buttons.showealier"
                )}
              </IonButton>
            )}
          </>
        ) : (
          content
        )}
      </div>
    );
  }
);

export { NotificationSection };
