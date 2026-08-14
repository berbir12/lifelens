alter table public.timeline_events add column if not exists source_extraction_id uuid references public.document_extractions(id) on delete set null;
alter table public.document_extractions add column if not exists timeline_event_id uuid references public.timeline_events(id) on delete set null;
create unique index if not exists timeline_events_source_extraction_unique on public.timeline_events(source_extraction_id) where source_extraction_id is not null;
