import type { QueryBuilderContract } from "../../contracts";
import type { GlobalScopeOptions, LocalScopeCallback, ChildModel, Model } from "../model";

export function addGlobalModelScope(
  ModelClass: ChildModel<any>,
  name: string,
  callback: (query: QueryBuilderContract) => void,
  options: GlobalScopeOptions = {},
): void {
  ModelClass.globalScopes.set(name, {
    callback,
    timing: options.timing || "before",
  });
}

export function removeGlobalModelScope(ModelClass: ChildModel<any>, name: string): void {
  ModelClass.globalScopes.delete(name);
}

export function addLocalModelScope(
  ModelClass: ChildModel<any>,
  name: string,
  callback: LocalScopeCallback,
): void {
  ModelClass.localScopes.set(name, callback);
}

export function removeLocalModelScope(ModelClass: ChildModel<any>, name: string): void {
  ModelClass.localScopes.delete(name);
}
