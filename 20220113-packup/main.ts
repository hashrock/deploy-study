import { serve, serveStatic, json } from "https://deno.land/x/sift@0.4.2/mod.ts";
import { sum } from "./share/math.ts";

serve({
  "/": serveStatic("./dist/index.html", {
    baseUrl: import.meta.url,
  }),
  "/api": () => json({sum: sum(1, 2)}),
  "/:filename+": serveStatic("./dist", {
    baseUrl: import.meta.url,
  }),
  404: (_request) => new Response("Custom 404"),
});