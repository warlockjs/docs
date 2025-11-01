import {
  createElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToString } from "react-dom/server";

export function renderReact(
  reactElement: ReactElement | ComponentType | ReactNode,
) {
  if (typeof reactElement === "function") {
    reactElement = createElement(reactElement);
  }

  const output = renderToString(reactElement);

  return output;
}
