module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            ['react-native-unistyles/plugin', { root: 'src' }],
            // Keep last — reanimated's plugin must run after all others.
            'react-native-reanimated/plugin',
        ],
    };
};
