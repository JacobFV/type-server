import type Context from "@tensaco/type-server/context";
import { ValOrPred, type ClassType } from "@tensaco/type-server/utils/types";
import { BaseEntity } from "typeorm";
import {
  DefineMetadata,
  ConditionalMethodDecorator,
  DropMethod,
} from "@tensaco/type-server/utils/decorators";
import {
  isStaticMethod,
  isInstanceMethod,
} from "@tensaco/type-server/utils/utils";
export type ModelBase = object;
export type ModelCreate = ModelBase & {};
export type ModelRead = ModelBase & {};
export type ModelUpdate = ModelBase & {};
export type ModelInDB = ModelBase & BaseEntity;
export type Model = ModelCreate & ModelInDB & ModelRead & ModelUpdate;

export type BasePermissionProps = { context: Context };
export type CreatePermissionProps = BasePermissionProps & {
  modelCreate: ModelCreate;
  context: Context;
};
export type ReadPermissionProps = BasePermissionProps & {
  modelInDB: ModelInDB;
  context: Context;
};
export type UpdatePermissionProps = BasePermissionProps & {
  modelUpdate: ModelUpdate;
  modelInDB: ModelInDB;
  context: Context;
};
export type DeletePermissionProps = BasePermissionProps & {
  modelInDB: ModelInDB;
  context: Context;
};
export type CRUDPermissionProps =
  | CreatePermissionProps
  | ReadPermissionProps
  | UpdatePermissionProps
  | DeletePermissionProps;

export type CreatePermissionPredicate = (
  args: CreatePermissionProps
) => boolean;
export type ReadPermissionPredicate = (args: ReadPermissionProps) => boolean;
export type UpdatePermissionPredicate = (
  args: UpdatePermissionProps
) => boolean;
export type DeletePermissionPredicate = (
  args: DeletePermissionProps
) => boolean;

export type AddCRUDAPIParams = {
  allowCreate: ValOrPred<boolean, [CreatePermissionProps]>;
  allowRead: ValOrPred<boolean, [ReadPermissionProps]>;
  allowUpdate: ValOrPred<boolean, [UpdatePermissionProps]>;
  allowDelete: ValOrPred<boolean, [DeletePermissionProps]>;
};
export const ADD_CRUD_API_DEFAULTS: AddCRUDAPIParams = {
  allowCreate: false,
  allowRead: false,
  allowUpdate: false,
  allowDelete: false,
};

interface SupportsCRUDOps {
  Create: (modelCreate: ModelCreate, context: Context) => Promise<ModelInDB>;
  Read: (modelInDB: ModelInDB, context: Context) => Promise<ModelRead>;
  Update: (
    modelUpdate: ModelUpdate,
    modelInDB: ModelInDB,
    context: Context
  ) => Promise<ModelInDB>;
  Delete: (modelInDB: ModelInDB, context: Context) => Promise<void>;
}

export function AddCRUDAPI<
  TBase extends ModelBase = {},
  TCreate extends ModelCreate = ModelCreate,
  TRead extends ModelRead = ModelRead,
  TUpdate extends ModelUpdate = ModelUpdate,
  TInDB extends ModelInDB = ModelInDB
>(params: AddCRUDAPIParams = ADD_CRUD_API_DEFAULTS) {
  params = { ...ADD_CRUD_API_DEFAULTS, ...params };

  return function <T extends ClassType<ModelInDB>>(
    target: T
  ): ClassType<SupportsCRUDOps> & T {
    const Entity: typeof BaseEntity = target as any;
    // Simplified condition
    return class extends Entity implements SupportsCRUDOps {
      @DropMethod(params.allowCreate === false || params.allowCreate === null)
      @StaticMethod({
        name: "Create",
        method: "POST",
        path: "/:id",
      })
      @ConditionalMethodDecorator(
        allowCreate !== true,
        EnforcePermission(allowCreate)
      )
      static async APICreate(
        modelCreate: ModelCreate,
        context: Context
      ): Promise<ModelRead> {
        const modelInDB = Entity.create(modelCreate);
        return modelInDB; // the variants are a statement on the keys that are definately present but there are better you have to pick each time you convert
      }

      @DropMethod(params.allowRead === false || params.allowRead === null)
      @StaticMethod({
        name: "Read",
        method: "GET",
        path: "/:id",
      })
      @ConditionalMethodDecorator(
        allowRead !== true,
        EnforcePermission(allowRead)
      )
      static async APIRead(
        this: InstanceType<T>,
        context: Context
      ): Promise<ModelRead> {
        // Implementation here
      }

      @DropMethod(params.allowUpdate === false || params.allowUpdate === null)
      @StaticMethod({
        name: "Update",
        method: "PUT",
        path: "/:id",
      })
      @ConditionalMethodDecorator(
        allowUpdate !== true,
        EnforcePermission(allowUpdate)
      )
      static APIUpdate(this: InstanceType<T>, context: Context) {
        // Implementation here
      }

      @DropMethod(params.allowDelete === false || params.allowDelete === null)
      @StaticMethod({
        name: "Delete",
        method: "DELETE",
        path: "/:id",
      })
      @ConditionalMethodDecorator(
        allowDelete !== true,
        EnforcePermission(allowDelete)
      )
      static APIDelete(this: InstanceType<T>, context: Context) {
        // Implementation here
      }
    };
  };

  export type StaticMethodProps = {
    name: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
    path: string;
  };
  export type StaticMethodDecorator = (
    target: ClassType<Model>,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => PropertyDescriptor;
  export const STATIC_METHOD_DECORATOR_KEY =
    "custom:tensaco-type-server-staticMethod";
  export function StaticMethod<T extends ClassType<Model>>(
    props: StaticMethodProps
  ) {
    return function (
      target: T,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      // Additional check to ensure the method is static
      if (!isStaticMethod(target, propertyKey)) {
        throw new Error("The decorated method is not static");
      }
      Reflect.defineMetadata(
        STATIC_METHOD_DECORATOR_KEY,
        props,
        target,
        propertyKey
      );

      return descriptor;
    };
  }

  export type InstanceMethodProps = {
    keys: string[];
    name: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
    path: string;
  };
  export const INSTANCE_METHOD_DECORATOR_KEY =
    "custom:tensaco-type-server-instanceMethod";
  export function InstanceMethod<T extends ClassType<Model>>(
    props: InstanceMethodProps
  ) {
    return function (
      target: T,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      if (!isInstanceMethod(target, propertyKey)) {
        throw new Error("The decorated method is not an instance method");
      }
      Reflect.defineMetadata(
        INSTANCE_METHOD_DECORATOR_KEY,
        props,
        target,
        propertyKey
      );
    };
    return descriptor;
  }
}
