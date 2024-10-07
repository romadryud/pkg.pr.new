import { createMiddleware } from "@mswjs/http-middleware";
import { http, HttpResponse } from "msw";

const mswMiddleware = createMiddleware(
  http.all("*", () => {
    console.log("hello");
    return HttpResponse.json({ firstName: "John" });
  }),
);

export default defineEventHandler(async (event) => {
  console.log("siemanko");
  return new Promise((resolve) => {
    console.log("hello from worker ");
    // mswMiddleware(event.node.req, event.node.res, resolve);
  });
});
