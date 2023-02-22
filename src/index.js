import cors from "@fastify/cors";
import Fastify from "fastify";

import { appRoutes } from "./routes.js";

const app = Fastify();

app.register(cors);
app.register(appRoutes);

app
  .listen({
    port: 3000,
  })
  .then(() => {
    console.log("listening on port 3000");
  });