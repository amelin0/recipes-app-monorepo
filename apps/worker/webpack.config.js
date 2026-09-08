const path = require('path');

const nodeExternals = require('webpack-node-externals');

// The app's tsconfig `paths` resolve @dns imports to the packages' `src`
// directories, which sit outside this app. Under the plain tsc builder
// TypeScript then infers the monorepo root as rootDir and emits
// `dist/apps/client-api/src/main.js`, so `node dist/main` finds no entry point.
//
// Bundling instead: real node_modules stay external, workspace packages get
// compiled in, and the output is a flat `dist/main.js`.
module.exports = options => ({
    ...options,
    externals: [
        nodeExternals({
            allowlist: [/^@dns\//],
            modulesDir: path.resolve(__dirname, '../../node_modules'),
        }),
    ],
});
