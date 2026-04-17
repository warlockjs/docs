import type { ParsedName } from "../types";
import { Name } from "../utils/name-parser";

/**
 * Controller template stub
 */
export function controllerStub(
  name: ParsedName,
  options: { withValidation?: boolean } = {},
): string {
  const { withValidation } = options;

  return `import type { RequestHandler, Response } from "@warlock.js/core";
${
  withValidation
    ? `import { type ${name.pascal}Request } from "../requests/${name.kebab}.request";
import { ${name.camel}Schema } from "../schema/${name.kebab}.schema";`
    : ""
}

export const ${name.camel}Controller: RequestHandler = async (
  request${withValidation ? `: ${name.pascal}Request` : ""},
  response: Response,
) => {
  // TODO: Implement controller logic
  return response.success({});
};
${
  withValidation
    ? `
${name.camel}Controller.validation = {
  schema: ${name.camel}Schema,
};`
    : ""
}
`;
}

/**
 * CRUD Create Controller template
 * Note: moduleName is the module (plural), we need singular entity name
 */
export function crudCreateControllerStub(moduleName: Name): string {
  return `import { type RequestHandler } from "@warlock.js/core";
import { type Create${moduleName.pascal}Request } from "../requests/create-${moduleName.kebab}.request";
import { create${moduleName.pascal}Schema } from "../schema/create-${moduleName.kebab}.schema";
import { create${moduleName.pascal}Service } from "../services/create-${moduleName.kebab}.service";

export const create${moduleName.pascal}Controller: RequestHandler = async (
  request: Create${moduleName.pascal}Request,
  response,
) => {
  const ${moduleName.camel} = await create${moduleName.pascal}Service(request.validated());

  return response.success({
    ${moduleName.camel},
  });
};

create${moduleName.pascal}Controller.validation = {
  schema: create${moduleName.pascal}Schema,
};
`;
}

/**
 * CRUD Update Controller template
 */
export function crudUpdateControllerStub(moduleName: Name): string {
  return `import { type RequestHandler } from "@warlock.js/core";
import { type Update${moduleName.pascal}Request } from "../requests/update-${moduleName.kebab}.request";
import { update${moduleName.pascal}Schema } from "../schema/update-${moduleName.kebab}.schema";
import { update${moduleName.pascal}Service } from "../services/update-${moduleName.kebab}.service";

export const update${moduleName.pascal}Controller: RequestHandler = async (
  request: Update${moduleName.pascal}Request,
  response,
) => {
  const ${moduleName.camel} = await update${moduleName.pascal}Service(request.input("id"), request.validated());

  return response.success({
    ${moduleName.camel},
  });
};

update${moduleName.pascal}Controller.validation = {
  schema: update${moduleName.pascal}Schema,
};
`;
}

/**
 * CRUD List Controller template
 */
export function crudListControllerStub(moduleName: Name): string {
  const plural = moduleName.plural;
  return `import { type RequestHandler } from "@warlock.js/core";
import { list${plural.pascal}Service } from "../services/list-${plural.kebab}.service";

export const list${plural.pascal}Controller: RequestHandler = async (
  request,
  response,
) => {
  const { data, pagination } = await list${plural.pascal}Service(request.all());

  return response.success({
    data,
    pagination,
  });
};
`;
}

/**
 * CRUD Show/Get Controller template
 */
export function crudShowControllerStub(moduleName: Name): string {
  return `import { type RequestHandler } from "@warlock.js/core";
import { get${moduleName.pascal}Service } from "../services/get-${moduleName.kebab}.service";

export const get${moduleName.pascal}Controller: RequestHandler = async (
  request,
  response,
) => {
  const ${moduleName.camel} = await get${moduleName.pascal}Service(request.input("id"));

  if (!${moduleName.camel}) {
    return response.notFound();
  }

  return response.success({
    ${moduleName.camel},
  });
};
`;
}

/**
 * CRUD Delete Controller template
 */
export function crudDeleteControllerStub(moduleName: Name): string {
  return `import { type RequestHandler } from "@warlock.js/core";
import { delete${moduleName.pascal}Service } from "../services/delete-${moduleName.kebab}.service";

export const delete${moduleName.pascal}Controller: RequestHandler = async (
  request,
  response,
) => {
  await delete${moduleName.pascal}Service(request.input("id"));

  return response.success({
    message: "${moduleName.pascal} deleted successfully",
  });
};
`;
}

/**
 * CRUD Routes template
 */
export function crudRoutesStub(moduleName: Name): string {
  const singular = moduleName.singular;
  const plural = moduleName.plural;

  return `import { router } from "@warlock.js/core";
import { guarded } from "app/shared/utils/router";
import { create${singular.pascal}Controller } from "./controllers/create-${singular.kebab}.controller";
import { delete${singular.pascal}Controller } from "./controllers/delete-${singular.kebab}.controller";
import { get${singular.pascal}Controller } from "./controllers/get-${singular.kebab}.controller";
import { list${plural.pascal}Controller } from "./controllers/list-${plural.kebab}.controller";
import { update${singular.pascal}Controller } from "./controllers/update-${singular.kebab}.controller";

guarded(() => {
  router
    .route("/${plural.kebab}")
    .list(list${plural.pascal}Controller)
    .show(get${singular.pascal}Controller)
    .create(create${singular.pascal}Controller)
    .update(update${singular.pascal}Controller)
    .destroy(delete${singular.pascal}Controller);
});
`;
}

/**
 * CRUD Model template
 */
export function crudModelStub(moduleName: Name): string {
  const singular = moduleName.singular;
  const plural = moduleName.plural;

  return `import { Model, RegisterModel } from "@warlock.js/cascade";
import { type Infer, v } from "@warlock.js/core";
import { ${singular.pascal}Resource } from "app/${plural.kebab}/resources/${singular.kebab}.resource";

export const ${singular.camel}Schema = v.object({
  // TODO: Add more fields
});

export type ${singular.pascal}Schema = Infer<typeof ${singular.camel}Schema>;

@RegisterModel()
export class ${singular.pascal} extends Model<${singular.pascal}Schema> {
  public static table = "${plural.snake}";

  public static schema = ${singular.camel}Schema;

  public static relations = {};

  public static resource = ${singular.pascal}Resource;
}
`;
}

/**
 * CRUD Resource template
 */
export function crudResourceStub(moduleName: Name): string {
  // Get singular entity name
  const entity = moduleName.singular;

  return `import { defineResource } from "@warlock.js/core";

export const ${entity.pascal}Resource = defineResource({
  schema: {
    id: "number",
    // TODO: Add more resource fields
  },
});
`;
}

/**
 * CRUD Repository template
 */
export function crudRepositoryStub(entity: Name): string {
  const moduleSingularName = entity.singular;
  const modulePluralName = entity.plural;
  return `import type { FilterRules, RepositoryOptions } from "@warlock.js/core";
import { RepositoryManager } from "@warlock.js/core";
import { ${moduleSingularName.pascal} } from "../models/${moduleSingularName.kebab}";

type ${moduleSingularName.pascal}ListFilter = {
  // Repository list filters
};

export type ${moduleSingularName.pascal}ListOptions = RepositoryOptions & ${moduleSingularName.pascal}ListFilter;

class ${modulePluralName.pascal}Repository extends RepositoryManager<${moduleSingularName.pascal}, ${moduleSingularName.pascal}ListOptions> {
  public source = ${moduleSingularName.pascal};

  public simpleSelectColumns: string[] = ["id"];

  public filterBy: FilterRules = {
    id: "=",
  };

  public defaultOptions: RepositoryOptions = {
    orderBy: {
      id: "desc",
    },
  };
}

export const ${modulePluralName.camel}Repository = new ${modulePluralName.pascal}Repository();
`;
}

/**
 * CRUD Create Service template
 */
export function crudCreateServiceStub(entity: Name): string {
  const moduleSingularName = entity.singular;
  return `import { ${moduleSingularName.pascal} } from "../models/${moduleSingularName.kebab}";
import type { Create${moduleSingularName.pascal}Schema } from "../schema/create-${moduleSingularName.kebab}.schema";

export async function create${moduleSingularName.pascal}Service(data: Create${moduleSingularName.pascal}Schema) {
  const ${moduleSingularName.camel} = await ${moduleSingularName.pascal}.create(data);
  return ${moduleSingularName.camel};
}
`;
}

/**
 * CRUD Update Service template
 */
export function crudUpdateServiceStub(entity: Name): string {
  const moduleSingularName = entity.singular;
  return `import { ResourceNotFoundError } from "@warlock.js/core";
import { get${moduleSingularName.pascal}Service } from "./get-${moduleSingularName.kebab}.service";
import type { Update${moduleSingularName.pascal}Schema } from "../schema/update-${moduleSingularName.kebab}.schema";

export async function update${moduleSingularName.pascal}Service(id: number | string, data: Update${moduleSingularName.pascal}Schema) {
  const ${moduleSingularName.camel} = await get${moduleSingularName.pascal}Service(id);

  await ${moduleSingularName.camel}.save({ merge: data });
  return ${moduleSingularName.camel};
}
`;
}

/**
 * CRUD List Service template
 */
export function crudListServiceStub(entity: Name): string {
  const modulePluralName = entity.plural;
  return `import { ${modulePluralName.camel}Repository } from "../repositories/${modulePluralName.kebab}.repository";

export async function list${modulePluralName.pascal}Service(filters: any) {
  return ${modulePluralName.camel}Repository.listCached(filters);
}
`;
}

/**
 * CRUD Get Service template
 */
export function crudGetServiceStub(entity: Name): string {
  return `import { ${entity.plural.camel}Repository } from "../repositories/${entity.plural.kebab}.repository";
import { ResourceNotFoundError } from "@warlock.js/core";

export async function get${entity.singular.pascal}Service(id: number | string) {
  const ${entity.singular.camel} = await ${entity.plural.camel}Repository.getCached(id);

  if (!${entity.singular.camel}) {
    throw new ResourceNotFoundError("${entity.singular.pascal} resource not found!");
  }

  return ${entity.singular.camel};
}
`;
}

/**
 * CRUD Delete Service template
 */
export function crudDeleteServiceStub(entity: Name): string {
  const singular = entity.singular;
  return `import { ResourceNotFoundError } from "@warlock.js/core";
import { get${singular.pascal}Service } from "./get-${singular.kebab}.service";

export async function delete${singular.pascal}Service(id: number | string) {
  const ${singular.camel} = await get${singular.pascal}Service(id);
  if (!${singular.camel}) {
    throw new ResourceNotFoundError("${singular.pascal} not found");
  }
  await ${singular.camel}.destroy();
}
`;
}

/**
 * CRUD Seed template
 */
export function crudSeedStub(entity: Name): string {
  return `import { seeder } from "@warlock.js/core";
import { ${entity.singular.pascal} } from "../models/${entity.singular.kebab}";

export default seeder({
  name: "Seed ${entity.plural.pascal}",
  once: true,
  enabled: true,
  run: async () => {
    const total = 10;
    for (let i = 0; i < total; i++) {
      await ${entity.singular.pascal}.create({
        // TODO: Add more fields
      });
    }

    return {
      recordsCreated: total,
    };
  },
});
`;
}

/**
 * Migration template
 */
/**
 * Migration Create template
 */
export function migrationStub(
  entityName: ParsedName,
  options: {
    columns?: string;
    imports?: string[];
    timestamps?: boolean;
    tableName?: string;
  } = {},
): string {
  const { columns = "", imports = [], timestamps = true } = options;

  const allImports = ["Migration", ...imports].join(", ");

  let optionsString = "";
  if (timestamps === false) {
    optionsString = `, { timestamps: false }`;
  }

  return `import { ${allImports} } from "@warlock.js/cascade";
import { ${entityName.pascal} } from "../${entityName.kebab}.model";

export default Migration.create(${entityName.pascal}, {
${columns ? columns : "  // add your columns here, id is auto added to the list"}
}${optionsString});
`;
}

/**
 * Migration Alter template
 */
export function migrationAlterStub(
  entityName: ParsedName,
  options: {
    add?: string;
    drop?: string; // stringified array like `"[\"col1\", \"col2\"]"`
    rename?: string; // stringified object like `{ old: "new" }`
    imports?: string[];
  } = {},
): string {
  const { add = "", drop, rename, imports = [] } = options;
  const allImports = ["Migration", ...imports].join(", ");

  // Build the schema object dynamically
  const schemaParts: string[] = [];

  if (add) {
    schemaParts.push(`  add: {\n${add}\n  },`);
  }

  if (drop) {
    schemaParts.push(`  drop: ${drop},`);
  }

  if (rename) {
    schemaParts.push(`  rename: ${rename},`);
  }

  return `import { ${allImports} } from "@warlock.js/cascade";
import { ${entityName.pascal} } from "../${entityName.kebab}.model";

export default Migration.alter(${entityName.pascal}, {
${schemaParts.join("\n")}
});
`;
}

/**
 * CRUD Create Schema template
 * Outputs to: schema/create-{entity}.schema.ts
 */
export function crudCreateValidationStub(moduleName: Name): string {
  return `import { v, type Infer } from "@warlock.js/core";

export const create${moduleName.pascal}Schema = v.object({
  // TODO: Add validation rules
});

export type Create${moduleName.pascal}Schema = Infer<typeof create${moduleName.pascal}Schema>;
`;
}

/**
 * CRUD Update Schema template
 * Outputs to: schema/update-{entity}.schema.ts
 */
export function crudUpdateValidationStub(moduleName: Name): string {
  return `import { v, type Infer } from "@warlock.js/seal";

export const update${moduleName.pascal}Schema = v.object({
  name: v.string(),
  // TODO: Add validation rules
});

export type Update${moduleName.pascal}Schema = Infer<typeof update${moduleName.pascal}Schema>;
`;
}

/**
 * Service template stub
 */
export function serviceStub(name: Name): string {
  return `export async function ${name.camel}Service(data: any): Promise<any> {
  // TODO: Implement service logic
  throw new Error("${name.camel}Service not implemented");
}
`;
}

/**
 * Schema template stub
 * Outputs to: schema/{name}.schema.ts
 */
export function validationStub(name: Name): string {
  return `import { v, type Infer } from "@warlock.js/seal";

export const ${name.camel}Schema = v.object({
  // TODO: Define validation schema
});

export type ${name.pascal}Schema = Infer<typeof ${name.camel}Schema>;
`;
}

/**
 * Request type template stub
 */
export function requestStub(name: Name): string {
  return `import type { Request } from "@warlock.js/core";
import { type ${name.pascal}Schema } from "../schema/${name.kebab}.schema";

export type ${name.pascal}Request = Request<${name.pascal}Schema>;
`;
}

/**
 * Model template stub
 */
export function modelStub(
  name: Name,
  options: { tableName?: string; withResource?: boolean } = {},
): string {
  const { tableName = `${name.plural.snake}`, withResource } = options;

  return `import { Model } from "@warlock.js/core";
import type { StrictMode } from "@warlock.js/cascade";
import { v, type Infer } from "@warlock.js/core";
${withResource ? `import { ${name.singular.pascal}Resource } from "../../resources/${name.singular.kebab}.resource";` : ""}

const ${name.singular.camel}Schema = v.object({
  // TODO: Define model schema
});

export type ${name.singular.pascal}Type = Infer<typeof ${name.singular.camel}Schema>;

export class ${name.singular.pascal} extends Model<${name.singular.pascal}Type> {
  public static table = "${tableName}";
  public static strictMode: StrictMode = "fail";
${withResource ? `  public static resource = ${name.singular.pascal}Resource;` : ""}

  public static schema = ${name.singular.camel}Schema;

  public static relations = {
    // TODO: Define relations
  };
}
`;
}

/**
 * Repository template stub
 */
export function repositoryStub(name: Name): string {
  return `import type { FilterByOptions, RepositoryOptions } from "@warlock.js/core";
import { RepositoryManager } from "@warlock.js/core";
import { ${name.singular.pascal} } from "../models/${name.singular.kebab}";

type ${name.singular.pascal}ListFilter = {
  // Repository list filters
};

export type ${name.singular.pascal}ListOptions = RepositoryOptions & ${name.singular.pascal}ListFilter;

export class ${name.plural.pascal}Repository extends RepositoryManager<${name.singular.pascal}, ${name.singular.pascal}ListFilter> {
  public source = ${name.singular.pascal};

  protected defaultOptions: RepositoryOptions = this.withDefaultOptions({});

  protected filterBy: FilterByOptions = this.withDefaultFilters({
    name: "like",
  });
}

export const ${name.plural.camel}Repository = new ${name.plural.pascal}Repository();
`;
}

/**
 * Resource template stub
 */
export function resourceStub(name: Name): string {
  return `import { Resource } from "@warlock.js/core";

export class ${name.singular.pascal}Resource extends Resource {
  public schema = {
    id: "int",
    name: "string",
    // TODO: Define resource schema
  };
}
`;
}
