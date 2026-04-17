// Steps to manage the dev server
// 1. Start the dev2 server
// 2. Check .warlock/manifest.json file
// 2.1 If not exists, then build it from scratch
// 2.2 If exists, then load it into the files orchestrator
// 2.3 If exists, check if there are any changes in the project since last manifest build
// 2.4 If there are changes, then update the manifest file
// 3 Per file, grab its source code, parse its imports to define its dependencies and its dependents
// 3.1 Also transpile the file and save it in the file manager instance, and save a copy in .warlock/.cache folder
// 3.2 The manifest file should contain the absolute path to the file as key,its value contains the following:
// 3.2.1 path: string - relative path to the root directory
// 3.2.2 absolutePath: string - absolute path to the file
// 3.2.3 dependencies: string[] - array of  paths (relative to the root)
// 3.2.4 dependents: string[] - array of paths (relative to the root)
// 3.2.5 version: number - version of the file
// 3.2.6 hash: string - hash of the file content
// 3.2.7 lastModified: number - timestamp of the file last modified
// 3.2.8 layer: string - either FSR (Full Server Restart), hmr (Hot Module Replacement), If .env, events, main.ts or a config change triggers a FSR
// 3.2.9 cachePath: transpiled file path in .warlock/.cache folder
// 3.2.10 type: string - either main, config, event, route, controller, service, model, other
// 4 Build the dependency graph from the manifest file
// 5 Start project health checker that validates each file in the background while the dev server is running
// 5.1 Per file, health checker should validate it against Typescript and ESLint (In the future we will replace Eslint with new engine)
// 5.2 The project health checker is the container for all file health checkers as it give a general stats about the entire project
// 6 Start file watcher that watches for file changes in the project
// 6.1 Make sure to debounce the file changes to prevent multiple changes from being processed at the same time
// 6.2 When a file changes, the file watcher should notify the files orchestrator
// 6.3 The files orchestrator should then update the dependency graph and notify the layer executor to execute the appropriate layer
