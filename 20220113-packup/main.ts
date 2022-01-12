import { serve, serveStatic, json } from "https://deno.land/x/sift@0.4.2/mod.ts";
import { sum } from "./share/math.ts";

async function proxy(request: Request, params: any) {
  const filename: string = params.filename
  const req = await fetch("http://localhost:1234/" + filename)
  const body = await req.text()
  return new Response(body, {
    headers: req.headers,
  })
}

serve({
  "/": serveStatic("./dist/index.html", {
    baseUrl: import.meta.url,
  }),
  "/api": () => json({sum: sum(1, 2)}),
  "/proxy/:filename+": proxy,
  "/:filename+": serveStatic("./dist", {
    baseUrl: import.meta.url,
  }),
  404: (_request) => new Response("Custom 404"),
});

const listener = Deno.listen({ port: 35729 });
const client = await Deno.connect({
  transport: "tcp",
  hostname: "127.0.0.1",
  port: 35729
});
console.log("listening on 0.0.0.0:35729");
for await (const conn of listener) {
  Deno.copy(conn, client).finally(() => conn.close());
}