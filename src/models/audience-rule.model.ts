// models/audience-rule.model.ts

export type LogicOperator = 'AND' | 'OR';
export type FieldType = 'country' | 'plan' | 'purchaseCount' | 'signupDate';
export type ConditionOperator = 'is' | 'is not' | 'greater than' | 'less than' | 'before' | 'after';

export interface Condition {
  id: number;
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
  id: number;
  initials: string;
  name: string;
  color: string;
  bg: string;
  country: string;
  plan: string;
  purchaseCount: number;
  signupDate: string;
}

export interface SavedRule {
  id: number;
  summary: string;
  contactCount: number;
  savedAt: Date;
}

export const FIELD_OPTIONS: FieldType[] = ['country', 'plan', 'purchaseCount', 'signupDate'];

export const OPERATOR_MAP: Record<FieldType, ConditionOperator[]> = {
  country:       ['is', 'is not'],
  plan:          ['is', 'is not'],
  purchaseCount: ['is', 'greater than', 'less than'],
  signupDate:    ['before', 'after', 'is'],
};

export const CONTACTS: Contact[] = [
  { id: 1, initials: 'AS', name: 'Anna Schmidt',   color: '#63b3ed', bg: 'rgba(99,179,237,0.18)',  country: 'Germany', plan: 'premium', purchaseCount: 5,  signupDate: '2023-03-15' },
  { id: 2, initials: 'YT', name: 'Yuki Tanaka',    color: '#f6ad55', bg: 'rgba(246,173,85,0.18)', country: 'Japan',   plan: 'premium', purchaseCount: 8,  signupDate: '2023-01-20' },
  { id: 3, initials: 'MC', name: 'Marie Curie',    color: '#68d391', bg: 'rgba(104,211,145,0.18)',country: 'France',  plan: 'basic',   purchaseCount: 2,  signupDate: '2024-06-01' },
  { id: 4, initials: 'JL', name: 'James Lee',      color: '#b794f4', bg: 'rgba(183,148,244,0.18)',country: 'Germany', plan: 'basic',   purchaseCount: 12, signupDate: '2023-07-11' },
  { id: 5, initials: 'SM', name: 'Sofia Martinez', color: '#fc8181', bg: 'rgba(252,129,129,0.18)',country: 'Spain',   plan: 'premium', purchaseCount: 1,  signupDate: '2024-02-28' },
  { id: 6, initials: 'HM', name: 'Hans Müller',    color: '#63b3ed', bg: 'rgba(99,179,237,0.18)', country: 'Germany', plan: 'premium', purchaseCount: 7,  signupDate: '2022-11-05' },
];
