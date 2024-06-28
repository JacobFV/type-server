export function generateControllerBase<T extends Model>(model: T) {
  return class {
    constructor(private model: T) {}
  };
}
