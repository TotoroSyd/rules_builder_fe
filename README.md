# Audience Rules Builder — Angular 19

A fully reactive rule builder matching the Chemist2U wireframe, built with Angular 19, RxJS, Tailwind CSS, and TypeScript.

## Tech Stack

| Technology | Usage |
|------------|-------|
| **Angular 19** | Standalone components, OnPush change detection |
| **RxJS 7** | `BehaviorSubject`, `combineLatest`, `debounceTime`, `switchMap`, `timer`, `Observable` |
| **Async Pipe** | All template data flows through `| async` — no manual subscriptions |
| **trackBy** | All `*ngFor` directives use `trackBy` for efficient DOM updates |
| **Tailwind CSS 3** | Utility classes + `@apply` in CSS; custom token extensions |
| **TypeScript** | Strict typing on all models, services, and components |
s

## Key Angular / RxJS Patterns

### 1. `BehaviorSubject` as Single Source of Truth
```ts
private readonly rootGroup$$ = new BehaviorSubject<RuleGroup>(this.createDefaultGroup());
readonly rootGroup$: Observable<RuleGroup> = this.rootGroup$$.asObservable();
```

~~### 2. Derived Observable with `debounceTime` + `distinctUntilChanged`~~
```ts
readonly matchingContacts$: Observable<Contact[]> = this.rootGroup$$.pipe(
  debounceTime(150),
  distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
);
```

### 3. ViewModel pattern with `combineLatest` + `async` pipe
```ts
// In AppComponent
this.vm$ = combineLatest([
  this.svc.rootGroup$,
  this.svc.matchingContacts$,
  this.svc.savedRules$,
  this.svc.saving$,
]).pipe(
  map(([rootGroup, matchingContacts, savedRules, saving]) => ({
    rootGroup, matchingContacts, savedRules, saving
  }))
);
```

```html
<!-- In template — ONE async pipe, zero manual subscriptions -->
@if (vm$ | async; as vm) {
  <span>{{ vm.matchingContacts.length }} contacts</span>
}
```

### 4. `trackBy` on every `*ngFor`
```html
<div *ngFor="let cond of group.conditions; trackBy: svc.trackByConditionId">
<div *ngFor="let contact of vm.matchingContacts; trackBy: svc.trackByContactId">
<div *ngFor="let rule of vm.savedRules; trackBy: svc.trackBySavedRuleId">
```

## Getting Started

```bash
npm install
npm run build
npm start          # → http://localhost:4200
```

## Features

- ✅ AND / OR toggle per group
- ✅ Nested sub-groups (recursive component)
- ✅ Add / remove conditions and groups dynamically
- ✅ Live contact matching (debounced, reactive)
- ✅ Save rule with async feedback

## To improve
- e2e test
- accessibility
- unit test focuses on rule.buider service 
- better UI indicates Loading
- stricter on input or turn to select for better control
- jwt token generation
- convert rule-group to <form>
