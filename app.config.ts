import { ExpoConfig, ConfigContext } from 'expo/config';
import buildData from './build-number.json';

const version = '1.0.0';
const buildNumber = String(buildData.build);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'n of m',
  slug: 'ios-shamir',
  version,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'shamir',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    buildNumber,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    versionCode: buildData.build,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    buildNumber: buildData.build,
  },
});
