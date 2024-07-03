import { createParameterDecorator } from "type-graphql";
import { GraphQLUpload } from "graphql-upload";
import {
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
} from "graphql/type";
import type ServiceContext from "@tensaco/type-server/context";
import { isEnum } from "@tensaco/type-server/utils/typescript";
import * as typeGQL from "type-graphql";
import * as typeREST from "typescript-rest";

type BaseParamOptions = {
  typeREST?: boolean;
  typeGQL?: boolean;
};

type NamedParamOptions = BaseParamOptions & {
  name: string;
  required?: boolean;
};

function getGraphQLType(paramType: any) {
  if (paramType === GraphQLInt) return GraphQLInt;
  if (paramType === Number) return GraphQLFloat;
  if (paramType === String) return GraphQLString;
  if (paramType === Boolean) return GraphQLBoolean;
  if (isEnum(paramType)) return GraphQLEnumType;
  return GraphQLInputObjectType;
}

// Merged Decorators

export function Request(options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeREST: true, typeGQL: true, ...options };

    if (options.typeREST) {
      Reflect.defineMetadata(
        "custom:tensaco-type-server-request-param",
        parameterIndex,
        target,
        propertyKey
      );
      typeREST.ContextRequest(target, propertyKey, parameterIndex);
    }

    if (options.typeGQL) {
      createParameterDecorator<ServiceContext>(
        ({ context }: { context: ServiceContext }) => context.request
      )(target, propertyKey, parameterIndex);
    }
  };
}

export function Response(options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeREST: true, typeGQL: true, ...options };

    if (options.typeREST) {
      Reflect.defineMetadata(
        "custom:tensaco-type-server-response-param",
        parameterIndex,
        target,
        propertyKey
      );
      typeREST.ContextResponse(target, propertyKey, parameterIndex);
    }

    if (options.typeGQL) {
      createParameterDecorator<ServiceContext>(
        ({ context }: { context: ServiceContext }) => context.response
      )(target, propertyKey, parameterIndex);
    }
  };
}

export function Cookie(name?: string, options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeREST: true, typeGQL: true, ...options };
    const cookieName = name ?? (propertyKey as string);

    if (options.typeREST) {
      Reflect.defineMetadata(
        "custom:tensaco-type-server-cookie-param",
        parameterIndex,
        target,
        propertyKey
      );
      typeREST.CookieParam(cookieName)(target, propertyKey, parameterIndex);
    }

    if (options.typeGQL) {
      createParameterDecorator<ServiceContext>(
        ({ context }: { context: ServiceContext }) =>
          context.request.cookies[cookieName]
      )(target, propertyKey, parameterIndex);
    }
  };
}

export function Header(name?: string, options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeREST: true, typeGQL: true, ...options };
    const headerName = name ?? (propertyKey as string);

    if (options.typeREST) {
      Reflect.defineMetadata(
        "custom:tensaco-type-server-header-param",
        parameterIndex,
        target,
        propertyKey
      );
      typeREST.HeaderParam(headerName)(target, propertyKey, parameterIndex);
    }

    if (options.typeGQL) {
      createParameterDecorator<ServiceContext>(
        ({ context }: { context: ServiceContext }) =>
          context.request.headers[headerName]
      )(target, propertyKey, parameterIndex);
    }
  };
}

export function Context(options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeREST: true, typeGQL: true, ...options };

    if (options.typeREST) {
      Reflect.defineMetadata(
        "custom:tensaco-type-server-context-param",
        parameterIndex,
        target,
        propertyKey
      );
      typeREST.Context(target, propertyKey, parameterIndex);
    }

    if (options.typeGQL) {
      typeGQL.Ctx(propertyKey as string)(target, propertyKey, parameterIndex);
    }
  };
}

export function Param(
  options: NamedParamOptions & {
    restFormat?:
      | "body"
      | "query"
      | "path"
      | "file"
      | "files"
      | "cookie"
      | "header";
  }
) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeREST: true, typeGQL: true, ...options };

    if (options.typeREST && options.restFormat) {
      switch (options.restFormat) {
        case "body":
          typeREST.FormParam(options.name)(target, propertyKey, parameterIndex);
          break;
        case "query":
          typeREST.QueryParam(options.name)(
            target,
            propertyKey,
            parameterIndex
          );
          break;
        case "path":
          typeREST.PathParam(options.name)(target, propertyKey, parameterIndex);
          break;
        case "file":
          typeREST.FileParam(options.name)(target, propertyKey, parameterIndex);
          break;
        case "files":
          typeREST.FilesParam(options.name)(
            target,
            propertyKey,
            parameterIndex
          );
          break;
        case "cookie":
          typeREST.CookieParam(options.name)(
            target,
            propertyKey,
            parameterIndex
          );
          break;
        case "header":
          typeREST.HeaderParam(options.name)(
            target,
            propertyKey,
            parameterIndex
          );
          break;
        default:
          throw new Error(`Invalid restFormat: ${options.restFormat}`);
      }
    }

    if (options.typeGQL) {
      const paramType = Reflect.getMetadata("design:type", target, propertyKey);
      const typeGQLParamType = getGraphQLType(paramType);

      typeGQL.Arg(options.name, () => typeGQLParamType, {
        nullable: !options.required,
      })(target, propertyKey, parameterIndex);
    }
  };
}

// Separate REST Decorators

export function RequestREST(options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeREST: true, ...options };
    if (options.typeREST) {
      Reflect.defineMetadata(
        "custom:tensaco-type-server-request-param",
        parameterIndex,
        target,
        propertyKey
      );
      typeREST.ContextRequest(target, propertyKey, parameterIndex);
    }
  };
}

export function ResponseREST(options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeREST: true, ...options };
    if (options.typeREST) {
      Reflect.defineMetadata(
        "custom:tensaco-type-server-response-param",
        parameterIndex,
        target,
        propertyKey
      );
      typeREST.ContextResponse(target, propertyKey, parameterIndex);
    }
  };
}

export function CookieREST(name?: string, options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeREST: true, ...options };
    const cookieName = name ?? (propertyKey as string);
    if (options.typeREST) {
      Reflect.defineMetadata(
        "custom:tensaco-type-server-cookie-param",
        parameterIndex,
        target,
        propertyKey
      );
      typeREST.CookieParam(cookieName)(target, propertyKey, parameterIndex);
    }
  };
}

export function HeaderREST(name?: string, options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeREST: true, ...options };
    const headerName = name ?? (propertyKey as string);
    if (options.typeREST) {
      Reflect.defineMetadata(
        "custom:tensaco-type-server-header-param",
        parameterIndex,
        target,
        propertyKey
      );
      typeREST.HeaderParam(headerName)(target, propertyKey, parameterIndex);
    }
  };
}

export function ContextREST(options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeREST: true, ...options };
    if (options.typeREST) {
      Reflect.defineMetadata(
        "custom:tensaco-type-server-context-param",
        parameterIndex,
        target,
        propertyKey
      );
      typeREST.Context(target, propertyKey, parameterIndex);
    }
  };
}

export function ParamREST(
  options: NamedParamOptions & {
    restFormat:
      | "body"
      | "query"
      | "path"
      | "file"
      | "files"
      | "cookie"
      | "header";
  }
) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeREST: true, ...options };

    if (options.typeREST) {
      switch (options.restFormat) {
        case "body":
          typeREST.FormParam(options.name)(target, propertyKey, parameterIndex);
          break;
        case "query":
          typeREST.QueryParam(options.name)(
            target,
            propertyKey,
            parameterIndex
          );
          break;
        case "path":
          typeREST.PathParam(options.name)(target, propertyKey, parameterIndex);
          break;
        case "file":
          typeREST.FileParam(options.name)(target, propertyKey, parameterIndex);
          break;
        case "files":
          typeREST.FilesParam(options.name)(
            target,
            propertyKey,
            parameterIndex
          );
          break;
        case "cookie":
          typeREST.CookieParam(options.name)(
            target,
            propertyKey,
            parameterIndex
          );
          break;
        case "header":
          typeREST.HeaderParam(options.name)(
            target,
            propertyKey,
            parameterIndex
          );
          break;
        default:
          throw new Error(`Invalid restFormat: ${options.restFormat}`);
      }
    }
  };
}

// Separate GraphQL Decorators

export function RequestGQL(options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    options = { typeGQL: true, ...options };
    if (options.typeGQL) {
      createParameterDecorator<ServiceContext>(
        ({ context }: { context: ServiceContext }) => context.request
      )(target, propertyKey, parameterIndex);
    }
  };
}

export function ResponseGQL(options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    options = { typeGQL: true, ...options };
    if (options.typeGQL) {
      createParameterDecorator<ServiceContext>(
        ({ context }: { context: ServiceContext }) => context.response
      )(target, propertyKey, parameterIndex);
    }
  };
}

export function CookieGQL(name?: string, options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    options = { typeGQL: true, ...options };
    const cookieName = name ?? (propertyKey as string);
    if (options.typeGQL) {
      createParameterDecorator<ServiceContext>(
        ({ context }: { context: ServiceContext }) =>
          context.request.cookies[cookieName]
      )(target, propertyKey, parameterIndex);
    }
  };
}

export function HeaderGQL(name?: string, options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    options = { typeGQL: true, ...options };
    const headerName = name ?? (propertyKey as string);
    if (options.typeGQL) {
      createParameterDecorator<ServiceContext>(
        ({ context }: { context: ServiceContext }) =>
          context.request.headers[headerName]
      )(target, propertyKey, parameterIndex);
    }
  };
}

export function ContextGQL(options: BaseParamOptions = {}) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeGQL: true, ...options };
    if (options.typeGQL) {
      typeGQL.Ctx(propertyKey as string)(target, propertyKey, parameterIndex);
    }
  };
}

export function ParamGQL(options: NamedParamOptions) {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    if (!propertyKey) throw new Error("Property key is required.");
    options = { typeGQL: true, ...options };

    if (options.typeGQL) {
      const paramType = Reflect.getMetadata("design:type", target, propertyKey);
      const typeGQLParamType = getGraphQLType(paramType);

      typeGQL.Arg(options.name, () => typeGQLParamType, {
        nullable: !options.required,
      })(target, propertyKey, parameterIndex);
    }
  };
}
