export type StaticMethodProps = {
  name?: string;
  path?: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
};

export const STATIC_METHOD_DECORATOR_KEY =
  "custom:tensaco-type-server-staticMethod";
export function StaticMethod(props: StaticMethodProps): MethodDecorator {
  return function <T>(
    target: Object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    if (typeof propertyKey !== "string") {
      propertyKey = String(propertyKey);
    }

    try {
      target = target as ClassType<Model>;
    } catch (error) {
      throw new Error("Target must be an instance of ClassType<Model>");
    }

    const snakeCaseName = propertyKey
      .replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`)
      .replace(/^_/, "");
    const propsWithDefaults = {
      name: snakeCaseName,
      path: "/" + snakeCaseName,
      ...props,
    };

    // Additional check to ensure the method is static
    if (!isStaticMethod(target as ClassType<Model>, propertyKey)) {
      throw new Error("The decorated method is not static");
    }
    Reflect.defineMetadata(
      STATIC_METHOD_DECORATOR_KEY,
      propsWithDefaults,
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
export function InstanceMethod<T extends Model>(props: InstanceMethodProps) {
  return function (
    target: T,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> | void {
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
}

class Example {
  @StaticMethod({ method: "GET" })
  static getExample() {
    return "example";
  }

  @InstanceMethod({ method: "GET", path: "/example" })
  getExample() {
    return "example";
  }
}
