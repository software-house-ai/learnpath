create index if not exists idx_content_items_needs_review
  on content_items(needs_review) where needs_review = true;

create index if not exists idx_content_items_provider
  on content_items(provider);

create index if not exists idx_content_items_last_verified
  on content_items(last_verified_at);
