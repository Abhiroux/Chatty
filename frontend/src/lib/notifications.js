// Browser Notification API wrapper for Chatty

const PERMISSION_KEY = "chatty-notification-permission";

/**
 * Request browser notification permission
 * @returns {Promise<"granted"|"denied"|"default">}
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("Browser does not support notifications");
    return "denied";
  }

  if (Notification.permission === "granted") {
    localStorage.setItem(PERMISSION_KEY, "granted");
    return "granted";
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    localStorage.setItem(PERMISSION_KEY, permission);
    return permission;
  }

  return Notification.permission;
}

/**
 * Check if notifications are allowed
 */
export function isNotificationAllowed() {
  if (!("Notification" in window)) return false;
  return Notification.permission === "granted";
}

/**
 * Show a browser notification (only when tab is not focused)
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body text
 * @param {string} [options.icon] - Icon URL (defaults to app icon)
 * @param {Function} [options.onClick] - Callback when notification is clicked
 * @param {string} [options.tag] - Tag to group/replace notifications
 */
export function showNotification({ title, body, icon, onClick, tag }) {
  // Only show if tab is hidden (not focused)
  if (!document.hidden) return null;

  // Check if notifications are enabled in user settings
  try {
    const settings = JSON.parse(localStorage.getItem("chatty-sound-settings") || "{}");
    if (settings.browserNotifications === false) return null;
  } catch {
    // ignore
  }

  if (!isNotificationAllowed()) return null;

  try {
    const notification = new Notification(title, {
      body,
      icon: icon || "/avatar.png",
      badge: "/vite.svg",
      tag: tag || "chatty-notification",
      renotify: true,
      silent: true, // We handle sounds ourselves
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      if (onClick) onClick();
    };

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
  } catch {
    return null;
  }
}

/**
 * Show a message notification
 */
export function showMessageNotification(senderName, messageText, senderPic, onClick) {
  const body = messageText
    ? messageText.length > 50
      ? messageText.substring(0, 50) + "..."
      : messageText
    : "Sent an image";

  return showNotification({
    title: senderName,
    body,
    icon: senderPic || "/avatar.png",
    onClick,
    tag: `msg-${senderName}`,
  });
}

/**
 * Show a friend request notification
 */
export function showFriendRequestNotification(senderName, senderPic, onClick) {
  return showNotification({
    title: "New Friend Request",
    body: `${senderName} sent you a friend request`,
    icon: senderPic || "/avatar.png",
    onClick,
    tag: "friend-request",
  });
}

/**
 * Show a friend request accepted notification
 */
export function showFriendAcceptedNotification(userName, userPic, onClick) {
  return showNotification({
    title: "Friend Request Accepted",
    body: `${userName} accepted your friend request`,
    icon: userPic || "/avatar.png",
    onClick,
    tag: "friend-accepted",
  });
}
