import typeORM from "typeorm";
import typeREST from "typescript-rest";
import typeGQL from "type-graphql";
import typeServer from "@tensaco/type-server";
import { UnauthorizedError } from "typescript-rest/dist/server/model/errors";

// Utils

enum Privacy {
  Private = "private",
  FriendsOnly = "friends_only",
  Public = "public",
}

function enforcePrivacy(
  entity: HasOwner & HasPrivacy,
  context: typeServer.Context
) {
  switch (entity.privacy) {
    case Privacy.Public:
      return true;
    case Privacy.FriendsOnly:
      return entity.owner.friends.includes(context.owner);
    case Privacy.Private:
      return entity.owner.id === context.owner.id;
    default:
      throw new Error("Invalid privacy");
  }
}

function isOwner(entity: HasOwner, context: typeServer.Context) {
  return entity.owner.id === context.user.id;
}

interface HasPrivacy {
  privacy: Privacy;
}

interface HasOwner {
  owner: User;
}

// Models

abstract class Model extends typeORM.BaseEntity {
  @typeServer.Permissions({ create: false, read: true, update: false })
  @typeGQL.Field()
  @typeORM.PrimaryGeneratedColumn()
  id!: number;

  @typeServer.Permissions({ create: false, read: true, update: false })
  @typeGQL.Field()
  @typeORM.CreateDateColumn()
  createdAt!: Date;

  @typeServer.Permissions({ create: false, read: true, update: false })
  @typeGQL.Field()
  @typeORM.UpdateDateColumn()
  updatedAt!: Date;

  @typeServer.Permissions({ create: false, read: true, update: false })
  @typeGQL.Field()
  @typeORM.DeleteDateColumn()
  deletedAt?: Date;
}

@typeServer.CRUDPermissions({
  create: false,
  read: enforcePrivacy,
  write: isOwner,
  delete: isOwner,
})
@typeGQL.ObjectType()
@typeORM.Entity()
class User extends Model implements HasOwner, HasPrivacy {
  @typeGQL.Field()
  @typeORM.Column()
  name!: string;

  @typeServer.Permissions({ read: typeServer.permissions.isOwner })
  @typeGQL.Field()
  @typeORM.Column()
  email!: string;

  @typeORM.Column()
  hashed_password!: string;

  @typeGQL.Field()
  @typeORM.Column()
  privacy!: Privacy;

  @typeGQL.Field()
  @typeORM.OneToMany(() => Post, (post) => post.owner)
  posts!: Post[];

  @typeGQL.Field()
  @typeORM.ManyToMany(() => User, (user) => user.friends)
  friends!: User[];

  get owner() {
    return this;
  }

  private async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  @typeServer.StaticMethod({})
  @typeServer.Permissions(Not(isAuthenticated))
  static createAccount(
    data: UserRegisterInput,
    @typeServer.Context() context: typeServer.Context
  ) {
    const hashed = await this.hashPassword(data.hashed_password);
    return super.create({ ...data, hashed_password: hashed });
  }

  @typeServer.InstanceMethod({ id: "id" })
  async changePassword(newPassword: string) {
    this.hashed_password = await this.hashPassword(newPassword);
  }

  @typeServer.InstanceMethod({ id: "id" })
  async me(): Promise<User> {
    return this;
  }
}

type UserRegisterInput = { password: string } & Omit<
  User,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "hashed_password"
>; // TODO: i need to make this an InputType

@typeServer.Permissions({
  create: isOwner,
  read: enforcePrivacy,
  write: isOwner,
  delete: isOwner,
})
@typeGQL.ObjectType()
@typeORM.Entity()
class Post extends Model implements HasOwner, HasPrivacy {
  @typeGQL.Field()
  @typeORM.Column()
  name!: string;

  @typeGQL.Field()
  @typeORM.ManyToOne(() => User, (user) => user.posts)
  owner!: User;

  @typeGQL.Field()
  @typeORM.Column()
  privacy!: Privacy;

  @typeGQL.Field()
  @typeORM.Column()
  content!: string;
}

// Resolvers

@typeServer.Service()
@typeGQL.Resolver()
class UserResolver extends typeServer.generateResolverBase(User) {}

@typeGQL.Resolver()
class PostResolver extends typeServer.generateResolverBase(Post) {
  @typeGQL.Query()
  postsByUser(
    @typeGQL.Arg("userId") userId: number,
    @typeGQL.Ctx() context: typeServer.Context
  ) {
    return Post.find({ where: { owner: { id: userId } } });
  }
}

// Controllers

@typeREST.Controller()
class UserController extends typeServer.generateControllerBase(User) {
  @typeREST.GET
  @typeREST.Path("/random")
  async random(@typeREST.Context() context: typeServer.Context) {
    if (context.user) {
      return "Hello, " + context.user.name;
    }
    return "Hello, guest";
  }
}

// App
const server = new typeServer.Server({
  models: [User, Post],
  resolvers: [UserResolver, PostResolver],
  controllers: [UserController],
  graphql: {
    enabled: true,
    mountPath: "graphql",
    playground: true,
    introspection: true,
  },
  rest: {
    enabled: true,
    mountPath: "api",
  },
  express: {
    host: "0.0.0.0",
  },
});

server.useMiddleware(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const user = await User.findOne({ where: { token } });
  if (user) {
    req.user = user;
  }
  next();
});
// optionally, you can also add middleware for graphql and rest
// server.useGraphQLMiddleware(async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   const user = await User.findOne({ where: { token } });
//   if (user) {
//     req.user = user;
//   }
//   next();
// });
// server.useRESTMiddleware(async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   const user = await User.findOne({ where: { token } });
//   if (user) {
//     req.user = user;
//   }
//   next();
// });

server.listen(3000);
