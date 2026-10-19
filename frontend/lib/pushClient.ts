function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushPermissionState = "unsupported" | "default" | "granted" | "denied";

export type PushStatusState =
  | "checking"
  | "enabled"
  | "disabled"
  | "denied"
  | "setup_required"
  | "error";

export function getPushPermissionState(): PushPermissionState {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  return Notification.permission as PushPermissionState;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error("Service worker registration failed:", err);
    return null;
  }
}

export async function checkCurrentSubscription(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }
  try {
    await registerServiceWorker();
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.error("Failed to check push subscription:", err);
    return null;
  }
}

export async function getDetailedPushStatus(walletAddress?: string): Promise<{
  status: PushStatusState;
  errorMessage?: string;
}> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { status: "setup_required", errorMessage: "Push notifications are not supported in this browser." };
  }

  // 1. Check browser permission
  const perm = Notification.permission;
  if (perm === "denied") {
    return { status: "denied", errorMessage: "Notification permission was blocked in your browser settings." };
  }

  // 2. Check VAPID server configuration
  try {
    const vapidRes = await fetch("/api/notifications/vapid-key");
    const { publicKey } = await vapidRes.json();
    if (!publicKey) {
      return { status: "setup_required", errorMessage: "VAPID keys not configured on server." };
    }
  } catch {
    return { status: "setup_required", errorMessage: "Unable to connect to notification server." };
  }

  if (perm === "default") {
    return { status: "disabled" };
  }

  // 3. Permission is granted — check if active subscription exists in browser
  try {
    const sub = await checkCurrentSubscription();
    if (!sub) {
      return { status: "disabled" };
    }

    // If walletAddress is provided, verify and sync with server
    if (walletAddress) {
      const serverCheck = await fetch(`/api/notifications/subscribe?address=${walletAddress.toLowerCase()}`);
      if (serverCheck.ok) {
        const data = await serverCheck.json();
        // If server doesn't have it saved yet, silently sync it
        if (!data.hasServerSubscription) {
          await fetch("/api/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: walletAddress,
              subscription: sub.toJSON(),
            }),
          });
        }
      }
    }

    return { status: "enabled" };
  } catch (err: any) {
    return { status: "error", errorMessage: err.message || "Failed to inspect push subscription." };
  }
}

export async function subscribeToPush(walletAddress: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { success: false, error: "Push notifications are not supported by your browser." };
  }

  try {
    // 1. Request permission if not already granted
    let permission = Notification.permission;
    if (permission !== "granted") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      return { success: false, error: "Notification permission was denied or dismissed." };
    }

    // 2. Ensure service worker is registered and ready
    await registerServiceWorker();
    const reg = await navigator.serviceWorker.ready;

    // 3. Fetch public VAPID key
    const vapidRes = await fetch("/api/notifications/vapid-key");
    const { publicKey } = await vapidRes.json();

    if (!publicKey) {
      return { success: false, error: "VAPID public key not configured on server." };
    }

    // 4. Subscribe or reuse existing subscription
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // 5. Persist subscription on server for authenticated wallet
    const res = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: walletAddress,
        subscription: subscription.toJSON(),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || "Failed to save push subscription on server." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to subscribe to push notifications:", err);
    return { success: false, error: err.message || "An unexpected error occurred during subscription." };
  }
}

export async function unsubscribeFromPush(walletAddress: string): Promise<{ success: boolean }> {
  try {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
      }
    }

    await fetch("/api/notifications/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: walletAddress }),
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}
