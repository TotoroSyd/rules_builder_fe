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

### 2. Derived Observable with `debounceTime` + `map`
```ts
readonly matchingContacts$: Observable<Contact[]> = this.rootGroup$$.pipe(
  debounceTime(150),
  map(group => CONTACTS.filter(c => this.evaluateGroup(group, c)))
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
<ng-container *ngIf="vm$ | async as vm">
  {{ vm.matchingContacts.length }} contacts
</ng-container>
```

### 4. `trackBy` on every `*ngFor`
```html
<div *ngFor="let cond of group.conditions; trackBy: svc.trackByConditionId">
<div *ngFor="let contact of vm.matchingContacts; trackBy: svc.trackByContactId">
<div *ngFor="let rule of vm.savedRules; trackBy: svc.trackBySavedRuleId">
```

### 5. Simulated async save with `timer` + `switchMap`
```ts
saveRule(): Observable<SavedRule> {
  return timer(800).pipe(
    switchMap(() => {
      // persist rule...
      return of(rule);
    })
  );
}
```

## Getting Started

```bash
npm install
npm start          # → http://localhost:4200
```

## Features

- ✅ AND / OR toggle per group
- ✅ Nested sub-groups (recursive component)
- ✅ Add / remove conditions and groups dynamically
- ✅ Live contact matching (debounced, reactive)
- ✅ Save rule with async feedback
- ✅ Full Tailwind styling with dark theme
- ✅ `trackBy` on all `*ngFor` lists
- ✅ `async` pipe + `OnPush` throughout
- ✅ Zero manual `subscribe()` in templates

## Preview

Open `index.html` directly in a browser for an instant preview of the UI (vanilla JS/RxJS UMD build, identical visual to the Angular app).
