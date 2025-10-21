const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Add Node.js polyfills for browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
        'fs': false,
        'fs/promises': false,
        'node:fs/promises': false,
        'node:crypto': false,
        'crypto': require.resolve('crypto-browserify'),
        'stream': require.resolve('stream-browserify'),
        'buffer': require.resolve('buffer'),
        'util': require.resolve('util'),
        'path': require.resolve('path-browserify'),
        'url': require.resolve('url'),
        'querystring': require.resolve('querystring-es3'),
        'https': require.resolve('https-browserify'),
        'http': require.resolve('stream-http'),
        'os': require.resolve('os-browserify/browser'),
        'assert': require.resolve('assert'),
        'constants': require.resolve('constants-browserify'),
        'vm': require.resolve('vm-browserify'),
        'zlib': require.resolve('browserify-zlib'),
        'tty': false,
        'net': false,
        'child_process': false,
      };

      // Add global polyfills
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }
    
    return config;
  },
};

module.exports = nextConfig;
