import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Contact } from '../../models/audience-rule.model';
import { RuleBuilderService } from '../../services/rule-builder.service';

@Component({
  selector: 'app-results-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results-display.component.html',
  styleUrl: './results-display.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultsDisplayComponent {
  @Input() contacts: Contact[] = [];
  constructor(public readonly svc: RuleBuilderService) {}
}
