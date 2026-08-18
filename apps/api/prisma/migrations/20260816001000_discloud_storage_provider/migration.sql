ALTER TABLE file_objects
ALTER COLUMN status
SET DEFAULT 'UPLOADING';

ALTER TABLE file_objects
DROP CONSTRAINT IF EXISTS file_objects_status_chk;

ALTER TABLE file_objects
ADD CONSTRAINT file_objects_status_chk
CHECK (
  status IN (
    'UPLOADING',
    'ACTIVE',
    'FAILED',
    'DELETED'
  )
);

CREATE TABLE discord_storage_chunks (
  id uuid
    PRIMARY KEY
    DEFAULT uuidv7(),

  channel_id varchar(32)
    NOT NULL,

  sha256 varchar(64)
    NOT NULL,

  size_bytes bigint
    NOT NULL,

  status varchar(32)
    NOT NULL
    DEFAULT 'UPLOADING',

  message_id varchar(32),

  attachment_id varchar(32),

  attachment_filename text,

  bot_key varchar(64),

  created_at timestamptz(6)
    NOT NULL
    DEFAULT now(),

  updated_at timestamptz(6)
    NOT NULL
    DEFAULT now(),

  deleted_at timestamptz(6),

  CONSTRAINT
    discord_storage_chunks_size_chk
  CHECK (
    size_bytes > 0
  ),

  CONSTRAINT
    discord_storage_chunks_sha256_chk
  CHECK (
    sha256 ~ '^[0-9a-f]{64}$'
  ),

  CONSTRAINT
    discord_storage_chunks_status_chk
  CHECK (
    status IN (
      'UPLOADING',
      'ACTIVE',
      'FAILED',
      'MISSING',
      'DELETED'
    )
  ),

  CONSTRAINT
    discord_storage_chunks_active_locator_chk
  CHECK (
    status <> 'ACTIVE'
    OR (
      message_id IS NOT NULL
      AND attachment_id IS NOT NULL
      AND bot_key IS NOT NULL
    )
  ),

  CONSTRAINT
    discord_storage_chunks_channel_sha256_uq
  UNIQUE (
    channel_id,
    sha256
  )
);

CREATE INDEX
  discord_storage_chunks_status_idx
ON discord_storage_chunks (
  status
);

CREATE INDEX
  discord_storage_chunks_message_idx
ON discord_storage_chunks (
  channel_id,
  message_id
);

CREATE TRIGGER
  discord_storage_chunks_set_updated_at
BEFORE UPDATE
ON discord_storage_chunks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE discord_file_parts (
  id uuid
    PRIMARY KEY
    DEFAULT uuidv7(),

  file_object_id uuid
    NOT NULL,

  chunk_id uuid
    NOT NULL,

  ordinal integer
    NOT NULL,

  created_at timestamptz(6)
    NOT NULL
    DEFAULT now(),

  CONSTRAINT
    discord_file_parts_file_object_fk
  FOREIGN KEY (
    file_object_id
  )
  REFERENCES file_objects(id)
  ON DELETE CASCADE,

  CONSTRAINT
    discord_file_parts_chunk_fk
  FOREIGN KEY (
    chunk_id
  )
  REFERENCES discord_storage_chunks(id)
  ON DELETE RESTRICT,

  CONSTRAINT
    discord_file_parts_ordinal_chk
  CHECK (
    ordinal >= 0
  ),

  CONSTRAINT
    discord_file_parts_file_ordinal_uq
  UNIQUE (
    file_object_id,
    ordinal
  )
);

CREATE INDEX
  discord_file_parts_chunk_id_idx
ON discord_file_parts (
  chunk_id
);