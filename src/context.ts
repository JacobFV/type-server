import { PubSub } from "graphql-subscriptions"; // Import PubSub type
import { typeREST } from "@tensaco/type-server/deps";

export default class ServiceContext extends typeREST.ServiceContext {
  user?: any;
  graphqlPubSub?: PubSub;
}

import { CONTEXT_PARAM_DECORATOR_KEY } from "@tensaco/type-server/methods";
