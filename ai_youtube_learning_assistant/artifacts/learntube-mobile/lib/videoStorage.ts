import AsyncStorage from '@react-native-async-storage/async-storage';

/** Key is scoped per user so IDs never bleed across accounts on shared devices. */
function key(userId: string) {
  return `learntube_pending_ids:${userId}`;
}

export async function getVideoIds(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addVideoId(userId: string, id: string): Promise<void> {
  const ids = await getVideoIds(userId);
  if (!ids.includes(id)) {
    await AsyncStorage.setItem(key(userId), JSON.stringify([id, ...ids]));
  }
}

export async function removeVideoId(userId: string, id: string): Promise<void> {
  const ids = await getVideoIds(userId);
  await AsyncStorage.setItem(key(userId), JSON.stringify(ids.filter((v) => v !== id)));
}

/** Clear all pending IDs for a user (e.g. on sign-out). */
export async function clearVideoIds(userId: string): Promise<void> {
  await AsyncStorage.removeItem(key(userId));
}
