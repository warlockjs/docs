export type ParsedColumn = {
  name: string;
  helper: string;      // e.g. "text", "boolCol", "decimal"
  modifiers: string[]; // e.g. [".nullable()", ".unsigned()"]
};

const typeMapping: Record<string, string> = {
  text: "text",
  string: "string",
  integer: "integer",
  int: "integer",
  bigInteger: "bigInteger",
  bigInt: "bigInteger",
  boolean: "boolCol",
  bool: "boolCol",
  uuid: "uuid",
  timestamp: "timestamp",
  date: "date",
  json: "json",
  object: "objectCol",
  decimal: "decimal",
  float: "float",
  enum: "enumCol",
  set: "setCol",
  blob: "blobCol",
  binary: "blobCol",
};

/**
 * Parses a subset DSL for column schemas:
 * "phone:text:nullable,price:decimal:notNullable:unsigned"
 */
export function parseColumnDsl(input: string): ParsedColumn[] {
  if (!input) return [];

  const columns = input.split(",").map((c) => c.trim()).filter(Boolean);
  
  return columns.map((colStr) => {
    const parts = colStr.split(":").map((p) => p.trim());
    const name = parts[0];
    const rawType = parts[1] || "string";
    const helper = typeMapping[rawType] || rawType; // fallback to raw string if not mapped

    const modifiers: string[] = [];
    for (let i = 2; i < parts.length; i++) {
      let modifier = parts[i];
      // Basic modifiers that translates to builder calls
      modifiers.push(`.${modifier}()`);
    }

    return {
      name,
      helper,
      modifiers,
    };
  });
}
