import { assertEquals } from "jsr:@std/assert";
import * as libcosense from "./mod.ts";
function alternativeFetch(a) {
    console.log(a);
    if (a == "projects/test") {
        return Promise.resolve(
            new Response(
                JSON.stringify({
                    "id": "Test",
                    "name": "test",
                    "displayName": "テスト",
                    "publicVisible": true,
                    "loginStrategies": [],
                    "theme": "default",
                    "gyazoTeamsName": null,
                    "image": null,
                    "translation": true,
                    "infobox": true,
                    "created": 1594826126,
                    "updated": 1741928546,
                    "isMember": false,
                }),
                { statusText: "200 OK", status: 200 },
            ),
        );
    }
    return Promise.resolve(new Response("",{status:404}))
}
const c = libcosense.CosenseClient.new({
	alternativeFetch,
	urlbase: "",
})
const a = await c.getProject("test");
console.log(a);

assertEquals(a.id,"Test")
assertEquals(a.name,"test")
assertEquals(a.displayName,"テスト")
assertEquals(a.publicVisible,true)
assertEquals(a.loginStrategies,[])
assertEquals(a.theme,"default")
assertEquals(a.gyazoTeamsName,null)
assertEquals(a.image,null)
assertEquals(a.translation,true)
assertEquals(a.infobox,true)
assertEquals(a.created,1594826126)
assertEquals(a.updated,1741928546)
assertEquals(a.isMember,false)
assertEquals(a.plan,undefined)

a.getPage("bsahd")