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
