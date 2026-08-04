-- Perdas de impressão são auditáveis por tarefa, pedido e máquina.
-- O estoque continua com a baixa original do pedido; estes campos o classificam como desperdício.
alter table public.production_jobs
  add column if not exists waste_grams numeric(12,3) not null default 0,
  add column if not exists waste_time_minutes integer not null default 0,
  add column if not exists waste_cost numeric(12,2) not null default 0,
  add column if not exists waste_records jsonb not null default '[]'::jsonb;

alter table public.production_jobs
  drop constraint if exists production_jobs_waste_grams_check,
  drop constraint if exists production_jobs_waste_time_minutes_check,
  drop constraint if exists production_jobs_waste_cost_check,
  drop constraint if exists production_jobs_waste_records_array_check;

alter table public.production_jobs
  add constraint production_jobs_waste_grams_check check (waste_grams >= 0),
  add constraint production_jobs_waste_time_minutes_check check (waste_time_minutes >= 0),
  add constraint production_jobs_waste_cost_check check (waste_cost >= 0),
  add constraint production_jobs_waste_records_array_check check (jsonb_typeof(waste_records) = 'array');
