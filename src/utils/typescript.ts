import type { ClassType } from "@tensaco/type-server/utils/types";

export function isStaticMethod(type: ClassType<any>, methodName: string) {
  return methodName in type && typeof type[methodName] === "function";
}

export function isInstanceMethod(instance: any, methodName: string) {
  return (
    methodName in instance &&
    typeof instance[methodName] === "function" &&
    !isStaticMethod(instance.constructor, methodName)
  );
}
