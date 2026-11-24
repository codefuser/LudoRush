import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ludorush.game',
  appName: 'Ludo Rush',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
