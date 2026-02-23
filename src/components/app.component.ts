// app.component.ts

import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { Observable, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { RuleBuilderService } from '../services/rule-builder.service';
import { RuleGroupComponent } from './rule-group/rule-group.component';
import { Contact, SavedRule, RuleGroup } from '../models/audience-rule.model';

interface AppViewModel {
  rootGroup: RuleGroup;
  matchingContacts: Contact[];
  savedRules: SavedRule[];
  saving: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RuleGroupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  /**
   * Template uses the async pipe throughout so Angular handles
   * subscription/unsubscription automatically, and OnPush CD works correctly.
   *
   * We combine all streams into a single vm$ Observable using combineLatest,
   * which is the idiomatic Angular pattern when using async pipe + OnPush.
   */
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <div class="app-shell">

        <!-- Header -->
        <header class="app-header">
          <div class="app-title">Chemist<span>2U</span> · Audience Builder</div>
        </header>

        <!-- Audience Rules Card -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Audience Rules</span>
            <button
              class="btn-primary"
              [disabled]="vm.saving"
              (click)="saveRule()"
            >
              <span *ngIf="vm.saving" class="loading-dot"></span>
              {{ vm.saving ? 'Saving…' : 'Save Rule' }}
            </button>
          </div>

          <!-- Rule Group tree (recursive) -->
          <app-rule-group [group]="vm.rootGroup" [nested]="false" />
        </div>

        <!-- Saved Rules -->
        <ng-container *ngIf="vm.savedRules.length > 0">
          <div class="section-label">Saved Rules</div>
          <div class="saved-rules">
            <div
              *ngFor="let rule of vm.savedRules; trackBy: svc.trackBySavedRuleId"
              class="saved-rule-item"
            >
              <strong>Rule #{{ rule.id }}</strong>
              — {{ rule.summary }} ·
              <em style="color:var(--green)">
                {{ rule.contactCount }} match{{ rule.contactCount !== 1 ? 'es' : '' }}
              </em>
            </div>
          </div>
          <div class="divider"></div>
        </ng-container>

        <!-- Matching Contacts Card -->
        <div class="contacts-card">
          <div class="contacts-header">
            <span class="card-title">Matching Contacts</span>
            <span class="contacts-count">
              {{ vm.matchingContacts.length }}
              contact{{ vm.matchingContacts.length !== 1 ? 's' : '' }}
            </span>
          </div>

          <div class="contacts-list">
            <!-- async pipe + ngFor with trackBy -->
            <ng-container *ngIf="vm.matchingContacts.length > 0; else noContacts">
              <div
                *ngFor="let contact of vm.matchingContacts; trackBy: svc.trackByContactId"
                class="contact-chip"
              >
                <div
                  class="avatar"
                  [style.background]="contact.bg"
                  [style.color]="contact.color"
                >{{ contact.initials }}</div>
                <span class="contact-name">{{ contact.name }}</span>
              </div>
            </ng-container>

            <ng-template #noContacts>
              <span class="empty-state">No contacts match the current rules.</span>
            </ng-template>
          </div>
        </div>

      </div>
    </ng-container>
  `
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

  constructor(public readonly svc: RuleBuilderService) {}

  ngOnInit(): void {
    this.vm$ = combineLatest([
      this.svc.rootGroup$,
      this.svc.matchingContacts$,
      this.svc.savedRules$,
      this.svc.saving$,
    ]).pipe(
      map(([rootGroup, matchingContacts, savedRules, saving]) => ({
        rootGroup,
        matchingContacts,
        savedRules,
        saving
      }))
    );
  }

  saveRule(): void {
    // Subscribe to the save observable (Angular async fire-and-forget)
    this.svc.saveRule().subscribe();
  }
}
