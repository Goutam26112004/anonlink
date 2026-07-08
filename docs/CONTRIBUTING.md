# Contributing Guidelines

Thank you for contributing to AnonLink! Follow these standards to maintain high code quality and consistency across our repositories.

---

## 1. Branch Naming Conventions
* **Features**: `feature/short-description` (e.g. `feature/onboarding-wizard`)
* **Fixes**: `bugfix/short-description` (e.g. `bugfix/oauth-redirect`)
* **Hotfixes**: `hotfix/short-description`
* **Docs**: `docs/short-description`

---

## 2. Commit Message Formats
We use semantic commit messages to automatically build changelogs.
Format: `<type>(<scope>): <subject>`

### Types
* `feat`: A new feature
* `fix`: A bug fix
* `docs`: Documentation changes
* `style`: Code formatting changes (Prettier, ESLint, no logic modification)
* `refactor`: Code restructures that do not add features or fix bugs
* `test`: Adding or updating test suites

### Examples
* `feat(matchmaker): add gender preference matching support`
* `fix(auth): resolve google redirect state parameter mismatch`
* `docs(readme): add docker run instructions`

---

## 3. Pull Request Checklist
Before submitting a pull request, ensure:
1. All TypeScript files compile cleanly with zero errors (`npm run build`).
2. ESLint checks pass with no warnings.
3. Automated tests run and pass successfully.
4. Schema migrations are generated using Prisma (`prisma generate`).
5. Related documentation files in `docs/` are updated.
