import type Context from "@tensaco/type-server/context";
import type { ValOrPred, ClassType } from "@tensaco/type-server/utils/types";
import {
  BaseEntity,
  DeleteResult,
  ObjectId,
  UpdateResult,
  type DeepPartial,
  type FindManyOptions,
  type FindOneOptions,
  type FindOptionsWhere,
  type RemoveOptions,
  type SaveOptions,
} from "typeorm";
import {
  DefineMetadata,
  ConditionalMethodDecorator,
  DropMethod,
} from "@tensaco/type-server/utils/decorators";
import {
  isStaticMethod,
  isInstanceMethod,
} from "@tensaco/type-server/utils/typescript";
import type {
  CreatePermissionProps,
  DeletePermissionProps,
  ReadPermissionProps,
  UpdatePermissionProps,
} from "@tensaco/type-server/permissions";
import { typeGQL, typeORM } from "@tensaco/type-server/deps";
import type { PickKeysByType } from "typeorm/common/PickKeysByType.js";
import type { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity.js";
import { StaticMethod } from "@tensaco/type-server/methods";
import { Body, Path, Query } from "tsoa";

export class Model<T extends BaseEntity = BaseEntity>
  extends BaseEntity
  implements ModelInDB<T>
{
  @typeGQL.Field()
  @typeORM.PrimaryGeneratedColumn("uuid")
  id!: number;

  @StaticMethod({ method: "POST" })
  static create<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Body() entityLike: DeepPartial<T>
  ): T {
    return super.create(entityLike);
  }

  @StaticMethod({ method: "POST" })
  static createMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Body() entityLikeArray: DeepPartial<T>[]
  ): T[] {
    return super.create(entityLikeArray);
  }

  @StaticMethod({ method: "POST" })
  static async merge<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Path() mergeIntoEntityId: string | number | Date | ObjectId,
    @Body() ...entityLikes: DeepPartial<T>[]
  ): Promise<T> {
    const entity = await this.findOneById(mergeIntoEntityId);
    if (!entity) {
      throw new NotFoundError("Entity not found");
    }
    return super.merge(entity, ...entityLikes);
  }

  @StaticMethod({ method: "GET" })
  static async preload<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Body() entityLike: DeepPartial<T>
  ): Promise<T | undefined> {
    try {
      return await super.preload(entityLike);
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @StaticMethod({ method: "POST" })
  static save<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Body() entity: DeepPartial<T>,
    @Query() options?: SaveOptions
  ): Promise<T> {
    return super.save(entity, options);
  }

  @StaticMethod({ method: "POST" })
  static saveMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Body() entities: DeepPartial<T>[],
    @Query() options?: SaveOptions
  ): Promise<T[]> {
    return super.save(entities, options);
  }

  @StaticMethod({ method: "DELETE" })
  static async remove<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Path() entityId: string | number | Date | ObjectId,
    @Query() options?: RemoveOptions
  ): Promise<T> {
    const entity = await this.findOneById(entityId);
    if (!entity) {
      throw new NotFoundError("Entity not found");
    }
    return super.remove(entity, options);
  }

  @StaticMethod({ method: "DELETE" })
  static async removeMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Body() entityIds: (string | number | Date | ObjectId)[],
    @Query() options?: RemoveOptions
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

  @StaticMethod({ method: "PATCH" })
  static async softRemove<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Path() entityId: string | number | Date | ObjectId,
    @Query() options?: SaveOptions
  ): Promise<T> {
    const entity = await this.findOneById(entityId);
    if (!entity) {
      throw new NotFoundError("Entity not found");
    }
    return super.softRemove(entity, options);
  }

  @StaticMethod({ method: "PATCH" })
  static async softRemoveMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Body() entityIds: (string | number | Date | ObjectId)[],
    @Query() options?: SaveOptions
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

  @StaticMethod({ method: "POST" })
  static insert<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Body() entity: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[]
  ): Promise<InsertResult> {
    return super.insert(entity);
  }

  @StaticMethod({ method: "PATCH" })
  static async update<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() criteria: FindOptionsWhere<T>,
    @Body() partialEntity: QueryDeepPartialEntity<T>
  ): Promise<UpdateResult> {
    return super.update(criteria, partialEntity);
  }

  @StaticMethod({ method: "PATCH" })
  static async updateById<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Path() id: string | number | Date | ObjectId,
    @Body() partialEntity: QueryDeepPartialEntity<T>
  ): Promise<UpdateResult> {
    const entity = await this.findOneById(id);
    if (!entity) {
      throw new NotFoundError("Entity not found");
    }
    return super.update(id, partialEntity);
  }

  @StaticMethod({ method: "PATCH" })
  static async updateMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() criteria: FindOptionsWhere<T>[],
    @Body() partialEntities: QueryDeepPartialEntity<T>[]
  ): Promise<UpdateResult[]> {
    const results: UpdateResult[] = [];
    for (let i = 0; i < criteria.length; i++) {
      results.push(await super.update(criteria[i], partialEntities[i]));
    }
    return results;
  }

  @StaticMethod({ method: "DELETE" })
  static async delete<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() criteria: string | number | Date | ObjectId | FindOptionsWhere<T>
  ): Promise<DeleteResult> {
    return super.delete(criteria);
  }

  @StaticMethod({ method: "DELETE" })
  static async deleteMultiple<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Body()
    criteria: (string | number | Date | ObjectId | FindOptionsWhere<T>)[]
  ): Promise<DeleteResult[]> {
    const results: DeleteResult[] = [];
    for (const criterion of criteria) {
      results.push(await super.delete(criterion));
    }
    return results;
  }

  @StaticMethod({ method: "DELETE" })
  static async deleteById<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Path() id: string | number | Date | ObjectId
  ): Promise<DeleteResult> {
    const entity = await this.findOneById(id);
    if (!entity) {
      throw new NotFoundError("Entity not found");
    }
    return super.delete(id);
  }

  @StaticMethod({ method: "DELETE" })
  static async deleteByIds<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Body() ids: (string | number | Date | ObjectId)[]
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

  @StaticMethod({ method: "POST" })
  static upsert<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Body()
    entityOrEntities: QueryDeepPartialEntity<T> | QueryDeepPartialEntity<T>[],
    @Query() conflictPathsOrOptions: string[] | UpsertOptions<T>
  ): Promise<InsertResult> {
    return super.upsert(entityOrEntities, conflictPathsOrOptions);
  }

  @StaticMethod({ method: "GET" })
  static exists<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() options?: FindManyOptions<T>
  ): Promise<boolean> {
    return super.exists(options);
  }

  @StaticMethod({ method: "GET" })
  static existsBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() where: FindOptionsWhere<T>
  ): Promise<boolean> {
    return super.existsBy(where);
  }

  @StaticMethod({ method: "GET" })
  static count<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() options?: FindManyOptions<T>
  ): Promise<number> {
    return super.count(options);
  }

  @StaticMethod({ method: "GET" })
  static countBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() where: FindOptionsWhere<T>
  ): Promise<number> {
    return super.countBy(where);
  }

  @StaticMethod({ method: "GET" })
  static sum<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Path() columnName: PickKeysByType<T, number>,
    @Query() where: FindOptionsWhere<T>
  ): Promise<number | null> {
    return super.sum(columnName, where);
  }

  @StaticMethod({ method: "GET" })
  static average<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Path() columnName: PickKeysByType<T, number>,
    @Query() where: FindOptionsWhere<T>
  ): Promise<number | null> {
    return super.average(columnName, where);
  }

  @StaticMethod({ method: "GET" })
  static minimum<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Path() columnName: PickKeysByType<T, number>,
    @Query() where: FindOptionsWhere<T>
  ): Promise<number | null> {
    return super.minimum(columnName, where);
  }

  @StaticMethod({ method: "GET" })
  static maximum<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Path() columnName: PickKeysByType<T, number>,
    @Query() where: FindOptionsWhere<T>
  ): Promise<number | null> {
    return super.maximum(columnName, where);
  }

  @StaticMethod({ method: "GET" })
  static find<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() options?: FindManyOptions<T>
  ): Promise<T[]> {
    return super.find(options);
  }

  @StaticMethod({ method: "GET" })
  static findBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() where: FindOptionsWhere<T>
  ): Promise<T[]> {
    return super.findBy(where);
  }

  @StaticMethod({ method: "GET" })
  static findAndCount<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() options?: FindManyOptions<T>
  ): Promise<[T[], number]> {
    return super.findAndCount(options);
  }

  @StaticMethod({ method: "GET" })
  static findAndCountBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() where: FindOptionsWhere<T>
  ): Promise<[T[], number]> {
    return super.findAndCountBy(where);
  }

  @StaticMethod({ method: "GET" })
  static findByIds<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() ids: any[]
  ): Promise<T[]> {
    return super.findByIds(ids);
  }

  @StaticMethod({ method: "GET" })
  static async findOne<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() options: FindOneOptions<T>
  ): Promise<T | null> {
    try {
      return await super.findOne(options);
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @StaticMethod({ method: "GET" })
  static async findOneBy<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() where: FindOptionsWhere<T>
  ): Promise<T | null> {
    try {
      return await super.findOneBy(where);
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @StaticMethod({ method: "GET" })
  static async findOneById<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Path() id: string | number | Date | ObjectId
  ): Promise<T | null> {
    try {
      return await super.findOneById(id);
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @StaticMethod({ method: "GET" })
  static async findOneOrFail<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() options: FindOneOptions<T>
  ): Promise<T> {
    try {
      return await super.findOneOrFail(options);
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @StaticMethod({ method: "GET" })
  static async findOneByOrFail<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Query() where: FindOptionsWhere<T>
  ): Promise<T> {
    try {
      return await super.findOneByOrFail(where);
    } catch (error) {
      throw new NotFoundError("Entity not found");
    }
  }

  @StaticMethod({ method: "GET" })
  static query<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity,
    @Body() query: string,
    @Query() parameters?: any[]
  ): Promise<any> {
    return super.query(query, parameters);
  }

  @StaticMethod({ method: "DELETE" })
  static clear<T extends BaseEntity>(
    this: { new (): T } & typeof BaseEntity
  ): Promise<void> {
    return super.clear();
  }
}
