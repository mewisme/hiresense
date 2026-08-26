ALTER TABLE discord_storage_chunks
DROP CONSTRAINT discord_storage_chunks_active_locator_chk;

ALTER TABLE discord_storage_chunks
DROP COLUMN bot_key;

ALTER TABLE discord_storage_chunks
ADD CONSTRAINT discord_storage_chunks_active_locator_chk
CHECK (
  status <> 'ACTIVE'
  OR (
    message_id IS NOT NULL
    AND attachment_id IS NOT NULL
  )
);
