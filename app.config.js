/**
 * Dynamic Expo config — keeps app.json as base and wires Google Sign-In for iOS.
 *
 * Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (OAuth client type "iOS" from Google Cloud).
 * Example: 751639603428-xxxxxxxx.apps.googleusercontent.com
 * → iosUrlScheme becomes: com.googleusercontent.apps.751639603428-xxxxxxxx
 */
const appJson = require("./app.json");

const iosClientId = (
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
  ""
).trim();

/** Reversed client ID required by Google Sign-In on iOS (URL scheme). */
function iosUrlSchemeFromClientId(clientId) {
  if (!clientId.endsWith(".apps.googleusercontent.com")) {
    return undefined;
  }
  const idPart = clientId.replace(/\.apps\.googleusercontent\.com$/, "");
  return `com.googleusercontent.apps.${idPart}`;
}

const iosUrlScheme = iosUrlSchemeFromClientId(iosClientId);

const plugins = (appJson.expo.plugins ?? []).map((plugin) => {
  const name = Array.isArray(plugin) ? plugin[0] : plugin;
  if (name !== "@react-native-google-signin/google-signin") {
    return plugin;
  }
  if (!iosUrlScheme) {
    return "@react-native-google-signin/google-signin";
  }
  return [
    "@react-native-google-signin/google-signin",
    {
      iosUrlScheme,
    },
  ];
});

module.exports = {
  expo: {
    ...appJson.expo,
    plugins,
    extra: {
      ...appJson.expo.extra,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
      googleIosClientId: iosClientId || undefined,
    },
  },
};
