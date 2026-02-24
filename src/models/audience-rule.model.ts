// models/audience-rule.model.ts

export type LogicOperator = 'AND' | 'OR';
export type FieldType = 'country' | 'email' | 'purchaseCount' | 'signupDate' | 'plan';
export type ConditionOperator =
  | 'is' | 'is-not'
  | 'contains' | 'not-contains'
  | 'is' | 'is-not'
  | 'equals' | 'greater-than' | 'less-than'
  | 'before' | 'after';
export type Plan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Condition {
  id?: number;
  field: FieldType;
  operator: ConditionOperator;
  value: string;
}

export interface RuleGroup {
  id: number;
  logic: LogicOperator;
  conditions: Condition[];
  groups: RuleGroup[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  country: string;
  signupDate: string;   // ISO 8601 date string e.g. "2023-06-15"
  purchaseCount: number;
  plan: Plan;
}

export interface Rule {
  logic: LogicOperator;
  conditions: Condition[];
  groups?: Rule[];
}

export interface SavedRule {
  id: string;
  name: string;
  description?: string;
  rule: Rule;
  created_at: string;
}

export const FIELD_OPTIONS: FieldType[] = ['country', 'email', 'purchaseCount', 'signupDate', 'plan'];

export const OPERATOR_MAP: Record<FieldType, ConditionOperator[]> = {
  country:       ['is', 'is-not'],
  email:         ['contains', 'not-contains'],
  plan:          ['is', 'is-not'],
  purchaseCount: ['equals', 'greater-than', 'less-than'],
  signupDate:    ['before', 'after'],
};
