import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavedRule, Rule } from '../../models/audience-rule.model';
import { RuleBuilderService } from '../../services/rule-builder.service';

@Component({
  selector: 'app-saved-rules',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saved-rules.component.html',
  styleUrl: './saved-rules.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SavedRulesComponent {
  @Input() rules: SavedRule[] = [];
  constructor(public readonly svc: RuleBuilderService) {}

  formatRule(rule: Rule): string {
    if (!rule) return '(no conditions)';

    const conditionParts = rule.conditions
      .filter(c => c.value.trim())
      .map(c => `${c.field} ${c.operator} ${c.value}`);

    const groupParts = (rule.groups ?? []).map(g => this.formatRule(g));

    const all = [...conditionParts, ...groupParts];
    if (!all.length) return '(no conditions)';

    return `(${all.join(` ${rule.logic} `)})`;
  }
}
