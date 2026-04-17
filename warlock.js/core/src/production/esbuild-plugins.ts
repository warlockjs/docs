import type { OnLoadArgs, OnResolveArgs, PluginBuild } from "esbuild";

export const nativeNodeModulesPlugin = {
  name: "native-node-modules",
  setup(build: PluginBuild) {
    build.onResolve({ filter: /\.node$/, namespace: "file" }, (args: OnResolveArgs) => ({
      path: require.resolve(args.path, { paths: [args.resolveDir] }),
      namespace: "node-file",
    }));

    build.onLoad({ filter: /.*/, namespace: "node-file" }, (args: OnLoadArgs) => ({
      contents: `
          import path from ${JSON.stringify(args.path)}
          try { module.exports = require(path) }
          catch {}
        `,
    }));

    build.onResolve({ filter: /\.node$/, namespace: "node-file" }, (args: OnResolveArgs) => ({
      path: args.path,
      namespace: "file",
    }));

    const opts = build.initialOptions;
    opts.loader = opts.loader || {};
    opts.loader[".node"] = "file";
  },
};
