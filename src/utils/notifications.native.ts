import i18n from "@/i18n";
import { isExpoGo } from "@/utils/runtime";

type NotificationsModule = typeof import("expo-notifications");

let cached: NotificationsModule | null | undefined;
let handlerReady = false;

function getNotifications(): NotificationsModule | null {
  if (isExpoGo()) {
    return null;
  }

  if (cached !== undefined) {
    return cached;
  }

  try {
    cached = require("expo-notifications") as NotificationsModule;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

function ensureHandler(Notifications: NotificationsModule) {
  if (handlerReady) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  handlerReady = true;
}

export const requestPermissions = async (): Promise<boolean> => {
  const Notifications = getNotifications();
  if (!Notifications) {
    return false;
  }

  ensureHandler(Notifications);
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
};

export const scheduleMealReminders = async () => {
  const Notifications = getNotifications();
  if (!Notifications) {
    return;
  }

  ensureHandler(Notifications);
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t("app.name"),
      body: i18n.t("notifications.lunchReminder"),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 12,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t("app.name"),
      body: i18n.t("notifications.dinnerReminder"),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 0,
    },
  });
};

export const cancelMealReminders = async () => {
  const Notifications = getNotifications();
  if (!Notifications) {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
};
