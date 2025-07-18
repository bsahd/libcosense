import { assertEquals } from "jsr:@std/assert";
import * as libcosense from "../mod.ts";
import { Hono } from "jsr:@hono/hono";
const app = new Hono();
app.get("/projects/test", (c) => {
  return c.json({
    id: "Test",
    name: "test",
    displayName: "テスト",
    publicVisible: true,
    loginStrategies: [],
    theme: "default",
    gyazoTeamsName: null,
    image: null,
    translation: true,
    infobox: true,
    created: 1594826126,
    updated: 1741928546,
    isMember: false,
  });
});
app.get("/pages/test/bsahd", (c) => {
  return c.json({ test: "test" });
});
const c = new libcosense.CosenseClient({
  alternativeFetch: app.fetch,
  urlbase: "http://localhost/",
});
const a = await c.getProject("test");
console.log(a);

assertEquals(a.id, "Test");
assertEquals(a.name, "test");
assertEquals(a.displayName, "テスト");
assertEquals(a.publicVisible, true);
assertEquals(a.loginStrategies, []);
assertEquals(a.theme, "default");
assertEquals(a.gyazoTeamsName, null);
assertEquals(a.image, null);
assertEquals(a.translation, true);
assertEquals(a.infobox, true);
assertEquals(a.created, 1594826126);
assertEquals(a.updated, 1741928546);
assertEquals(a.isMember, false);
assertEquals(a.plan, undefined);

a.getPage("bsahd");
