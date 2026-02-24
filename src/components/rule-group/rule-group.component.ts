// components/rule-group/rule-group.component.ts

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RuleBuilderService } from '../../services/rule-builder.service';
import {
  RuleGroup, Condition, FieldType, ConditionOperator,
  FIELD_OPTIONS, OPERATOR_MAP
} from '../../models/audience-rule.model';

@Component({
  selector: 'app-rule-group',
  standalone: true,
  imports: [CommonModule, FormsModule, RuleGroupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rule-group.component.html',
  styleUrl: './rule-group.component.css'
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
