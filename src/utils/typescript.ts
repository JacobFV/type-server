import "reflect-metadata";
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

export function isEnum(value: any): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every(
      (v) => typeof v === "string" || typeof v === "number"
    )
  );
}
