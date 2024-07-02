/**
 * Represents a value or a predicate function that returns a boolean.
 *
 * @typeParam T - The type of the value.
 * @typeParam Arguments - The types of the arguments for the predicate function.
 * @example
 * let exampleValOrPred: ValOrPred<number, [number]> = (x) => x > 10;
 * let exampleValOrPred2: ValOrPred<string, []> = "Hello";
 */
export type ValOrPred<T, Arguments extends any[]> =
  | T
  | ((...args: Arguments) => boolean);

/**
 * Converts a ValOrPred type to its value by evaluating it if it's a function.
 *
 * @typeParam T - The expected return type.
 * @typeParam Arguments - The types of the arguments for the predicate function.
 * @param value - The value or predicate to convert.
 * @param args - Arguments to pass if the value is a predicate function.
 * @returns The value or the result of the predicate function.
 * @example
 * let result = convertToValue(exampleValOrPred, 15); // returns true
 * let result2 = convertToValue(exampleValOrPred2); // returns "Hello"
 */
export function convertToValue<T, Arguments extends any[]>(
  value: ValOrPred<T, Arguments>,
  ...args: Arguments
): T | boolean {
  if (typeof value === "function") {
    const fn = value as (...args: Arguments) => boolean;
    return fn(...args);
  } else {
    return value;
  }
}

/**
 * Converts a value to a predicate function.
 *
 * @typeParam T - The type of the value.
 * @typeParam Arguments - The types of the arguments for the predicate function.
 * @param value - The value to convert to a predicate.
 * @returns A predicate function that returns the value or the original predicate.
 * @example
 * let predicate = convertToPredicate(42);
 * let result = predicate(); // returns 42
 */
export function convertToPredicate<T, Arguments extends any[]>(
  value: ValOrPred<T, Arguments>
): (...args: Arguments) => T | boolean {
  if (typeof value === "function") {
    return value;
  } else {
    return (...args: Arguments) => value;
  }
}

/**
 * Type definition for a class constructor.
 *
 * @typeParam T - The type of the class instance.
 * @typeParam Args - The types of the constructor arguments.
 * @example
 * class ExampleClass {
 *   constructor(public id: number) {}
 * }
 * let ctor: Constructor<ExampleClass, [number]> = ExampleClass;
 */
export type Constructor<
  T extends object,
  Args extends unknown[] = any[]
> = new (...args: Args) => T;

/**
 * Type definition for an abstract class type.
 *
 * @typeParam T - The type of the class instance.
 * @example
 * abstract class ExampleAbstract {
 *   abstract getName(): string;
 * }
 * let abstractType: AbstractClassType<ExampleAbstract> = ExampleAbstract;
 */
export type AbstractClassType<T> = Function & {
  [key in keyof T]?: T[key];
};

/**
 * Type definition for a class type that includes both constructor and abstract class type.
 *
 * @typeParam T - The type of the class instance.
 * @typeParam Args - The types of the constructor arguments.
 * @example
 * class CompleteExample {
 *   constructor(public value: number) {}
 *   static greet() { return "Hello"; }
 * }
 * let classType: ClassType<CompleteExample, [number]> = CompleteExample;
 */
export type ClassType<
  T extends object = object,
  Args extends unknown[] = any[]
> = Constructor<T, Args> & AbstractClassType<T>;

/**
 * Type definition for a static method of a class.
 *
 * @typeParam T - The type of the class containing the static method.
 * @typeParam Args - The types of the arguments the method accepts.
 * @typeParam R - The return type of the method.
 * @example
 * class StaticMethodExample {
 *   static add(x: number, y: number): number { return x + y; }
 * }
 * let staticMethod: StaticMethod<StaticMethodExample, [number, number], number> = StaticMethodExample.add;
 */
export type StaticMethod<
  T extends typeof Object,
  Args extends unknown[] = any[],
  R = T
> = (this: T, ...args: Args) => R;

/**
 * Type definition for an instance method of a class.
 *
 * @typeParam T - The type of the class containing the instance method.
 * @typeParam Args - The types of the arguments the method accepts.
 * @typeParam R - The return type of the method.
 * @example
 * class InstanceMethodExample {
 *   multiply(x: number): number { return x * 2; }
 * }
 * let instanceMethod: InstanceMethod<InstanceMethodExample, [number], number> = new InstanceMethodExample().multiply;
 */
export type InstanceMethod<
  T extends object,
  Args extends unknown[] = any[],
  R = T
> = (this: T, ...args: Args) => R;

export class HTTPError extends Error {
  constructor(public status: number, public message: string) {
    super(message);
    this.name = "HTTPError";
    this.status = status;
  }
}

export const NOT_FOUND_ERROR_CODE = 404;
export const BAD_REQUEST_ERROR_CODE = 400;
export const UNAUTHORIZED_ERROR_CODE = 401;
export const FORBIDDEN_ERROR_CODE = 403;
export const INTERNAL_SERVER_ERROR_CODE = 500;

export class NotFoundError extends HTTPError {
  constructor(message: string = "Resource not found") {
    super(NOT_FOUND_ERROR_CODE, message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends HTTPError {
  constructor(message: string = "Bad request") {
    super(BAD_REQUEST_ERROR_CODE, message);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends HTTPError {
  constructor(message: string = "Unauthorized") {
    super(UNAUTHORIZED_ERROR_CODE, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends HTTPError {
  constructor(message: string = "Access is forbidden") {
    super(FORBIDDEN_ERROR_CODE, message);
    this.name = "ForbiddenError";
  }
}

export class InternalServerError extends HTTPError {
  constructor(message: string = "Internal server error") {
    super(INTERNAL_SERVER_ERROR_CODE, message);
    this.name = "InternalServerError";
  }
}
