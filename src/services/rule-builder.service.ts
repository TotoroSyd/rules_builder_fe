// services/rule-builder.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  RuleGroup, Condition, Contact, SavedRule,
  OPERATOR_MAP, FieldType, ConditionOperator,
  Rule
} from '../models/audience-rule.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class RuleBuilderService {
  constructor(private api: ApiService) {
    this.api.getRules().subscribe({
      next: rules => this.savedRules$$.next(rules),
      error: err => console.error('[RuleBuilderService] failed to load saved rules:', err)
    });
  }
  private groupCounter = 0;
  private conditionCounter = 0;

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

  searchContacts(): void {
    const rule = this.summarizeGroup(this.rootGroup$$.value);
    if (!this.hasFilledCondition(rule)) {
      this.matchingContacts$$.next([]);
      return;
    }
    this.searching$$.next(true);
    this.api.getContacts(rule).pipe(
      catchError(err => {
        console.error('[searchContacts] API error:', err);
        return of([]);
      })
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
        { id: ++this.conditionCounter, field: 'country', operator: 'is', value: 'US' },
        { id: ++this.conditionCounter, field: 'plan', operator: 'is', value: 'pro' },
      ],
      groups: []
    };

    const sub: RuleGroup = {
      id: ++this.groupCounter,
      logic: 'OR',
      conditions: [
        { id: ++this.conditionCounter, field: 'purchaseCount', operator: 'greater-than',   value: '10' },
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

  // ── Save Rule (simulated async via RxJS timer) ──

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
    // Deep clone so the previous BehaviorSubject emission is a true snapshot.
    // A shallow spread shares condition/group references — in-place mutations
    // would make JSON.stringify(prev) === JSON.stringify(next) inside
    // distinctUntilChanged, suppressing the emission entirely.
    this.rootGroup$$.next(structuredClone(this.rootGroup$$.value));
  }

  private hasFilledCondition(rule: Rule): boolean {
    if (rule.conditions.some(c => c.value.toString().trim())) return true;
    return (rule.groups ?? []).some(g => this.hasFilledCondition(g));
  }

  private summarizeGroup(group: RuleGroup): Rule {
    if (!group) {
      console.warn('Attempted to summarize undefined group');
      return { logic: 'AND', conditions: [] };
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
