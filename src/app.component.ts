// app.component.ts

import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { RuleBuilderService } from './services/rule-builder.service';
import { RuleGroupComponent } from './components/rule-group/rule-group.component';
import { ResultsDisplayComponent } from './components/results-display/results-display.component';
import { SavedRulesComponent } from './components/saved-rules/saved-rules.component';
import { Contact, SavedRule, RuleGroup } from './models/audience-rule.model';

interface AppViewModel {
  rootGroup: RuleGroup;
  matchingContacts: Contact[];
  savedRules: SavedRule[];
  saving: boolean;
  searching: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RuleGroupComponent, ResultsDisplayComponent, SavedRulesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  /**
   * Template uses the async pipe throughout so Angular handles
   * subscription/unsubscription automatically, and OnPush CD works correctly.
   *
   * We combine all streams into a single vm$ Observable using combineLatest,
   * which is the idiomatic Angular pattern when using async pipe + OnPush.
   */
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  /**
   * vm$ — single combined Observable powering the entire template.
   * The async pipe subscribes once and Angular's zone handles re-renders.
   *
   * combineLatest emits whenever ANY source stream emits,
   * giving us a fully reactive ViewModel object.
   */
  vm$!: Observable<AppViewModel>;

  constructor(public readonly ruleBuilderService: RuleBuilderService) {}

  ngOnInit(): void {
    this.vm$ = combineLatest([
      this.ruleBuilderService.rootGroup$,
      this.ruleBuilderService.matchingContacts$,
      this.ruleBuilderService.savedRules$,
      this.ruleBuilderService.saving$,
      this.ruleBuilderService.searching$,
    ]).pipe(
      map(([rootGroup, matchingContacts, savedRules, saving, searching]) => ({
        rootGroup,
        matchingContacts,
        savedRules,
        saving,
        searching
      }))
    );
  }

  searchContacts(): void {
    this.ruleBuilderService.searchContacts();
  }

  saveRule(): void {
    this.ruleBuilderService.saveRule().subscribe({
      // Ui feedback for user on success
      next: () => {
        alert('Rule saved successfully!');
      },
      // Ui feedback for user on failure
      error: (err) => {
        console.error('Error saving rule:', err);
        alert('Failed to save rule. Please try again.');
      }
    });
  }
}
