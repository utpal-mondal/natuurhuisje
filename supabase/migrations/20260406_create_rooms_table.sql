-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id serial not null,
  house_id integer not null,
  room_name character varying(255) not null default 'Main Room'::character varying,
  room_type character varying(100) not null default 'Bedroom'::character varying,
  room_number character varying(50) null,
  floor_level integer null default 1,
  size_sqm numeric(8, 2) null,
  ceiling_height numeric(5, 2) null,
  bed_type character varying(100) null,
  bed_count integer null default 1,
  max_occupants integer null default 2,
  has_private_bathroom boolean null default false,
  has_private_kitchen boolean null default false,
  has_private_entrance boolean null default false,
  has_balcony boolean null default false,
  has_terrace boolean null default false,
  has_air_conditioning boolean null default false,
  has_heating boolean null default false,
  has_tv boolean null default false,
  has_wifi boolean null default false,
  has_desk boolean null default false,
  has_wardrobe boolean null default false,
  has_safety_box boolean null default false,
  window_count integer null default 1,
  window_direction character varying(100) null,
  has_blackout_curtains boolean null default false,
  is_wheelchair_accessible boolean null default false,
  has_ground_floor_access boolean null default false,
  description text null,
  price_per_night numeric(10, 2) null,
  min_nights integer null,
  is_active boolean null default true,
  is_available boolean null default true,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  search_embedding extensions.vector null,
  description_embedding extensions.vector null,
  features_embedding extensions.vector null,
  embedding_model character varying(50) null default 'text-embedding-ada-002'::character varying,
  embedding_updated_at timestamp without time zone null,
  constraint rooms_pkey primary key (id),
  constraint rooms_house_id_fkey foreign key (house_id) references houses (id) on delete CASCADE
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rooms_house_id ON public.rooms USING btree (house_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rooms_type ON public.rooms USING btree (room_type) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rooms_active ON public.rooms USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rooms_available ON public.rooms USING btree (is_available) TABLESPACE pg_default;

-- Vector indexes for search
CREATE INDEX IF NOT EXISTS idx_rooms_search_embedding ON public.rooms USING ivfflat (search_embedding extensions.vector_cosine_ops) WITH (lists = '100') TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rooms_description_embedding ON public.rooms USING ivfflat (description_embedding extensions.vector_cosine_ops) WITH (lists = '100') TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_rooms_features_embedding ON public.rooms USING ivfflat (features_embedding extensions.vector_cosine_ops) WITH (lists = '100') TABLESPACE pg_default;

-- Create room_images table
CREATE TABLE IF NOT EXISTS room_images (
  id serial not null,
  room_id integer not null,
  image_url character varying(500) not null,
  sort_order integer null default 0,
  image_type character varying(50) null default 'general'::character varying,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint room_images_pkey primary key (id),
  constraint room_images_room_id_fkey foreign key (room_id) references rooms (id) on delete CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_room_images_room_id ON public.room_images USING btree (room_id) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Landlords can view their own rooms" ON rooms
  FOR SELECT
  USING (auth.uid() = (SELECT host_id FROM houses WHERE houses.id = rooms.house_id) OR is_admin(auth.uid()));

CREATE POLICY "Landlords can insert their own rooms" ON rooms
  FOR INSERT
  WITH CHECK (auth.uid() = (SELECT host_id FROM houses WHERE houses.id = rooms.house_id) OR is_admin(auth.uid()));

CREATE POLICY "Landlords can update their own rooms" ON rooms
  FOR UPDATE
  USING (auth.uid() = (SELECT host_id FROM houses WHERE houses.id = rooms.house_id) OR is_admin(auth.uid()));

CREATE POLICY "Landlords can delete their own rooms" ON rooms
  FOR DELETE
  USING (auth.uid() = (SELECT host_id FROM houses WHERE houses.id = rooms.house_id) OR is_admin(auth.uid()));

-- RLS Policies for room_images
CREATE POLICY "Landlords can manage their own room images" ON room_images
  FOR ALL
  USING (auth.uid() = (SELECT host_id FROM houses WHERE houses.id = (SELECT house_id FROM rooms WHERE rooms.id = room_images.room_id)) OR is_admin(auth.uid()));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON rooms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON room_images TO authenticated;

-- Update function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
