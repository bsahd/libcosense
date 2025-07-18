# libcosense

objective cosense rest wrapper

[![JSR Version](https://img.shields.io/jsr/v/%40bsahd/libcosense?logo=jsr&color=yellow)](https://jsr.io/@bsahd/libcosense)
[![GitHub contributors](https://img.shields.io/github/contributors-anon/bsahd/libcosense)](https://github.com/bsahd/libcosense/graphs/contributors)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/bsahd/libcosense)](https://github.com/bsahd/libcosense/graphs/commit-activity)
[![GitHub License](https://img.shields.io/github/license/bsahd/libcosense)](https://github.com/bsahd/libcosense/blob/main/LICENSE)
[![GitHub forks](https://img.shields.io/github/forks/bsahd/libcosense)](https://github.com/bsahd/libcosense/forks)
[![GitHub Issues](https://img.shields.io/github/issues/bsahd/libcosense)](https://github.com/bsahd/libcosense/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/bsahd/libcosense)](https://github.com/bsahd/libcosense/pulls)
![GitHub Created At](https://img.shields.io/github/created-at/bsahd/libcosense)

# installation

1. add dependency
   - on **Deno**-based project: `deno add jsr:@bsahd/libcosense`
   - npm is not supported
2. importing in source-code
   ```ts
   import * as libcosense from "@bsahd/libcosense";
   ```

# examples

## Get page

```ts
import * as libcosense from "jsr:@bsahd/libcosense";
const cosense = new libcosense.CosenseClient();
const pj = cosense.getProject("<Project name>");
pj.getPage("<Page name>");
```

## Process all pages

```ts
import * as libcosense from "jsr:@bsahd/libcosense";
const cosense = new libcosense.CosenseClient();
const pj = cosense.getProject("<Project name>");
for await (const item of pj.pageList()) {
  const page = await item.getDetail();
  console.log(page);
}
```
