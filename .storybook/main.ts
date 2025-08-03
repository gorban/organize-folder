import type { StorybookConfig } from '@storybook/html-webpack5';

const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
  ],
  framework: {
    name: '@storybook/html-webpack5',
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: false,
  },
  babel: async (options) => {
    return {
      ...options,
      presets: [
        ...(options.presets || []),
        ['@babel/preset-typescript', { allowDeclareFields: true }],
      ],
    };
  },
  webpackFinal: async (config) => {
    // Ensure TypeScript files are processed
    config.resolve = config.resolve || {};
    config.resolve.extensions = [
      ...(config.resolve.extensions || []),
      '.ts',
      '.tsx'
    ];
    
    return config;
  },
};

export default config;