/**
 * Clear message from any terminal codes
 */
export function clearMessage(message: any) {
  if (typeof message !== "string") return message;

  // eslint-disable-next-line no-control-regex
  return message.replace(/\u001b[^m]*?m/g, "");
}
