# libcosense
objective cosense rest wrapper
JSR: https://jsr.io/@bsahd/libcosense
# examples
## Get page
```ts
import * as libcosense from "jsr:@bsahd/libcosense"
const pj = libcosense.Project.new("<Project name>")
pj.getPage("<Page name>")
```
## Process all pages
```ts
import * as libcosense from "jsr:@bsahd/libcosense"
const pj = libcosense.Project.new("<Project name>")
for await (const item of pj.pageList()) {
  const page = await item.getDetail();
  console.log(page)
}
```