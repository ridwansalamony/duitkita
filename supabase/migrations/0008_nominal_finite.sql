-- PostgreSQL numeric NaN compares greater than ordinary numbers, so amount>0
-- alone does not protect the ledger from direct PostgREST writes.
-- NOT VALID preserves old rows; new writes are checked immediately.
alter table public.transactions add constraint transaction_amount_finite
  check (amount <> 'NaN'::numeric) not valid;
alter table public.saving_goals add constraint goal_amounts_finite
  check (target_amount <> 'NaN'::numeric and current_amount <> 'NaN'::numeric) not valid;
alter table public.categories add constraint category_budget_finite
  check (monthly_budget is null or monthly_budget <> 'NaN'::numeric) not valid;
alter table public.saving_contributions add constraint contribution_amount_finite
  check (amount <> 'NaN'::numeric) not valid;
