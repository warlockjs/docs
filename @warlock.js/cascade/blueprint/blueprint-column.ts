export type ColumnType =
  | "smallint"
  | "integer"
  | "bigint"
  | "decimal"
  | "numeric"
  | "real"
  | "double precision"
  | "smallserial"
  | "serial"
  | "bigserial"
  | "money"
  | "char"
  | "varchar"
  | "text"
  | "bytea"
  | "timestamp"
  | "timestamp without time zone"
  | "timestamp with time zone"
  | "date"
  | "time"
  | "time without time zone"
  | "time with time zone"
  | "interval"
  | "boolean"
  | "point"
  | "line"
  | "lseg"
  | "box"
  | "path"
  | "polygon"
  | "circle"
  | "cidr"
  | "inet"
  | "macaddr"
  | "macaddr8"
  | "tsvector"
  | "tsquery"
  | "uuid"
  | "xml"
  | "json"
  | "jsonb"
  | "array" // Specific array types would require more detail, like integer[], text[], etc.
  | "hstore"
  | "composite"
  | "range"
  | "domain"
  | "enum"; // Enum types would be specific to user-defined enums

export type BlueprintColumnAttributes = {
  type: ColumnType;
  indexes: {
    type: "primary" | "unique" | "index";
    name: string;
  }[];
  attributes: {
    [key: string]: any;
  }[];
  nullable?: boolean;
  autoIncrement?: boolean;
};

export class BlueprintColumn {
  /**
   * Column attributes
   */
  protected attributes: BlueprintColumnAttributes = {
    indexes: [],
    type: "text",
    attributes: [],
  };

  /**
   * Constructor
   */
  public constructor(
    public readonly name: string,
    public tableName: string,
  ) {
    //
  }

  /**
   * Set column as auto increment
   */
  public autoIncrement() {
    this.attributes.autoIncrement = true;

    return this;
  }

  /**
   * Set column as not null
   */
  public notNull() {
    this.attributes.nullable = false;

    return this;
  }

  /**
   * Set column as nullable
   */
  public nullable() {
    this.attributes.nullable = true;

    return this;
  }

  /**
   * Set column as primary
   */
  public primary(name?: string) {
    this.attributes.indexes.push({
      type: "primary",
      name: name || `${this.tableName}_${this.name}_primary`,
    });

    return this;
  }

  /**
   * Set column as unique
   */
  public unique(name?: string) {
    this.attributes.indexes.push({
      type: "unique",
      name: name || `${this.tableName}_${this.name}_unique`,
    });

    return this;
  }

  /**
   * Set column as index
   */
  public index(name?: string) {
    this.attributes.indexes.push({
      type: "index",
      name: name || `${this.tableName}_${this.name}_index`,
    });

    return this;
  }

  /**
   * Set column as spatial index
   */
  public spatialIndex(name?: string) {
    this.attributes.indexes.push({
      type: "index",
      name: name || `${this.tableName}_${this.name}_index`,
    });

    return this;
  }

  /**
   * Set column as big int
   */
  public bigInt() {
    this.attributes.type = "bigint";

    return this;
  }

  /**
   * Set a text column
   */
  public text(length = 255) {
    this.attributes.type = "char";

    if (length) {
      this.attributes.attributes.push({
        length,
      });
    }

    return this;
  }

  /**
   * Mark column as a long text
   */
  public longText() {
    this.attributes.type = "text";

    return this;
  }

  /**
   * Set column as boolean
   */
  public boolean() {
    this.attributes.type = "boolean";

    return this;
  }

  /**
   * Set column as enum
   */
  public enum(values: string[]) {
    this.attributes.type = "enum";

    this.attributes.attributes.push({
      values,
    });

    return this;
  }

  /**
   * Set column as json
   */
  public json() {
    this.attributes.type = "json";

    return this;
  }

  /**
   * Get column attributes
   */
  public getAttributes() {
    return this.attributes;
  }
}
