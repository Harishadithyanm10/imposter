import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './native.js';

// Light vibration feedback in the Android / iOS apps. Silently does nothing on the web.
export const tap = () => { if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); };
export const thump = () => { if (isNative) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}); };
export const success = () => { if (isNative) Haptics.notification({ type: NotificationType.Success }).catch(() => {}); };
export const warn = () => { if (isNative) Haptics.notification({ type: NotificationType.Warning }).catch(() => {}); };
