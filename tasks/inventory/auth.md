# @warlock.js/auth — Inventory

## Package Info

- Version: 4.0.165
- Type: Tightly Coupled Package
- Dependencies: @warlock.js/cascade, @warlock.js/core, @warlock.js/logger, @warlock.js/seal

## Directory Tree

```
src/
├── commands/
│   ├── auth-cleanup-command.ts
│   └── jwt-secret-generator-command.ts
├── contracts/
│   ├── auth-contract.ts
│   ├── index.ts
│   └── types.ts
├── index.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── index.ts
├── models/
│   ├── access-token/
│   │   ├── access-token.model.ts
│   │   ├── index.ts
│   │   └── migration.ts
│   ├── refresh-token/
│   │   ├── index.ts
│   │   ├── migration.ts
│   │   └── refresh-token.model.ts
│   ├── auth.model.ts
│   └── index.ts
├── services/
│   ├── auth-events.ts
│   ├── auth.service.ts
│   ├── generate-jwt-secret.ts
│   ├── index.ts
│   └── jwt.ts
└── utils/
    ├── auth-error-codes.ts
    ├── duration.ts
    └── index.ts
```

## JWT System

The JWT system handles token generation, verification, and rotation. It integrates with the environment configuration for secret management.

### src/services/jwt.ts
- **Constant** `jwt`: Object containing JWT utility methods.
- **Method** `jwt.generate(payload: any, options: SignerOptions & { key?: string }): Promise<string>`
- **Method** `jwt.verify<T = any>(token: string, options: VerifierOptions & { key?: string }): Promise<T>`
- **Method** `jwt.generateRefreshToken(payload: any, options: SignerOptions & { key?: string }): Promise<string>`
- **Method** `jwt.verifyRefreshToken<T = any>(token: string, options: VerifierOptions & { key?: string }): Promise<T>`
*Provides a high-level API for JWT operations using fast-jwt.*

### src/services/generate-jwt-secret.ts
- **Function** `generateJWTSecret(): Promise<void>`
*Generates and saves JWT keys to the .env file if they don't exist.*

### src/commands/jwt-secret-generator-command.ts
- **Function** `registerJWTSecretGeneratorCommand(): Command`
*Registers the 'jwt.generate' CLI command.*

### src/utils/duration.ts
- **Type** `Duration`: { milliseconds?, seconds?, minutes?, hours?, days?, weeks? }
- **Type** `ExpiresIn`: Duration | string | number | typeof NO_EXPIRATION
- **Function** `parseExpirationToMs(expiration: ExpiresIn | undefined, defaultMs?: number): number | undefined`
- **Function** `toJwtExpiresIn(expiration: ExpiresIn | undefined, defaultMs?: number): string | undefined`
*Utility for parsing human-readable durations into milliseconds or JWT-compatible strings.*

## Auth Guards & Route Protection

Guards are implemented as middleware that validate the request's authorization state and user type permissions.

### src/middleware/auth.middleware.ts
- **Function** `authMiddleware(allowedUserType?: string | string[]): Middleware`
*Middleware factory that authenticates requests and enforces user type restrictions.*

### src/contracts/auth-contract.ts
- **Interface** `Authenticable`: Core operations for auth-managed entities.
*Defines the contract for models that can be authenticated.*

### src/contracts/types.ts
- **Constant** `NO_EXPIRATION: symbol`
- **Type** `LogoutWithoutTokenBehavior`: "revoke-all" | "error"
- **Type** `AuthConfigurations`: Structure for auth configuration.
- **Type** `AccessTokenOutput`: { token: string, expiresAt: string }
- **Type** `TokenPair`: { accessToken, refreshToken? }
- **Type** `DeviceInfo`: Device and session tracking information.
- **Type** `LoginResult<UserType>`: { user, tokens }
*Contains all shared types and symbolic constants for the auth system.*

## Core Models & Services

### src/services/auth.service.ts
- **Class** `AuthService`: Main authentication logic controller.
- **Method** `authService.buildAccessTokenPayload(user: Auth): any`
- **Method** `authService.generateAccessToken(user: Auth, payload?: any): Promise<AccessTokenOutput>`
- **Method** `authService.createRefreshToken(user: Auth, deviceInfo?: DeviceInfo): Promise<RefreshToken>`
- **Method** `authService.createTokenPair(user: Auth, deviceInfo?: DeviceInfo): Promise<TokenPair>`
- **Method** `authService.refreshTokens(refreshTokenString: string, deviceInfo?: DeviceInfo): Promise<TokenPair | null>`
- **Method** `authService.verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>`
- **Method** `authService.hashPassword(password: string): Promise<string>`
- **Method** `authService.attemptLogin<T extends Auth>(Model: ChildModel<T>, data: any): Promise<T | null>`
- **Method** `authService.login<T extends Auth>(Model: ChildModel<T>, credentials: any, deviceInfo?: DeviceInfo): Promise<LoginResult<T> | null>`
- **Method** `authService.logout(user: Auth, accessToken?: string, refreshToken?: string): Promise<void>`
- **Method** `authService.removeAccessToken(user: Auth, token: string): Promise<void>`
- **Method** `authService.removeAllAccessTokens(user: Auth): Promise<void>`
- **Method** `authService.removeRefreshToken(user: Auth, token: string): Promise<void>`
- **Method** `authService.revokeAllTokens(user: Auth): Promise<void>`
- **Method** `authService.revokeTokenFamily(familyId: string): Promise<void>`
- **Method** `authService.cleanupExpiredTokens(): Promise<number>`
- **Method** `authService.getActiveSessions(user: Auth): Promise<RefreshToken[]>`
*Orchestrates the authentication flow and manages token lifecycles.*

### src/models/auth.model.ts
- **Class** `Auth<Schema>` extends `Model`: Abstract base model for authenticable users.
- **Abstract Property** `userType: string`
- **Method** `accessTokenPayload(): any`
- **Method** `createTokenPair(deviceInfo?: DeviceInfo): Promise<TokenPair>`
- **Method** `generateAccessToken(data?: any): Promise<AccessTokenOutput>`
- **Method** `generateRefreshToken(deviceInfo?: DeviceInfo): Promise<RefreshToken>`
- **Method** `removeAccessToken(token: string): Promise<void>`
- **Method** `removeRefreshToken(token: string): Promise<void>`
- **Method** `removeAllAccessTokens(): Promise<void>`
- **Method** `revokeAllTokens(): Promise<void>`
- **Method** `activeSessions(): Promise<RefreshToken[]>`
- **Static Method** `attempt(data: any): Promise<Auth | null>`
- **Method** `confirmPassword(password: string): Promise<boolean>`
*Base class providing authentication methods to user models.*

### src/models/access-token/access-token.model.ts
- **Class** `AccessToken` extends `Model`: Persistent storage for active access tokens.
- **Static Property** `table: string = "access_tokens"`
- **Static Property** `schema: Schema`
*Handles storage and validation of access token records.*

### src/models/refresh-token/refresh-token.model.ts
- **Class** `RefreshToken` extends `Model`: Persistent storage for refresh tokens with rotation support.
- **Static Property** `table: string = "refresh_tokens"`
- **Static Property** `schema: Schema`
- **Property** `isExpired: boolean`
- **Property** `isRevoked: boolean`
- **Property** `isValid: boolean`
- **Method** `revoke(): Promise<this>`
- **Method** `markAsUsed(): Promise<void>`
*Manages long-lived refresh tokens and security rotations.*

### src/services/auth-events.ts
- **Type** `AuthEventPayloads`: Registry of all auth event signatures.
- **Constant** `authEvents`: Typed event emitter for auth-related actions.
- **Method** `authEvents.on<T>(event: T, callback: Callback): Subscription`
- **Method** `authEvents.emit<T>(event: T, ...args: Args): void`
*Provides a type-safe event system for hooking into the authentication lifecycle.*

### src/utils/auth-error-codes.ts
- **Enum** `AuthErrorCodes`: Standardized error codes for authentication failures.
*Centralized registry for authentication-related error identifiers.*

### src/index.ts (barrel file)
- **Re-exports**: All members from `./contracts`, `./middleware`, `./models`, `./services`, `./utils`.
*Main entry point for the auth package.*
