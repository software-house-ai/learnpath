-- Question bank table for AI-generated and fallback assessment questions
create table if not exists question_bank (
  id uuid primary key default uuid_generate_v4(),
  skill_id uuid not null references skills(id) on delete cascade,
  difficulty_level text not null check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
  question_text text not null,
  options jsonb not null,
  correct_index integer not null check (correct_index between -1 and 3),
  explanation text,
  times_used integer not null default 0 check (times_used >= 0),
  created_at timestamptz default now(),
  constraint question_bank_options_array check (
    jsonb_typeof(options) = 'array'
    and jsonb_array_length(options) = 4
  )
);

create index if not exists idx_question_bank_skill_difficulty
  on question_bank(skill_id, difficulty_level);

create index if not exists idx_question_bank_times_used
  on question_bank(times_used);

alter table question_bank enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'question_bank'
      and policyname = 'Admins can manage question bank'
  ) then
    create policy "Admins can manage question bank"
      on question_bank
      for all
      using (
        exists (
          select 1
          from profiles
          where id = auth.uid()
            and role = 'admin'
        )
      )
      with check (
        exists (
          select 1
          from profiles
          where id = auth.uid()
            and role = 'admin'
        )
      );
  end if;
end;
$$;
