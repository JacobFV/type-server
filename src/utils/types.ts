export type ValOrPred<T, Arguments extends any[]> =
  | T
  | ((...args: Arguments) => boolean);

export function convertToValue<T, Arguments extends any[]>(
  value: ValOrPred<T, Arguments>,
  ...args: Arguments
) {
  if (typeof value === "function") {
    const fn = value as (...args: Arguments) => boolean;
    return fn(...args);
  } else {
    return value;
  }
}

export function convertToPredicate<T, Arguments extends any[]>(
  value: ValOrPred<T, Arguments>
) {
  if (typeof value === "function") {
    return value;
  } else {
    return (...args: Arguments) => value;
  }
}

export type Constructor<
  T extends object,
  Args extends unknown[] = any[]
> = new (...args: Args) => T;
export type AbstractClassType<T> = Function & { prototype: T };
export type ClassType<
  T extends object = object,
  Args extends unknown[] = any[]
> = Constructor<T, Args> & AbstractClassType<T>;
