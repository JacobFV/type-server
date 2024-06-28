export function generateResolverBase<T extends typeServer.Model>(model: T) {
  return class {};
}
