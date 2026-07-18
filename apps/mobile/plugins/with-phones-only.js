const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Телефони-only: Android не має аналога `supportsTablet: false`, тому
 * додаємо <supports-screens> у AndroidManifest — планшети (large/xlarge)
 * не підтримуються, Play Store не показує застосунок на планшетах.
 */
module.exports = function withPhonesOnly(config) {
    return withAndroidManifest(config, mod => {
        mod.modResults.manifest['supports-screens'] = [
            {
                $: {
                    'android:smallScreens': 'true',
                    'android:normalScreens': 'true',
                    'android:largeScreens': 'false',
                    'android:xlargeScreens': 'false',
                },
            },
        ];
        return mod;
    });
};
