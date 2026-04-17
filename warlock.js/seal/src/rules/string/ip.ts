import { isIP } from "net";
import { invalidRule, VALID_RULE } from "../../helpers";
import type { SchemaRule } from "../../types";

/**
 * IP rule - validates IP address (v4 or v6)
 */
export const ipRule: SchemaRule = {
  name: "ip",
  defaultErrorMessage: "The :input must be a valid IP address",
  async validate(value: any, context) {
    if (isIP(value)) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * IPv4 rule - validates IPv4 address
 */
export const ip4Rule: SchemaRule = {
  name: "ip4",
  defaultErrorMessage: "The :input must be a valid IPv4 address",
  async validate(value: any, context) {
    if (isIP(value) === 4) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};

/**
 * IPv6 rule - validates IPv6 address
 */
export const ip6Rule: SchemaRule = {
  name: "ip6",
  defaultErrorMessage: "The :input must be a valid IPv6 address",
  async validate(value: any, context) {
    if (isIP(value) === 6) {
      return VALID_RULE;
    }
    return invalidRule(this, context);
  },
};
