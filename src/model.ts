import { typeGQL, typeORM } from "@tensaco/type-server/deps";
import {
  Action,
  ACTION_PARAM_DECORATOR_KEY,
  Param,
  type ActionProps,
} from "@tensaco/type-server/methods";
import {
  HTTPError,
  NOT_FOUND_ERROR_CODE,
  NotFoundError,
  type StaticMethod,
} from "@tensaco/type-server/utils/types";
import {
  isInstanceMethod,
  isStaticMethod,
} from "@tensaco/type-server/utils/typescript";
import { Get, Path, BodyProp } from "tsoa";
import type {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  InsertResult,
  ObjectId,
  RemoveOptions,
  SaveOptions,
  UpdateResult,
} from "typeorm";
import * as tsoa from "tsoa";
import { BaseEntity } from "typeorm/browser";
import type { PickKeysByType } from "typeorm/common/PickKeysByType.js";
import { Column } from "typeorm/decorator/columns/Column.js";
import type { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity.js";
import type { UpsertOptions } from "typeorm/repository/UpsertOptions.js";

export class Model extends BaseEntity {
  @typeGQL.Field()
  @typeORM.PrimaryGeneratedColumn("uuid")
  id!: number;

  @Action({ restVerb: "POST" })
  static create<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "entity", restFormat: "body" })
    entity: DeepPartial<T>
  ): T {
    return super.create(entity) as T;
  }

  @Action({ restVerb: "POST" })
  static createMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "entities", restFormat: "body" })
    entities: DeepPartial<T>[]
  ): T[] {
    return super.create(entities) as T[];
  }

  @Action({ restVerb: "POST" })
  static async merge<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "mergeIntoEntityId", restFormat: "path" })
    mergeIntoEntityId: string | number | Date | ObjectId,
    @Param({ name: "entityLikes", restFormat: "body" })
    entityLikes: DeepPartial<T>[]
  ): Promise<T> {
    const entity = await this.findOneById(mergeIntoEntityId);
    if (!entity) {
      throw new NotFoundError();
    }
    return super.merge(entity, ...entityLikes) as T;
  }

  @Action({ restVerb: "GET" })
  static async preload<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "entityLike", restFormat: "body" })
    entityLike: DeepPartial<T>
  ): Promise<T | undefined> {
    try {
      return (await super.preload(entityLike)) as T | undefined;
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @Action({ restVerb: "POST" })
  static save<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "entity", restFormat: "body" }) entity: DeepPartial<T>,
    @Param({ name: "options", restFormat: "body" }) options?: SaveOptions
  ): Promise<T> {
    return super.save(entity, options) as Promise<T>;
  }

  @Action({ restVerb: "POST" })
  static saveMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "entities", restFormat: "body" })
    entities: DeepPartial<T>[],
    @Param({ name: "options", restFormat: "body" }) options?: SaveOptions
  ): Promise<T[]> {
    return super.save(entities, options) as Promise<T[]>;
  }

  @Action({ restVerb: "DELETE" })
  static async remove<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "entityId", restFormat: "path" })
    entityId: string | number | Date | ObjectId,
    @Param({ name: "options", restFormat: "body" }) options?: RemoveOptions
  ): Promise<T> {
    const entity = await this.findOneById(entityId);
    if (!entity) {
      throw new NotFoundError("Entity not found");
    }
    return super.remove(entity, options) as Promise<T>;
  }

  @Action({ restVerb: "DELETE" })
  static async removeMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "entityIds", restFormat: "body" })
    entityIds: (string | number | Date | ObjectId)[],
    @Param({ name: "options", restFormat: "body" }) options?: RemoveOptions
  ): Promise<T[]> {
    const entities: T[] = [];
    for (const id of entityIds) {
      const entity = await this.findOneById(id);
      if (!entity) {
        throw new NotFoundError(`Entity with id ${id} not found`);
      }
      entities.push(entity as T);
    }
    return super.remove(entities, options) as Promise<T[]>;
  }

  @Action({ restVerb: "PATCH" })
  static async softRemove<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "entityId", restFormat: "path" })
    entityId: string | number | Date | ObjectId,
    @Param({ name: "options", restFormat: "body" }) options?: SaveOptions
  ): Promise<T> {
    const entity = await this.findOneById(entityId);
    if (!entity) {
      throw new NotFoundError("Entity not found");
    }
    return super.softRemove(entity, options) as Promise<T>;
  }

  @Action({ restVerb: "PATCH" })
  static async softRemoveMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "entityIds", restFormat: "body" })
    entityIds: (string | number | Date | ObjectId)[],
    @Param({ name: "options", restFormat: "body" }) options?: SaveOptions
  ): Promise<T[]> {
    const entities: T[] = [];
    for (const id of entityIds) {
      const entity = await this.findOneById(id);
      if (!entity) {
        throw new NotFoundError(`Entity with id ${id} not found`);
      }
      entities.push(entity as T);
    }
    return super.softRemove(entities, options) as Promise<T[]>;
  }

  @Action({ restVerb: "POST" })
  static insert<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "entity", restFormat: "body" })
    entity: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[]
  ): Promise<InsertResult> {
    return super.insert(entity);
  }

  @Action({ restVerb: "PATCH" })
  static async update<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "criteria", restFormat: "body" })
    criteria: FindOptionsWhere<T>,
    @Param({ name: "partialEntity", restFormat: "body" })
    partialEntity: QueryDeepPartialEntity<T>
  ): Promise<UpdateResult> {
    return super.update(criteria, partialEntity);
  }

  @Action({ restVerb: "PATCH" })
  static async updateById<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "id", restFormat: "path" })
    id: string | number | Date | ObjectId,
    @Param({ name: "partialEntity", restFormat: "body" })
    partialEntity: QueryDeepPartialEntity<T>
  ): Promise<UpdateResult> {
    const entity = await this.findOneById(id);
    if (!entity) {
      throw new NotFoundError("Entity not found");
    }
    return super.update(id, partialEntity);
  }

  @Action({ restVerb: "PATCH" })
  static async updateMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "criteria", restFormat: "body" })
    criteria: FindOptionsWhere<T>[],
    @Param({ name: "partialEntities", restFormat: "body" })
    partialEntities: QueryDeepPartialEntity<T>[]
  ): Promise<UpdateResult[]> {
    const results: UpdateResult[] = [];
    for (let i = 0; i < criteria.length; i++) {
      results.push(await super.update(criteria[i], partialEntities[i]));
    }
    return results;
  }

  @Action({ restVerb: "DELETE" })
  static async delete<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "criteria", restFormat: "body" })
    criteria: string | number | Date | ObjectId | FindOptionsWhere<T>
  ): Promise<DeleteResult> {
    return super.delete(criteria);
  }

  @Action({ restVerb: "DELETE" })
  static async deleteMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "criteria", restFormat: "body" })
    criteria: (string | number | Date | ObjectId | FindOptionsWhere<T>)[]
  ): Promise<DeleteResult[]> {
    const results: DeleteResult[] = [];
    for (const criterion of criteria) {
      results.push(await super.delete(criterion));
    }
    return results;
  }

  @Action({ restVerb: "DELETE" })
  static async deleteById<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "id", restFormat: "path" })
    id: string | number | Date | ObjectId
  ): Promise<DeleteResult> {
    const entity = await this.findOneById(id);
    if (!entity) {
      throw new NotFoundError("Entity not found");
    }
    return super.delete(id);
  }

  @Action({ restVerb: "DELETE" })
  static async deleteByIds<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "ids", restFormat: "body" })
    ids: (string | number | Date | ObjectId)[]
  ): Promise<DeleteResult[]> {
    const results: DeleteResult[] = [];
    for (const id of ids) {
      const entity = await this.findOneById(id);
      if (!entity) {
        throw new NotFoundError(`Entity with id ${id} not found`);
      }
      results.push(await super.delete(id));
    }
    return results;
  }

  @Action({ restVerb: "POST" })
  static upsert<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "entityOrEntities", restFormat: "body" })
    entityOrEntities: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[],
    @Param({ name: "conflictPathsOrOptions", restFormat: "body" })
    conflictPathsOrOptions: string[] | UpsertOptions<T>
  ): Promise<InsertResult> {
    return super.upsert(entityOrEntities, conflictPathsOrOptions);
  }

  @Action({ restVerb: "GET" })
  static exists<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "options", restFormat: "query" })
    options?: FindManyOptions<T>
  ): Promise<boolean> {
    return super.exists(options as FindManyOptions<BaseEntity>);
  }

  @Action({ restVerb: "GET" })
  static existsBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "where", restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<boolean> {
    return super.existsBy(where);
  }

  @Action({ restVerb: "GET" })
  static count<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "options", restFormat: "query" })
    options?: FindManyOptions<T>
  ): Promise<number> {
    return super.count(options as FindManyOptions<BaseEntity>);
  }

  @Action({ restVerb: "GET" })
  static countBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "where", restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<number> {
    return super.countBy(where);
  }

  @Action({ restVerb: "GET" })
  static sum<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "columnName", restFormat: "path" })
    columnName: PickKeysByType<T, number>,
    @Param({ name: "where", restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<number | null> {
    return super.sum(columnName as never, where);
  }

  @Action({ restVerb: "GET" })
  static average<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "columnName", restFormat: "path" })
    columnName: PickKeysByType<T, number>,
    @Param({ name: "where", restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<number | null> {
    return super.average(columnName as never, where);
  }

  @Action({ restVerb: "GET" })
  static minimum<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "columnName", restFormat: "path" })
    columnName: PickKeysByType<T, number>,
    @Param({ name: "where", restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<number | null> {
    return super.minimum(columnName as never, where);
  }

  @Action({ restVerb: "GET" })
  static maximum<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "columnName", restFormat: "path" })
    columnName: PickKeysByType<T, number>,
    @Param({ name: "where", restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<number | null> {
    return super.maximum(columnName as never, where);
  }

  @Action({ restVerb: "GET" })
  static find<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "options", restFormat: "query" })
    options?: FindManyOptions<T>
  ): Promise<T[]> {
    return super.find(options as FindManyOptions<BaseEntity>) as Promise<T[]>;
  }

  @Action({ restVerb: "GET" })
  static findBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "where", restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<T[]> {
    return super.findBy(where) as Promise<T[]>;
  }

  @Action({ restVerb: "GET" })
  static findAndCount<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "options", restFormat: "query" })
    options?: FindManyOptions<T>
  ): Promise<[T[], number]> {
    return super.findAndCount(
      options as FindManyOptions<BaseEntity>
    ) as Promise<[T[], number]>;
  }

  @Action({ restVerb: "GET" })
  static findAndCountBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "where", restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<[T[], number]> {
    return super.findAndCountBy(where) as Promise<[T[], number]>;
  }

  @Action({ restVerb: "GET" })
  static findByIds<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "ids", restFormat: "query" }) ids: any[]
  ): Promise<T[]> {
    return super.findByIds(ids) as Promise<T[]>;
  }

  @Action({ restVerb: "GET" })
  static async findOne<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "options", restFormat: "query" })
    options: FindOneOptions<T>
  ): Promise<T | null> {
    try {
      return (await super.findOne(
        options as FindOneOptions<BaseEntity>
      )) as T | null;
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }
  @Action({ restVerb: "GET" })
  static async findOneBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "where", restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<T | null> {
    try {
      return (await super.findOneBy(where)) as T | null;
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @Action({ restVerb: "GET" })
  static async findOneById<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "id", restFormat: "path" })
    id: string | number | Date | ObjectId
  ): Promise<T | null> {
    try {
      return (await super.findOneById(id)) as T | null;
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @Action({ restVerb: "GET" })
  static async findOneOrFail<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "options", restFormat: "query" })
    options: FindOneOptions<T>
  ): Promise<T> {
    try {
      return (await super.findOneOrFail(
        options as FindOneOptions<BaseEntity>
      )) as T;
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @Action({ restVerb: "GET" })
  static async findOneByOrFail<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "where", restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<T> {
    try {
      return (await super.findOneByOrFail(where)) as T;
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @Action({ restVerb: "POST" })
  static query<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ name: "query", restFormat: "body" }) query: string,
    @Param({ name: "parameters", restFormat: "body" }) parameters?: any[]
  ): Promise<any> {
    return super.query(query, parameters);
  }

  @Action({ restVerb: "DELETE" })
  static clear<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity
  ): Promise<void> {
    return super.clear();
  }
}

const FIELD_DECORATOR_KEY = "custom:tensaco-type-server";
type FieldProps = {
  typeormProps: object;
  typeGQLProps: object;
  tsoaProps: object;
};
export function Field(): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata(FIELD_DECORATOR_KEY, target, propertyKey);
  };
}

export function PrepareModel(): ClassDecorator {
  function decorator<T extends typeof Model>(target: T) {
    Object.getOwnPropertyNames(target.prototype).forEach((methodName) => {
      const property = (target.prototype as any)[methodName];
      if (typeof property === "function") {
        let staticMethodName = methodName;
        const actionMetadata: ActionProps = Reflect.getMetadata(
          ACTION_PARAM_DECORATOR_KEY,
          target.prototype,
          methodName
        );
        if (!actionMetadata) {
          return;
        }

        console.log(`Method: ${methodName}`);
        if (isInstanceMethod(target, methodName)) {
          // for each `InstanceMethod`-annotated method,
          // make a static equivalent
          staticMethodName = actionMetadata.staticName!;
          (target as any)[staticMethodName] = async (
            id: number,
            ...args: any[]
          ) => {
            const instance = await target.findOne.call(target, {
              where: { id: id } as FindOptionsWhere<BaseEntity>,
            });
            if (!instance) {
              throw new Error("Instance not found");
            }
            return property.apply(instance, args);
          };
        }
        let staticMethod = (target as any)[staticMethodName];
        if (actionMetadata.autogenTypeGQL) {
          // TODO: add typeGQL param decorators
          // TODO: add typeGQL context parameter

          switch (actionMetadata.gqlMethod) {
            case "query":
              staticMethod = typeGQL.Query(actionMetadata.typeGQLQueryOptions)(
                target,
                staticMethodName,
                staticMethod
              );
              break;
            case "mutation":
              staticMethod = typeGQL.Mutation(
                actionMetadata.typeGQLMutationOptions
              )(target, staticMethodName, staticMethod);
              break;
            case "subscription":
              staticMethod = typeGQL.Subscription(
                actionMetadata.typeGQLSubscriptionOptions
              )(target, staticMethodName, staticMethod);
              break;
            default:
              throw new Error(
                `Unsupported GQL method: ${actionMetadata.gqlMethod}`
              );
          }
        }
        if (actionMetadata.autogenTypeRest) {
          // TODO: add tsoa param decorators
          // TODO: add tsoa context parameter

          // FIXME: implement websocket streaming for http also
          switch (actionMetadata.restVerb) {
            case "GET":
              staticMethod = tsoa.Get(actionMetadata.path)(
                target,
                staticMethodName,
                staticMethod
              );
              break;
            case "POST":
              staticMethod = tsoa.Post(actionMetadata.path)(
                target,
                staticMethodName,
                staticMethod
              );
              break;
            case "PUT":
              staticMethod = tsoa.Put(actionMetadata.path)(
                target,
                staticMethodName,
                staticMethod
              );
              break;
            case "DELETE":
              staticMethod = tsoa.Delete(actionMetadata.path)(
                target,
                staticMethodName,
                staticMethod
              );
              break;
            case "PATCH":
              staticMethod = tsoa.Patch(actionMetadata.path)(
                target,
                staticMethodName,
                staticMethod
              );
              break;
            case "OPTIONS":
              staticMethod = tsoa.Options(actionMetadata.path)(
                target,
                staticMethodName,
                staticMethod
              );
              break;
            case "HEAD":
              staticMethod = tsoa.Head(actionMetadata.path)(
                target,
                staticMethodName,
                staticMethod
              );
              break;
            default:
              throw new Error(
                `Unsupported HTTP method: ${actionMetadata.restVerb}`
              );
          }
          (target as any)[staticMethodName] = staticMethod;
        }
      } else {
        // check if it has a @Field decorator
        const fieldMetadata = Reflect.getMetadata(
          FIELD_DECORATOR_KEY,
          target.prototype,
          methodName
        );
      }
      return;
    });
    return target;
  }
  return decorator as ClassDecorator;
}
