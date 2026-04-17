import type { ComponentType, ReactElement, ReactNode } from "react";

// ============================================================
// Eager-loaded React Modules
// ============================================================

/**
 * Installation instructions for React
 */
const REACT_INSTALL_INSTRUCTIONS = `
React SSR functionality requires React packages.
Install them with:

  warlock add react

Or manually:

  npm install react react-dom
  pnpm add react react-dom
  yarn add react react-dom
`.trim();

/**
 * Module availability flag
 */
let moduleExists: boolean | null = null;

/**
 * Cached React modules (loaded at import time)
 */
let react: typeof import("react");
let reactDomServer: typeof import("react-dom/server");

/**
 * Eagerly load React modules at import time
 */
async function loadReactModules() {
  try {
    react = await import("react");
    reactDomServer = await import("react-dom/server");
    moduleExists = true;
  } catch {
    moduleExists = false;
  }
}

// Kick off eager loading immediately
loadReactModules();

// ============================================================
// Render Function
// ============================================================

/**
 * Render a React element/component to HTML string
 *
 * **Important:** This function requires React packages to be installed.
 * Install them with: `warlock add react` or `yarn add react react-dom`
 *
 * @example
 * ```typescript
 * const html = renderReact(<WelcomeEmail name="John" />);
 * ```
 */
export function renderReact(reactElement: ReactElement | ComponentType | ReactNode): string {
  if (moduleExists === false) {
    throw new Error(`react is not installed.\n\n${REACT_INSTALL_INSTRUCTIONS}`);
  }

  if (typeof reactElement === "function") {
    reactElement = react.createElement(reactElement);
  }

  return reactDomServer.renderToString(reactElement);
}
