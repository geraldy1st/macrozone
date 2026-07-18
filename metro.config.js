const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : config.resolver.blockList
      ? [config.resolver.blockList]
      : []),
  /\.env\.vercel\.local$/,
];

// `ws` is Node-only; keep it available for Expo web SSR (Node 20) without
// breaking the browser bundle when native WebSocket is already present.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  ws: require.resolve("ws"),
};

module.exports = config;