module.exports = {
    presets: [
        'module:@react-native/babel-preset',
        '@babel/preset-typescript',
        [
            '@babel/preset-react',
            {
                runtime: 'automatic',
            },
        ],
    ],
    env: {
        production: {
            plugins: ['react-native-paper/babel'],
        },
    },
    plugins: [
        '@babel/plugin-transform-export-namespace-from',
        [
            'module:react-native-dotenv',
            {
                moduleName: '@env', // The module to use for importing environment variables
                path: '.env', // Path to your .env file
                // safe: false, // Optional: Set to true if you want to enforce required variables
                allowUndefined: true, // Allow undefined variables (set to false if strict enforcement is needed)
            },
        ],
        'react-native-reanimated/plugin', // MUST BE LAST
    ],
};