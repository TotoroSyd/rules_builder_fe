// services/rule-builder.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, skip, switchMap, take, tap } from 'rxjs/operators';
import {
  RuleGroup, Condition, Contact, SavedRule,
  OPERATOR_MAP, FieldType, ConditionOperator,
  Rule,
  COUNTRIES
} from '../models/audience-rule.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class RuleBuilderService {
  constructor(private api: ApiService) {
    // when subscribe, good habit to clean up with take(1) or takeUntil and onDestroy to prevent memory leaks
    this.api.getRules().pipe(take(1)).subscribe({
      next: rules => this.savedRules$$.next(rules),
      error: err => console.error('[RuleBuilderService] failed to load saved rules:', err)
    });

    this.rootGroup$$.pipe(
      // skip(1),
      debounceTime(this.defaultDeounceTime),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      switchMap(group => {
        const rule = this.summarizeGroup(group);
        // no condition, no API call
        if (!this.hasFilledCondition(rule)) {
          this.matchingContacts$$.next([]);
          return EMPTY;
        }
        // if there are conditions (at least 1), call API
        this.searching$$.next(true);
        console.log('[liveSearch] firing API call with rule:', rule); 
        return this.api.getContacts(rule).pipe(
          catchError(err => {
            console.error('[liveSearch] API error:', err);
            return of([]);
          }),
          tap(() => this.searching$$.next(false))
        );
      }) 
      // dont use take 1 here eventhough its api call. because we want to keep listening
      // no need to hanlde unsubscription here because this is a service that lives for the entire app lifecycle (inject in root)
    ).subscribe(contacts => this.matchingContacts$$.next(contacts));
  }

  private groupCounter = 0;
  private conditionCounter = 0;
  private defaultDeounceTime = 300; // milliseconds

  // Core state as BehaviorSubjects (Angular's equivalent to component state)
  private readonly rootGroup$$ = new BehaviorSubject<RuleGroup>(this.createDefaultGroup());
  private readonly savedRules$$ = new BehaviorSubject<SavedRule[]>([]);
  private readonly saving$$ = new BehaviorSubject<boolean>(false);
  private readonly matchingContacts$$ = new BehaviorSubject<Contact[]>([]);
  private readonly searching$$ = new BehaviorSubject<boolean>(false);

  // Public Observables — consumed via async pipe in templates
  readonly rootGroup$: Observable<RuleGroup> = this.rootGroup$$.asObservable();
  readonly savedRules$: Observable<SavedRule[]> = this.savedRules$$.asObservable();
  readonly saving$: Observable<boolean> = this.saving$$.asObservable();
  readonly matchingContacts$: Observable<Contact[]> = this.matchingContacts$$.asObservable();
  readonly searching$: Observable<boolean> = this.searching$$.asObservable();

  searchContacts(input: RuleGroup): void {
    // const rule = this.summarizeGroup(this.rootGroup$$.value);
    const rule = this.summarizeGroup(input);
    // no condition, no API call
    if (!this.hasFilledCondition(rule)) {
      this.matchingContacts$$.next([]);
      return;
    }
    // if there are conditions (at least 1), call API
    this.searching$$.next(true);
    this.api.getContacts(rule).pipe(
      catchError(err => {
        console.error('[searchContacts] API error:', err);
        return of([]);
      }),
      take(1) // good habit cleaning up the subscription
    ).subscribe(contacts => {
      this.matchingContacts$$.next(contacts);
      this.searching$$.next(false);
    });
  }

  // ── Factory Methods ──────────────────────────────────────────────────────

  newCondition(): Condition {
    return {
      id: ++this.conditionCounter,
      field: 'country',
      operator: OPERATOR_MAP['country'][0],
      value: ''
    };
  }

  newGroup(): RuleGroup {
    return {
      id: ++this.groupCounter,
      logic: 'AND',
      conditions: [this.newCondition()],
      groups: []
    };
  }

  private createDefaultGroup(): RuleGroup {
    const root: RuleGroup = {
      id: ++this.groupCounter,
      logic: 'AND',
      conditions: [
        { id: ++this.conditionCounter, field: 'country', operator: 'is', value: 'United States' },
        { id: ++this.conditionCounter, field: 'plan', operator: 'is', value: 'free' },
      ],
      groups: []
    };

    const sub: RuleGroup = {
      id: ++this.groupCounter,
      logic: 'OR',
      conditions: [
        { id: ++this.conditionCounter, field: 'purchaseCount', operator: 'greater-than',   value: '3' },
      ],
      groups: []
    };
    root.groups = [sub];
    return root;
  }

  // ── Mutations — always emit a new reference to trigger change detection ──

  setLogic(group: RuleGroup, logic: 'AND' | 'OR'): void {
    group.logic = logic;
    this.emit();
  }

  addCondition(group: RuleGroup): void {
    group.conditions = [...group.conditions, this.newCondition()];
    this.emit();
  }

  removeCondition(group: RuleGroup, conditionId: number): void {
    if (group.conditions.length <= 1) return;
    group.conditions = group.conditions.filter(c => c.id !== conditionId);
    this.emit();
  }

  updateConditionField(cond: Condition, field: FieldType): void {
    cond.field = field;
    cond.operator = OPERATOR_MAP[field][0];
    cond.value = '';
    this.emit();
  }

  updateConditionOperator(cond: Condition, operator: ConditionOperator): void {
    cond.operator = operator;
    this.emit();
  }

  updateConditionValue(cond: Condition, value: string): void {
    cond.value = value;
    this.emit();
  }

  addGroup(parent: RuleGroup): void {
    parent.groups = [...parent.groups, this.newGroup()];
    this.emit();
  }

  removeGroup(parent: RuleGroup, groupId: number): void {
    parent.groups = parent.groups.filter(g => g.id !== groupId);
    this.emit();
  }

  // ── Save Rule ──

  saveRule(): Observable<SavedRule> {
    this.saving$$.next(true);
    const group = this.rootGroup$$.value;
    return this.api.saveRule({
      name: `Rule #${this.savedRules$$.value.length + 1}`,
      description: 'Saved from RuleBuilderService',
      rule: this.summarizeGroup(group)
    }).pipe(
      tap({
        next: (saved) => {
          this.savedRules$$.next([saved, ...this.savedRules$$.value]);
          this.saving$$.next(false);
        },
        error: (err) => {
          console.error('Failed to save rule:', err);
          this.saving$$.next(false);
        }
      })
    );
  }

  // ── Private Helpers ──────────────────────────────────────────────────────

  private emit(): void {
    // Ensure nested groups are properly merged into root before emitting
    this.rootGroup$$.next(structuredClone(this.rootGroup$$.value));
  }

  private hasFilledCondition(rule: Rule): boolean {
    if (rule.conditions.some(c => c.value.toString().trim())) return true;
    return (rule.groups ?? []).some(g => this.hasFilledCondition(g));
  }
  private convertCountryNameToCode(countryName: string): string {
    const country = COUNTRIES.find(c => c.name === countryName);
    return country ? country.code : countryName;
  }

  private summarizeGroup(group: RuleGroup): Rule {
    if (!group) {
      console.error('Attempted to summarize undefined group');
      return { logic: 'AND', conditions: [] };
    }
    try {
      if (group.conditions.some(c => c.field === 'country')) {
        group.conditions.forEach(c => {
          if (c.field === 'country') {
            c.value = this.convertCountryNameToCode(c.value);
          }
        });
      }

      return {
        logic: group.logic,
        conditions: group.conditions.map(c => ({
          field: c.field,
          operator: c.operator,
          value: c.value
        })),
        groups: group.groups.map(g => this.summarizeGroup(g))
      };
    } catch (err) {
      console.error('Error summarizing group:', err);
      return { logic: 'AND', conditions: [] };
    }
  }

  // ── TrackBy Functions (used in templates) ────────────────────────────────

  trackByConditionId(_: number, cond: Condition): number {
    return cond.id ?? 0;
  }

  trackByGroupId(_: number, group: RuleGroup): number {
    return group.id;
  }

  trackByContactId(_: number, contact: Contact): string {
    return contact.id;
  }

  trackBySavedRuleId(_: number, rule: SavedRule): string {
    return rule.id;
  }
}
