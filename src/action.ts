import { typeGQL, typeREST } from "@tensaco/type-server/deps";
import type { Model } from "@tensaco/type-server/model";
import type { StaticMethod } from "@tensaco/type-server/utils/types";
import {
  isEnum,
  isInstanceMethod,
  isStaticMethod,
} from "@tensaco/type-server/utils/typescript";
import assert from "assert";
import {
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  type GraphQLCompositeType,
} from "graphql/type";
import { Arg, type ClassType, type SubscriptionOptions } from "type-graphql";
import type { BaseEntity, FindOptionsWhere } from "typeorm";
import { GraphQLUpload, FileUpload } from "graphql-upload";
import { createParameterDecorator } from "type-graphql";
import type ServiceContext from "@tensaco/type-server/context";

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
    if (props.path) {
      typeREST.Path(props.path)(target, propertyKey, 0);
    }
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

// Helper function to handle common logic
function createStaticMethod<
  TEntity extends BaseEntity,
  TInstanceMethod extends (...args: any[]) => Promise<any>
>(
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<TInstanceMethod>,
  props: { staticName?: string }
): { staticMethod: Function; staticName: string } {
  target = target as typeof BaseEntity;
  const instanceMethod: TInstanceMethod | undefined = descriptor.value;
  if (!instanceMethod) throw new Error("Instance method is undefined");

  const staticMethod = async (
    id: number,
    ...args: Parameters<TInstanceMethod>
  ) => {
    const instance = await (target as typeof BaseEntity).findBy({
      id,
    } as FindOptionsWhere<unknown> as FindOptionsWhere<Model>);
    if (!instance) throw new Error("Instance not found");
    return instanceMethod.apply(instance, args);
  };

  const staticName = props.staticName || (propertyKey as string);
  (target as any)[staticName] = staticMethod;

  const methodMetadataKeys = Reflect.getMetadataKeys(instanceMethod);
  for (const key of methodMetadataKeys) {
    const metadataValue = Reflect.getMetadata(key, instanceMethod);
    Reflect.defineMetadata(key, metadataValue, staticMethod);
  }

  return { staticMethod, staticName };
}

export function InstanceTypeRESTAction(
  props: typeRESTActionInputProps
): MethodDecorator {
  return function <TInstanceMethod extends (...args: any[]) => Promise<any>>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<TInstanceMethod>
  ) {
    const { staticName } = createStaticMethod(
      target,
      propertyKey,
      descriptor,
      props
    );

    StaticTypeRESTAction({
      ...props,
      staticName,
    })(target, staticName, descriptor);

    return descriptor;
  } as MethodDecorator;
}

export function InstanceTypeGQLAction(
  props: typeGQLActionInputProps
): MethodDecorator {
  return function <TInstanceMethod extends (...args: any[]) => Promise<any>>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<TInstanceMethod>
  ) {
    const { staticName } = createStaticMethod(
      target,
      propertyKey,
      descriptor,
      props
    );

    StaticTypeGQLAction({
      ...props,
      staticName,
    })(target, staticName, descriptor);

    return descriptor;
  } as MethodDecorator;
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
      if (props.autogenTypeGQL) {
        InstanceTypeGQLAction(props)(target, propertyKey, descriptor);
      }
      if (props.autogenTypeRest) {
        InstanceTypeRESTAction(props)(target, propertyKey, descriptor);
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
