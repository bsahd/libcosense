[日本語版](CONTRIBUTING.ja.md)

## 1. How to contribute to the project

### Reporting a bug

If you find a bug, please create a new ticket in [issue](https://github.com/bsahd/libcosense/issues). Providing the following information will help us solve your problem faster:

- Detailed description of the bug
- Steps to reproduce (if possible)
- Expected results
- Actual results
- Environment used (OS, browser version, etc.)

### Feature requests

If you have suggestions for new features or improvements, please also submit them in [issue](https://github.com/bsahd/libcosense/issues). Your suggestions will be discussed and prioritized.

## 2. Contributing to development

### 1. Forking and cloning

1. Fork this repository.

2. Clone the repository to your local environment.

### 2. Creating a new branch

Before making any changes, create a new branch. The branch name should describe what you are working on (e.g. `fix-bug`, `add-new-feature`).

```bash
git checkout -b new-feature
```

### 3. Commit your changes

When you are done with your changes, create a commit with the following steps.

```bash
git add .
git commit -m "description"
```

In the commit message, briefly describe what you fixed and how.

### 4. Push

When you are done, push your changes to your fork.

```bash
git push origin new-feature
```

### 5. Create a pull request

Create a pull request from the "bsahd/libcosense" repository page on GitHub. In the description, include the changes you made, the fixes you made, and details of any issues.

## 3. Coding conventions

- Use deno fmt to format your code.
- Tab indentation and tab width are set to 4 columns by `deno.json`.
- Use TSDoc to explain each symbol so that the intent of the code is clear.
- Use meaningful names for functions and variables.

## 4. Testing

```bash
deno run test.js
```

- If you add a function, please reflect it in the tests.
- Test coverage is still low, so contributions to improve the tests are also welcome.

# Japanese
