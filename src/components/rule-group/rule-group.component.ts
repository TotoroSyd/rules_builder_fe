// components/rule-group/rule-group.component.ts

import {
  Component, Input, ChangeDetectionStrategy, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RuleBuilderService } from '../../services/rule-builder.service';
import {
  RuleGroup, Condition, FieldType, ConditionOperator,
  FIELD_OPTIONS, OPERATOR_MAP
} from '../../models/audience-rule.model';

@Component({
  selector: 'app-rule-group',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rule-group" [class.nested]="nested">

      <!-- AND / OR toggle -->
      <div class="group-header">
        <div class="toggle-group">
          <button
            *ngFor="let opt of logicOptions"
            class="toggle-btn"
            [class.active]="group.logic === opt"
            (click)="svc.setLogic(group, opt)"
          >{{ opt }}</button>
        </div>
        <span class="logic-label">
          {{ group.logic === 'AND' ? 'ALL CONDITIONS MUST MATCH' : 'ANY CONDITION MUST MATCH' }}
        </span>
      </div>

      <!-- Conditions — *ngFor with trackBy ────────────────────────────── -->
      <div class="conditions-list">
        <div
          *ngFor="let cond of group.conditions; trackBy: svc.trackByConditionId"
          class="condition-row"
          [attr.data-id]="cond.id"
        >
          <!-- Field -->
          <select
            [ngModel]="cond.field"
            (ngModelChange)="svc.updateConditionField(cond, $event)"
          >
            <option *ngFor="let f of fieldOptions" [value]="f">{{ f }}</option>
          </select>

          <!-- Operator -->
          <select
            [ngModel]="cond.operator"
            (ngModelChange)="svc.updateConditionOperator(cond, $event)"
          >
            <option
              *ngFor="let op of getOperators(cond.field)"
              [value]="op"
            >{{ op }}</option>
          </select>

          <!-- Value -->
          <input
            type="text"
            [ngModel]="cond.value"
            (ngModelChange)="svc.updateConditionValue(cond, $event)"
            placeholder="value…"
          />

          <!-- Remove -->
          <button
            class="btn-remove"
            [disabled]="group.conditions.length === 1"
            (click)="svc.removeCondition(group, cond.id)"
            title="Remove condition"
          >&times;</button>
        </div>
      </div>

      <!-- Nested sub-groups — *ngFor with trackBy ────────────────────── -->
      <div
        *ngFor="let subGroup of group.groups; trackBy: svc.trackByGroupId"
        class="nested-group-wrapper"
      >
        <span class="nested-label">GROUP</span>

        <!-- Recursive component -->
        <app-rule-group [group]="subGroup" [nested]="true" [parentGroup]="group" />

        <button
          class="btn-ghost muted remove-group-btn"
          (click)="svc.removeGroup(group, subGroup.id)"
        >− Remove group</button>
      </div>

      <!-- Actions -->
      <div class="group-actions">
        <button class="btn-ghost" (click)="svc.addCondition(group)">+ Add condition</button>
        <button
          *ngIf="!nested"
          class="btn-ghost muted"
          (click)="svc.addGroup(group)"
        >+ Add group</button>
      </div>
    </div>
  `
})
export class RuleGroupComponent {
  @Input({ required: true }) group!: RuleGroup;
  @Input() nested = false;
  @Input() parentGroup?: RuleGroup;

  readonly logicOptions: Array<'AND' | 'OR'> = ['AND', 'OR'];
  readonly fieldOptions = FIELD_OPTIONS;

  constructor(public readonly svc: RuleBuilderService) {}

  getOperators(field: FieldType): ConditionOperator[] {
    return OPERATOR_MAP[field] ?? ['is'];
  }
}
