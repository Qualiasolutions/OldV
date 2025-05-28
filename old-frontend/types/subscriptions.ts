export type SubscriptionType = 'MONTHLY' | 'YEARLY';

export type Subscription = {
  current_period_end: number;
  cancel_at_period_end: boolean;
  is_family: boolean;
  type: SubscriptionType;
  customer_email: string;
  user: number;
};
