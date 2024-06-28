import type { ClassType } from "@tensaco/type-server/utils/types";

export function ConditionalClassDecorator(
  condition: boolean,
  decorator: ClassDecorator
): ClassDecorator {
  return function <TFunction extends Function>(
    target: TFunction
  ): TFunction | void {
    if (condition) {
      return decorator(target);
    }
  };
}

export function ConditionalPropertyDecorator(
  condition: boolean,
  decorator: PropertyDecorator
): PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol): void {
    if (condition) {
      decorator(target, propertyKey);
    }
  };
}

export function ConditionalMethodDecorator(
  condition: boolean,
  decorator: MethodDecorator
): MethodDecorator {
  return function <T>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> | void {
    if (condition) {
      return decorator(target, propertyKey, descriptor);
    }
  };
}

export function ConditionalParameterDecorator(
  condition: boolean,
  decorator: ParameterDecorator
): ParameterDecorator {
  return function (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ): void {
    if (condition) {
      decorator(target, propertyKey, parameterIndex);
    }
  };
}

export function DropMethod(condition: boolean): MethodDecorator {
  return function <T>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> | void {
    if (condition) {
      delete target.constructor.prototype[propertyKey];
      descriptor.value = undefined;
      return descriptor;
    }
  };
}

export function DefineMetadata(key: string, value: any) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata(key, value, target);
  };
}
