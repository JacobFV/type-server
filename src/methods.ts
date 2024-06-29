import type { Model } from "@tensaco/type-server/model";
import {
  isInstanceMethod,
  isStaticMethod,
} from "@tensaco/type-server/utils/typescript";
import { BodyProp, Query, Path } from "tsoa";
import { Arg, type ClassType } from "type-graphql";

export type ActionProps = {
  name?: string;
  path?: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
  keys?: string[]; // Only used for instance methods
};

export const ACTION_DECORATOR_KEY = "custom:tensaco-type-server-action";

export function Action(props: ActionProps): MethodDecorator {
  return function <T>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> | void {
    if (typeof propertyKey !== "string") {
      propertyKey = String(propertyKey);
    }

    const isStatic = isStaticMethod(target as ClassType<Model>, propertyKey);
    const isInstance = isInstanceMethod(target, propertyKey);

    if (!isStatic && !isInstance) {
      throw new Error(
        "The decorated method must be either static or instance method"
      );
    }

    const snakeCaseName = propertyKey
      .replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
      .replace(/^_/, "");

    const propsWithDefaults: ActionProps = {
      name: props.name || snakeCaseName,
      path: props.path || "/" + snakeCaseName,
      method: props.method,
      keys: props.keys || [],
    };

    Reflect.defineMetadata(
      ACTION_DECORATOR_KEY,
      propsWithDefaults,
      target,
      propertyKey
    );

    return descriptor;
  };
}

export type ParamOptions = {
  restFormat?: "body" | "query" | "path";
  name: string;
  required?: boolean;
  type: any;
};

export function Param(options: ParamOptions): ParameterDecorator {
  return (
    target: Object,
    propertyKey: string | symbol | undefined, // Allow undefined
    parameterIndex: number
  ) => {
    const { restFormat = "body", name, required = true, type } = options;

    if (!propertyKey) {
      throw new Error(
        "Property key is required. How did you even get this far? This is a bug."
      );
    }

    // Apply tsoa decorator
    switch (restFormat) {
      case "body":
        BodyProp()(target, propertyKey, parameterIndex);
        break;
      case "query":
        Query()(target, propertyKey, parameterIndex);
        break;
      case "path":
        Path()(target, propertyKey, parameterIndex);
        break;
      default:
        throw new Error(`Invalid restFormat: ${restFormat}`);
    }

    // Apply type-graphql decorator
    Arg(name, () => type, { nullable: !required })(
      target,
      propertyKey,
      parameterIndex
    );
  };
}
