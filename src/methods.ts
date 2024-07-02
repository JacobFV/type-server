import { typeGQL, typeREST } from "@tensaco/type-server/deps";
import type { Model } from "@tensaco/type-server/model";
import type { StaticMethod } from "@tensaco/type-server/utils/types";
import {
  isInstanceMethod,
  isStaticMethod,
} from "@tensaco/type-server/utils/typescript";
import assert from "assert";
import { Arg, type ClassType, type SubscriptionOptions } from "type-graphql";
import type { BaseEntity, FindOptionsWhere } from "typeorm";

type typeRESTActionInputProps = {
  path?: string | undefined;
  restVerb?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
  typeRESTOptions?: { [key: string]: any };
  staticName?: string;
  autogenTypeRest?: boolean;
  BodyOptions?: { [key: string]: any };
  QueryOptions?: { [key: string]: any };
  PathOptions?: { [key: string]: any };
};

const DEFAULT_TYPE_REST_ACTION_PROPS: typeRESTActionInputProps = {
  path: undefined,
  restVerb: undefined,
  typeRESTOptions: {},
  staticName: undefined,
  autogenTypeRest: true,
  BodyOptions: {},
  QueryOptions: {},
  PathOptions: {},
};

type typeRESTActionProps = Required<typeRESTActionInputProps>;

type typeGQLActionInputProps = {
  gqlMethod?: "query" | "mutation" | "subscription";
  staticName?: string;
  typeGQLQueryOptions?: AdvancedOptions | undefined;
  typeGQLMutationOptions?: AdvancedOptions | undefined;
  typeGQLSubscriptionOptions?: SubscriptionOptions | undefined;
  autogenTypeGQL?: boolean;
};

const DEFAULT_TYPE_GQL_ACTION_PROPS: typeGQLActionInputProps = {
  gqlMethod: "query",
  staticName: undefined,
  typeGQLQueryOptions: {},
  typeGQLMutationOptions: {},
  typeGQLSubscriptionOptions: undefined,
  autogenTypeGQL: true,
};

type typeGQLActionProps = Required<typeGQLActionInputProps>;

export type ActionInputProps = typeRESTActionInputProps &
  typeGQLActionInputProps;
export type ActionProps = typeRESTActionProps & typeGQLActionProps;

const DEFAULT_ACTION_PROPS: ActionInputProps = {
  ...DEFAULT_TYPE_GQL_ACTION_PROPS,
  ...DEFAULT_TYPE_REST_ACTION_PROPS,
};

export const ACTION_PARAM_DECORATOR_KEY =
  "custom:tensaco-type-server-action-param";

export function StaticTypeRESTAction(
  props: typeRESTActionInputProps
): MethodDecorator {
  return function <T>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    target = target as ClassType<any>;
    switch (props.restVerb) {
      case "GET":
        typeREST.GET(target, propertyKey as string);
        break;
      case "POST":
        typeREST.POST(target, propertyKey as string);
        if (props.BodyOptions) {
          typeREST.BodyOptions(props.BodyOptions)(
            target,
            propertyKey as string
          );
        }
        break;
      case "PUT":
        typeREST.PUT(target, propertyKey as string);
        if (props.BodyOptions) {
          typeREST.BodyOptions(props.BodyOptions)(
            target,
            propertyKey as string
          );
        }
        break;
      case "DELETE":
        typeREST.DELETE(target, propertyKey as string);
        if (props.BodyOptions) {
          typeREST.BodyOptions(props.BodyOptions)(
            target,
            propertyKey as string
          );
        }
        break;
      case "PATCH":
        typeREST.PATCH(target, propertyKey as string);
        if (props.BodyOptions) {
          typeREST.BodyOptions(props.BodyOptions)(
            target,
            propertyKey as string
          );
        }
        break;
      case "OPTIONS":
        typeREST.OPTIONS(target, propertyKey as string);
        break;
      case "HEAD":
        typeREST.HEAD(target, propertyKey as string);
        break;
      default:
        throw new Error(`Invalid restVerb: ${props.restVerb}`);
    }
    if (props.path) {
      typeREST.Path(props.path)(target, propertyKey, 0);
    }
  };
}

export function StaticTypeGQLAction(
  props: typeGQLActionInputProps
): MethodDecorator {
  return function <T>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    target = target as ClassType<any>;
    const returnType = Reflect.getMetadata(
      "design:returntype",
      target,
      propertyKey
    );

    switch (props.gqlMethod) {
      case "query":
        typeGQL.Query((type) => returnType, props.typeGQLQueryOptions || {})(
          target,
          propertyKey,
          descriptor
        );
        break;
      case "mutation":
        typeGQL.Mutation(
          (type) => returnType,
          props.typeGQLMutationOptions || {}
        )(target, propertyKey, descriptor);
        break;
      case "subscription":
        if (!props.typeGQLSubscriptionOptions)
          throw new Error("typeGQLSubscriptionOptions is required");

        typeGQL.Subscription(
          (type) => returnType,
          props.typeGQLSubscriptionOptions
        )(target, propertyKey, descriptor);
        break;
      default:
        throw new Error(`Invalid gqlMethod: ${props.gqlMethod}`);
    }
  };
}
export function InstanceTypeRESTAction<T>(
  props: typeRESTActionInputProps & {
    findById: (id: number) => Promise<T>;
  }
): MethodDecorator {
  return function <
    TInstanceMethod extends (...args: TInstanceMethodArgs) => Promise<T>,
    TInstanceMethodArgs extends any[]
  >(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<TInstanceMethod>
  ) {
    target = target as ClassType<any>;
    const instanceMethod: TInstanceMethod | undefined = descriptor.value;
    if (!instanceMethod) throw new Error("Instance method is undefined");

    const staticMethod = async (id: number, ...args: TInstanceMethodArgs) => {
      const instance = props.findById(id);
      return instanceMethod.apply(instance, args);
    };

    const staticName = props.staticName || (propertyKey as string);
    (target as any)[staticName] = staticMethod;

    const methodMetadataKeys = Reflect.getMetadataKeys(instanceMethod);
    for (const key of methodMetadataKeys) {
      const metadataValue = Reflect.getMetadata(key, instanceMethod);
      Reflect.defineMetadata(key, metadataValue, staticMethod);
    }

    StaticTypeRESTAction({
      ...props,
      staticName,
    })(target, staticName, descriptor);

    return descriptor;
  };
}

export function InstanceTypeGQLAction<T>(
  props: typeGQLActionInputProps & {
    findById: (id: number) => Promise<T>;
  }
): MethodDecorator {
  return function <
    TInstanceMethod extends (...args: TInstanceMethodArgs) => Promise<T>,
    TInstanceMethodArgs extends any[]
  >(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<TInstanceMethod>
  ) {
    target = target as ClassType<any>;
    const instanceMethod: TInstanceMethod | undefined = descriptor.value;
    if (!instanceMethod) throw new Error("Instance method is undefined");

    const staticMethod = async (id: number, ...args: TInstanceMethodArgs) => {
      const instance = props.findById(id);
      return instanceMethod.apply(instance, args);
    };

    const staticName = props.staticName || (propertyKey as string);
    (target as any)[staticName] = staticMethod;

    const methodMetadataKeys = Reflect.getMetadataKeys(instanceMethod);
    for (const key of methodMetadataKeys) {
      const metadataValue = Reflect.getMetadata(key, instanceMethod);
      Reflect.defineMetadata(key, metadataValue, staticMethod);
    }

    StaticTypeGQLAction({
      ...props,
      staticName: staticName,
    })(target, staticName, descriptor);

    return descriptor;
  };
}

export function Action(props: ActionInputProps): MethodDecorator {
  return function <T>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> | void {
    if (typeof propertyKey !== "string") {
      propertyKey = String(propertyKey);
    }

    const snakeCaseName = propertyKey
      .replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
      .replace(/^_/, "");

    props = {
      ...DEFAULT_ACTION_PROPS,
      path: "/" + snakeCaseName,
      staticName: `${snakeCaseName}Static`,
      ...props,
      ...(props.typeRESTOptions ? { autogenTypeRest: true } : {}),
      ...(props.typeGQLQueryOptions ? { autogenTypeGQL: true } : {}),
      ...(props.typeGQLMutationOptions ? { autogenTypeGQL: true } : {}),
      ...(props.typeGQLSubscriptionOptions ? { autogenTypeGQL: true } : {}),
    };

    Reflect.defineMetadata(
      ACTION_PARAM_DECORATOR_KEY,
      props,
      target,
      propertyKey
    );

    if (isInstanceMethod(target, propertyKey as string)) {
      const instanceProps = {
        ...props,
        findById: (id: number) => {
          return (target as typeof BaseEntity).findBy({
            id,
          } as FindOptionsWhere<typeof target>);
        },
      };
      if (props.autogenTypeGQL) {
        InstanceTypeGQLAction(instanceProps)(target, propertyKey, descriptor);
      }
      if (props.autogenTypeRest) {
        InstanceTypeRESTAction(instanceProps)(target, propertyKey, descriptor);
      }
    } else if (
      isStaticMethod(target as ClassType<any>, propertyKey as string)
    ) {
      if (props.autogenTypeGQL) {
        StaticTypeGQLAction(props)(target, propertyKey, descriptor);
      }
      if (props.autogenTypeRest) {
        StaticTypeRESTAction(props)(target, propertyKey, descriptor);
      }
    } else {
      throw new Error("Method is not a static or instance method");
    }

    return descriptor;
  };
}

export type ParamOptions = {
  restFormat?: "body" | "query" | "path";
  name: string;
  required?: boolean;
};

const REQUEST_PARAM_DECORATOR_KEY = "custom:tensaco-type-server-request-param";

export function Request() {
  return (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");

    Reflect.defineMetadata(
      REQUEST_PARAM_DECORATOR_KEY,
      parameterIndex,
      target,
      propertyKey
    );
  };
}

export function Param(options: ParamOptions): ParameterDecorator {
  return (
    target: Object,
    propertyKey: string | symbol | undefined, // Allow undefined
    parameterIndex: number
  ) => {
    const { restFormat: restFormat = "body", name, required = true } = options;

    if (!propertyKey) {
      throw new Error(
        "Property key is required. How did you even get this far? This is a bug."
      );
    }

    // Apply tsoa decorator
    switch (restFormat) {
      case "body":
        typeREST.BodyProp(name)(target, propertyKey, parameterIndex);
        break;
      case "query":
        typeREST.Query(name)(target, propertyKey, parameterIndex);
        break;
      case "path":
        typeREST.Path(name)(target, propertyKey, parameterIndex);
        break;
      default:
        throw new Error(`Invalid restFormat: ${restFormat}`);
    }

    // Apply type-graphql decorator
    Arg(name, { nullable: !required })(target, propertyKey, parameterIndex);
  };
}

export const CONTEXT_PARAM_DECORATOR_KEY =
  "custom:tensaco-type-server-context-param";

export function Context() {
  return (
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    if (!propertyKey) {
      throw new Error(
        "Property key is required. How did you even get this far? This is a bug."
      );
    }
    typeGQL.Ctx(propertyKey as string)(target, propertyKey, parameterIndex);
    typeREST.Context(target, propertyKey, parameterIndex);

    Reflect.defineMetadata(
      CONTEXT_PARAM_DECORATOR_KEY,
      parameterIndex,
      target,
      propertyKey
    );
  };
}
