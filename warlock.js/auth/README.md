# Warlock Auth

Auth System for Warlock.js

## Installation

`yarn create @warlock.js/auth`

Or

`npx create @warlock.js/auth`

Or

`pnpm create @warlock.js/auth`

## Generate JWT Secret

To generate JWT secret key, we need to add the following code to the `warlock.config.ts` file.

```ts
import { registerJWTSecretGeneratorCommand } from "@warlock.js/auth";
import { defineConfig } from "@warlock.js/core";

export default defineConfig({
  // Other configurations
  cli: {
    commands: [registerJWTSecretGeneratorCommand()],
  },
});
```

Then run the following command:

`warlock jwt.generate`

It will generate 