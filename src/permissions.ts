type PermissionsFn = (
  context: typeServer.Context,
  entity?: typeServer.Model
) => boolean;

/**
 * @returns a decorator that can be used to enforce access permissions for a model or a method
 */
function Permissions() {
  return function (target: any, propertyKey?: string) {
    console.log(target, propertyKey);
  };
}

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
