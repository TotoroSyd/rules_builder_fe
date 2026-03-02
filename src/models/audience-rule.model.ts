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

export const PLAN_OPTIONS: Plan[] = ['free', 'starter', 'pro', 'enterprise'];

export const COUNTRIES = [                                                                                                                      
    {"code":"AU","name":"Australia"},                                                                                  
    {"code":"AT","name":"Austria"},                                                                                      
    {"code":"BE","name":"Belgium"},                                                                                      
    {"code":"BR","name":"Brazil"},                                                                                       
    {"code":"CA","name":"Canada"},                                                                                       
    {"code":"CL","name":"Chile"},                                                                                        
    {"code":"CN","name":"China"},                                                                                        
    {"code":"CO","name":"Colombia"},                                                                                     
    {"code":"HR","name":"Croatia"},
    {"code":"CZ","name":"Czech Republic"},
    {"code":"DK","name":"Denmark"},
    {"code":"EG","name":"Egypt"},
    {"code":"FI","name":"Finland"},
    {"code":"FR","name":"France"},
    {"code":"DE","name":"Germany"},
    {"code":"GH","name":"Ghana"},
    {"code":"GR","name":"Greece"},
    {"code":"HK","name":"Hong Kong"},
    {"code":"HU","name":"Hungary"},
    {"code":"IN","name":"India"},
    {"code":"ID","name":"Indonesia"},
    {"code":"IE","name":"Ireland"},
    {"code":"IL","name":"Israel"},
    {"code":"IT","name":"Italy"},
    {"code":"JP","name":"Japan"},
    {"code":"KE","name":"Kenya"},
    {"code":"MX","name":"Mexico"},
    {"code":"NL","name":"Netherlands"},
    {"code":"NZ","name":"New Zealand"},
    {"code":"NG","name":"Nigeria"},
    {"code":"NO","name":"Norway"},
    {"code":"PK","name":"Pakistan"},
    {"code":"PE","name":"Peru"},
    {"code":"PH","name":"Philippines"},
    {"code":"PL","name":"Poland"},
    {"code":"PT","name":"Portugal"},
    {"code":"RO","name":"Romania"},
    {"code":"SA","name":"Saudi Arabia"},
    {"code":"SG","name":"Singapore"},
    {"code":"ZA","name":"South Africa"},
    {"code":"KR","name":"South Korea"},
    {"code":"ES","name":"Spain"},
    {"code":"SE","name":"Sweden"},
    {"code":"CH","name":"Switzerland"},
    {"code":"TW","name":"Taiwan"},
    {"code":"TH","name":"Thailand"},
    {"code":"TR","name":"Turkey"},
    {"code":"GB","name":"United Kingdom"},
    {"code":"US","name":"United States"},
    {"code":"VN","name":"Vietnam"}
  ];