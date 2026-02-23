// services/rule-builder.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, timer, of } from 'rxjs';
import { map, debounceTime, switchMap, distinctUntilChanged } from 'rxjs/operators';
import {
  RuleGroup, Condition, Contact, SavedRule,
  CONTACTS, OPERATOR_MAP, FieldType, ConditionOperator
} from '../models/audience-rule.model';

@Injectable({ providedIn: 'root' })
export class RuleBuilderService {
  private groupCounter = 0;
  private conditionCounter = 0;

  // Core state as BehaviorSubjects (Angular's equivalent to component state)
  private readonly rootGroup$$ = new BehaviorSubject<RuleGroup>(this.createDefaultGroup());
  private readonly savedRules$$ = new BehaviorSubject<SavedRule[]>([]);
  private readonly saving$$ = new BehaviorSubject<boolean>(false);

  // Public Observables — consumed via async pipe in templates
  readonly rootGroup$: Observable<RuleGroup> = this.rootGroup$$.asObservable();
  readonly savedRules$: Observable<SavedRule[]> = this.savedRules$$.asObservable();
  readonly saving$: Observable<boolean> = this.saving$$.asObservable();

  /**
   * matchingContacts$ — derived Observable that reacts to rootGroup$ changes.
   * Debounced so rapid keystrokes don't trigger excessive filtering.
   * This replaces Angular's traditional *ngFor + ChangeDetection flow with
   * a fully reactive pipeline consumed by `async` pipe in the template.
   */
  readonly matchingContacts$: Observable<Contact[]> = this.rootGroup$$.pipe(
    debounceTime(150),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    map(group => CONTACTS.filter(contact => this.evaluateGroup(group, contact)))
  );

  // ── Factory Methods ──────────────────────────────────────────────────────

  newCondition(): Condition {
    return {
      id: ++this.conditionCounter,
      field: 'country',
      operator: 'is',
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
        { id: ++this.conditionCounter, field: 'country',       operator: 'is',           value: 'Germany' },
        { id: ++this.conditionCounter, field: 'plan',          operator: 'is',           value: 'premium' },
      ],
      groups: []
    };

    const sub: RuleGroup = {
      id: ++this.groupCounter,
      logic: 'OR',
      conditions: [
        { id: ++this.conditionCounter, field: 'purchaseCount', operator: 'greater than', value: '3' },
        { id: ++this.conditionCounter, field: 'signupDate',    operator: 'before',       value: '2024-01-01' },
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
    const contactCount = CONTACTS.filter(c => this.evaluateGroup(group, c)).length;

    return timer(800).pipe(
      switchMap(() => {
        const rule: SavedRule = {
          id: Date.now(),
          summary: this.summarizeGroup(group),
          contactCount,
          savedAt: new Date()
        };
        this.savedRules$$.next([rule, ...this.savedRules$$.value]);
        this.saving$$.next(false);
        return of(rule);
      })
    );
  }

  // ── Private Helpers ──────────────────────────────────────────────────────

  private emit(): void {
    // Emit new reference to trigger OnPush change detection
    this.rootGroup$$.next({ ...this.rootGroup$$.value });
  }

  private evaluateGroup(group: RuleGroup, contact: Contact): boolean {
    const condResults = group.conditions.map(c => this.evaluateCondition(c, contact));
    const subResults  = group.groups.map(g => this.evaluateGroup(g, contact));
    const all = [...condResults, ...subResults];
    if (!all.length) return true;
    return group.logic === 'AND' ? all.every(Boolean) : all.some(Boolean);
  }

  private evaluateCondition(cond: Condition, contact: Contact): boolean {
    if (!cond.value.trim()) return true;
    const raw    = contact[cond.field as keyof Contact];
    const val    = String(raw).toLowerCase();
    const target = cond.value.trim().toLowerCase();
    const numV   = parseFloat(String(raw));
    const numT   = parseFloat(cond.value);

    switch (cond.operator) {
      case 'is':           return val === target;
      case 'is not':       return val !== target;
      case 'greater than': return !isNaN(numV) && numV > numT;
      case 'less than':    return !isNaN(numV) && numV < numT;
      case 'before':       return String(raw) < cond.value;
      case 'after':        return String(raw) > cond.value;
      default:             return true;
    }
  }

  private summarizeGroup(group: RuleGroup): string {
    const parts = group.conditions
      .filter(c => c.value.trim())
      .map(c => `${c.field} ${c.operator} "${c.value}"`);
    return parts.join(` ${group.logic} `) || 'Empty rule';
  }

  // ── TrackBy Functions (used in templates) ────────────────────────────────

  trackByConditionId(_: number, cond: Condition): number {
    return cond.id;
  }

  trackByGroupId(_: number, group: RuleGroup): number {
    return group.id;
  }

  trackByContactId(_: number, contact: Contact): number {
    return contact.id;
  }

  trackBySavedRuleId(_: number, rule: SavedRule): number {
    return rule.id;
  }
}
