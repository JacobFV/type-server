import { typeGQL, typeORM } from "@tensaco/type-server/deps";
import { Action } from "@tensaco/type-server/methods";
import { Param } from "tsoa";
import type {
  BaseEntity,
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
import type { PickKeysByType } from "typeorm/common/PickKeysByType.js";
import type { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity.js";
import type { UpsertOptions } from "typeorm/repository/UpsertOptions.js";

export class Model<T extends BaseEntity = BaseEntity> extends BaseEntity {
  @typeGQL.Field()
  @typeORM.PrimaryGeneratedColumn("uuid")
  id!: number;

  @Action({ restVerb: "POST" })
  static create<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "body" }) entityLike: DeepPartial<T>
  ): T {
    return super.create(entityLike);
  }

  @Action({ restVerb: "POST" })
  static createMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "body" }) entityLikeArray: DeepPartial<T>[]
  ): T[] {
    return super.create(entityLikeArray);
  }

  @Action({ restVerb: "POST" })
  static async merge<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "path" })
    mergeIntoEntityId: string | number | Date | ObjectId,
    @Param({ restFormat: "body" }) entityLikes: DeepPartial<T>[]
  ): Promise<T> {
    const entity = await this.findOneById(mergeIntoEntityId);
    if (!entity) {
      throw new NotFoundError("Entity not found");
    }
    return super.merge(entity, ...entityLikes);
  }

  @Action({ restVerb: "GET" })
  static async preload<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "body" }) entityLike: DeepPartial<T>
  ): Promise<T | undefined> {
    try {
      return await super.preload(entityLike);
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @Action({ restVerb: "POST" })
  static save<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "body" }) entity: DeepPartial<T>,
    @Param({ restFormat: "body" }) options?: SaveOptions
  ): Promise<T> {
    return super.save(entity, options);
  }

  @Action({ restVerb: "POST" })
  static saveMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "body" }) entities: DeepPartial<T>[],
    @Param({ restFormat: "body" }) options?: SaveOptions
  ): Promise<T[]> {
    return super.save(entities, options);
  }

  @Action({ restVerb: "DELETE" })
  static async remove<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "path" }) entityId: string | number | Date | ObjectId,
    @Param({ restFormat: "body" }) options?: RemoveOptions
  ): Promise<T> {
    const entity = await this.findOneById(entityId);
    if (!entity) {
      throw new NotFoundError("Entity not found");
    }
    return super.remove(entity, options);
  }

  @Action({ restVerb: "DELETE" })
  static async removeMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "body" })
    entityIds: (string | number | Date | ObjectId)[],
    @Param({ restFormat: "body" }) options?: RemoveOptions
  ): Promise<T[]> {
    const entities: T[] = [];
    for (const id of entityIds) {
      const entity = await this.findOneById(id);
      if (!entity) {
        throw new NotFoundError(`Entity with id ${id} not found`);
      }
      entities.push(entity);
    }
    return super.remove(entities, options);
  }

  @Action({ restVerb: "PATCH" })
  static async softRemove<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "path" }) entityId: string | number | Date | ObjectId,
    @Param({ restFormat: "body" }) options?: SaveOptions
  ): Promise<T> {
    const entity = await this.findOneById(entityId);
    if (!entity) {
      throw new NotFoundError("Entity not found");
    }
    return super.softRemove(entity, options);
  }

  @Action({ restVerb: "PATCH" })
  static async softRemoveMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "body" })
    entityIds: (string | number | Date | ObjectId)[],
    @Param({ restFormat: "body" }) options?: SaveOptions
  ): Promise<T[]> {
    const entities: T[] = [];
    for (const id of entityIds) {
      const entity = await this.findOneById(id);
      if (!entity) {
        throw new NotFoundError(`Entity with id ${id} not found`);
      }
      entities.push(entity);
    }
    return super.softRemove(entities, options);
  }

  @Action({ restVerb: "POST" })
  static insert<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "body" })
    entity: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[]
  ): Promise<InsertResult> {
    return super.insert(entity);
  }

  @Action({ restVerb: "PATCH" })
  static async update<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "body" }) criteria: FindOptionsWhere<T>,
    @Param({ restFormat: "body" }) partialEntity: QueryDeepPartialEntity<T>
  ): Promise<UpdateResult> {
    return super.update(criteria, partialEntity);
  }

  @Action({ restVerb: "PATCH" })
  static async updateById<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "path" }) id: string | number | Date | ObjectId,
    @Param({ restFormat: "body" }) partialEntity: QueryDeepPartialEntity<T>
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
    @Param({ restFormat: "body" }) criteria: FindOptionsWhere<T>[],
    @Param({ restFormat: "body" }) partialEntities: QueryDeepPartialEntity<T>[]
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
    @Param({ restFormat: "body" })
    criteria: string | number | Date | ObjectId | FindOptionsWhere<T>
  ): Promise<DeleteResult> {
    return super.delete(criteria);
  }

  @Action({ restVerb: "DELETE" })
  static async deleteMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "body" })
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
    @Param({ restFormat: "path" }) id: string | number | Date | ObjectId
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
    @Param({ restFormat: "body" }) ids: (string | number | Date | ObjectId)[]
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
    @Param({ restFormat: "body" })
    entityOrEntities: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[],
    @Param({ restFormat: "body" })
    conflictPathsOrOptions: string[] | UpsertOptions<T>
  ): Promise<InsertResult> {
    return super.upsert(entityOrEntities, conflictPathsOrOptions);
  }

  @Action({ restVerb: "GET" })
  static exists<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "query" }) options?: FindManyOptions<T>
  ): Promise<boolean> {
    return super.exists(options);
  }

  @Action({ restVerb: "GET" })
  static existsBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<boolean> {
    return super.existsBy(where);
  }

  @Action({ restVerb: "GET" })
  static count<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "query" }) options?: FindManyOptions<T>
  ): Promise<number> {
    return super.count(options);
  }

  @Action({ restVerb: "GET" })
  static countBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<number> {
    return super.countBy(where);
  }

  @Action({ restVerb: "GET" })
  static sum<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "path" }) columnName: PickKeysByType<T, number>,
    @Param({ restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<number | null> {
    return super.sum(columnName, where);
  }

  @Action({ restVerb: "GET" })
  static average<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "path" }) columnName: PickKeysByType<T, number>,
    @Param({ restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<number | null> {
    return super.average(columnName, where);
  }

  @Action({ restVerb: "GET" })
  static minimum<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "path" }) columnName: PickKeysByType<T, number>,
    @Param({ restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<number | null> {
    return super.minimum(columnName, where);
  }

  @Action({ restVerb: "GET" })
  static maximum<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "path" }) columnName: PickKeysByType<T, number>,
    @Param({ restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<number | null> {
    return super.maximum(columnName, where);
  }

  @Action({ restVerb: "GET" })
  static find<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "query" }) options?: FindManyOptions<T>
  ): Promise<T[]> {
    return super.find(options as FindManyOptions<BaseEntity>);
  }

  @Action({ restVerb: "GET" })
  static findBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<T[]> {
    return super.findBy(where);
  }

  @Action({ restVerb: "GET" })
  static findAndCount<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "query" }) options?: FindManyOptions<T>
  ): Promise<[T[], number]> {
    return super.findAndCount(options);
  }

  @Action({ restVerb: "GET" })
  static findAndCountBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<[T[], number]> {
    return super.findAndCountBy(where);
  }

  @Action({ restVerb: "GET" })
  static findByIds<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "query" }) ids: any[]
  ): Promise<T[]> {
    return super.findByIds(ids);
  }

  @Action({ restVerb: "GET" })
  static async findOne<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "query" }) options: FindOneOptions<T>
  ): Promise<T | null> {
    try {
      return await super.findOne(options);
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }
  @Action({ restVerb: "GET" })
  static async findOneBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<T | null> {
    try {
      return await super.findOneBy(where);
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @Action({ restVerb: "GET" })
  static async findOneById<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "path" }) id: string | number | Date | ObjectId
  ): Promise<T | null> {
    try {
      return await super.findOneById(id);
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @Action({ restVerb: "GET" })
  static async findOneOrFail<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "query" }) options: FindOneOptions<T>
  ): Promise<T> {
    try {
      return await super.findOneOrFail(options);
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @Action({ restVerb: "GET" })
  static async findOneByOrFail<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "query" }) where: FindOptionsWhere<T>
  ): Promise<T> {
    try {
      return await super.findOneByOrFail(where);
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @Action({ restVerb: "POST" })
  static query<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Param({ restFormat: "body" }) query: string,
    @Param({ restFormat: "body" }) parameters?: any[]
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
