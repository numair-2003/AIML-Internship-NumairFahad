import { useEffect } from 'react';
import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';
import { setTokenGetter } from '@/lib/api';

export default function HomeLayout() {
  const { isSignedIn, isLoaded, getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/sign-in" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
