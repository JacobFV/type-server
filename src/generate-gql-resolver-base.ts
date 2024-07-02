export function generateResolverBase<T extends typeof Model>(modelType: T) {
  // first get the `StaticMethod`s that are already on the class
  // const staticMethods = Object.getOwnPropertyNames(modelType).filter((name) => typeof modelType[name] === "function" && Reflect.getOwnPropertyDescriptor(modelType, name)?.get);

  // also add field level resolver with permissions enforced based on the @Field annotations

  return class {};
}
