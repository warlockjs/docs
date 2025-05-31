type Diff<T> = {
  [K in keyof T]?: T[K] extends object
    ? Diff<T[K]>
    : { oldValue: T[K]; newValue: T[K] };
};

export function deepDiff<T>(obj1: T, obj2: T): Diff<T> {
  const diff: any = {};

  function compareValues(value1: any, value2: any): boolean {
    if (typeof value1 !== typeof value2) return false;
    if (typeof value1 === "object" && value1 !== null && value2 !== null) {
      return JSON.stringify(value1) === JSON.stringify(value2);
    }
    return value1 === value2;
  }

  function findDifferences(o1: any, o2: any, result: any): void {
    if (typeof o1 !== "object" || o1 === null) o1 = {};
    if (typeof o2 !== "object" || o2 === null) o2 = {};

    for (const key in o1) {
      if (Object.prototype.hasOwnProperty.call(o1, key)) {
        if (
          !Object.prototype.hasOwnProperty.call(o2, key) ||
          !compareValues(o1[key], o2[key])
        ) {
          if (typeof o1[key] === "object" && o1[key] !== null) {
            result[key] = deepDiff(o1[key], o2[key]);
          } else {
            result[key] = {
              oldValue: o1[key],
              newValue: o2[key],
            };
          }
        }
      }
    }

    for (const key in o2) {
      if (
        Object.prototype.hasOwnProperty.call(o2, key) &&
        !Object.prototype.hasOwnProperty.call(o1, key)
      ) {
        result[key] = {
          oldValue: undefined,
          newValue: o2[key],
        };
      }
    }
  }

  findDifferences(obj1, obj2, diff);
  return diff;
}
