# Changelog

## [Unreleased] – 2026-02-25

### Added

- **`src/environments/environment.ts`** — new file; holds `developBaseUrl`, `localBaseUrl`, and `authToken` so API config is centralised and not scattered across service files
- **`src/services/api.service.ts`** — new file; thin Axios wrapper (`timeout: 10s`, `Authorization` header injected automatically) exposing three methods as RxJS Observables:
  - `getContacts(rule)` — `POST /evaluate` → returns matching `Contact[]`
  - `getRules()` — `GET /rules` → returns `SavedRule[]`
  - `saveRule(payload)` — `POST /rules` → returns the persisted `SavedRule`

### Changed

- **`src/models/audience-rule.model.ts`**
  - `ConditionOperator` updated to match backend operator strings
  - `Contact.id` changed from `number` to `string` (backend returns string IDs)
  - `SavedRule.id` changed from `number` to `string` (backend returns UUIDs)
  - `SavedRule` shape updated to `{ id, name, description?, rule, created_at }` to match backend response
  - `Rule` interface extended with `groups?: Rule[]` to support nested rule groups
  - `OPERATOR_MAP` updated to match new `ConditionOperator` values

- **`src/services/rule-builder.service.ts`**
  - Wired `ApiService` — all HTTP calls now go through it
  - `matchingContacts$` replaced placeholder `map(() => [])` with `switchMap` → `api.getContacts()`; debounced at 150ms; skips API call when no conditions have values; falls back to `[]` on error
  - `matchingContacts$` guard and payload now use `summarizeGroup()` so nested sub-group conditions are included in the evaluation, not just root-level conditions
  - `hasActiveConditions()` added — recursively checks the full rule tree for any filled condition before firing the API call
  - `saveRule()` fixed: was subscribing internally and returning `void` (TypeScript error + runtime broken); now returns the Observable with side effects in `tap` so the caller can subscribe
  - `summarizeGroup()` now recurses into `group.groups` so nested groups are included in the saved payload; return type changed from `string` to `Rule`
  - `emit()` changed from shallow spread `{ ...value }` to `structuredClone(value)` — fixes a bug where in-place mutations made `distinctUntilChanged` think nothing had changed, silently suppressing API calls
  - `savedRules$$` seeded on init via `api.getRules()` so saved rules survive page refresh
  - Default group conditions updated to valid backend operator strings
  - `trackByContactId` return type corrected to `string`
  - `trackBySavedRuleId` return type corrected to `string`
  - Removed dead `evaluateGroup()` / `evaluateCondition()` methods (local evaluation replaced by backend)
  - Added `console.debug` logging throughout `matchingContacts$` pipeline for debugging

- **`src/components/rule-group/rule-group.component.html`**
  - `svc.removeCondition(group, cond.id)` → `cond.id!` to resolve TypeScript error from optional `id` field

- **`src/components/saved-rules/saved-rules.component.ts`**
  - Added `formatRule(rule)` method — recursively formats a `Rule` into a human-readable string e.g. `(country is US AND (purchaseCount greater-than 3 OR plan is pro))`

- **`src/components/saved-rules/saved-rules.component.html`**
  - Replaced raw `logic / conditions count` display with `{{ rule.name }} {{ formatRule(rule.rule) }}`

### Fixed

- `saveRule()` in `RuleBuilderService` — was not returning the Observable (TypeScript error `[2355]`); API call never fired
- `matchingContacts$` — `distinctUntilChanged` was silently suppressing all emissions after in-place mutations due to shallow `emit()` clone; fixed with `structuredClone`
- `matchingContacts$` — only root conditions were evaluated; nested sub-group conditions now included

---

## [Unreleased] – 2026-02-24

### Changed

- **Completed Angular 19 refactor** — the vanilla JS prototype in `index.html` has been replaced by a fully functional Angular standalone-component application.

#### Details

| File | What changed |
|---|---|
| `index.html` | Stripped out the entire vanilla JS app; now only contains the `<app-root>` mount point used by Angular's build pipeline |
| `src/components/rule-group/rule-group.component.ts` | Moved inline `template` to an external `templateUrl`; added `RuleGroupComponent` to its own `imports[]` to enable recursive rendering of nested groups |
| `src/components/rule-group/rule-group.component.html` | Created with the template previously embedded in the `.ts` file (no logic changes) |
| `src/results-display/results-display.component.ts` | Replaced empty shell with a proper standalone component: `@Input() contacts`, `RuleBuilderService` injection, `CommonModule`, and `OnPush` change detection |
| `src/results-display/results-display.component.html` | Fixed broken `vm.matchingContacts` references → `contacts`; removed stray test text |
| `src/components/app.component.ts` | Imported `ResultsDisplayComponent`, added it to `imports[]`, and wired `<app-results-display [contacts]="vm.matchingContacts" />` into the template |
