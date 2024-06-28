import { ClassType } from "@tensaco/type-server/utils/types";

export function isStaticMethod<T extends ClassType<any>>(
  type: ClassType<T>,
  methodName: string
) {
  return methodName in type && typeof type[methodName] === "function";
}

export function isInstanceMethod<T extends object>(
  instance: T,
  methodName: string
) {
  return (
    methodName in instance &&
    typeof instance[methodName] === "function" &&
    !(methodName in instance.prototype) // otherwise it'd be a static method
  );
}
