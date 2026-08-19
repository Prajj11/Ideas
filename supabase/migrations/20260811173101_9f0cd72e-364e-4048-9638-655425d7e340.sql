CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  travel_style TEXT NOT NULL DEFAULT 'solo',
  traveller_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE,
  days INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trips" ON public.trips FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.travellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  category TEXT NOT NULL DEFAULT 'adult',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.travellers TO authenticated;
GRANT ALL ON public.travellers TO service_role;
ALTER TABLE public.travellers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own travellers" ON public.travellers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.safety_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  person_name TEXT NOT NULL,
  person_age INTEGER,
  category TEXT NOT NULL DEFAULT 'kid',
  description TEXT,
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT NOT NULL,
  alt_phone TEXT,
  medical_notes TEXT,
  staying_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_tags TO authenticated;
GRANT ALL ON public.safety_tags TO service_role;
ALTER TABLE public.safety_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own safety tags" ON public.safety_tags FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  place TEXT NOT NULL,
  hours INTEGER NOT NULL DEFAULT 6,
  interests TEXT[] NOT NULL DEFAULT '{}',
  pace TEXT NOT NULL DEFAULT 'balanced',
  plan JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itineraries TO authenticated;
GRANT ALL ON public.itineraries TO service_role;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own itineraries" ON public.itineraries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
GRANT SELECT ON public.emergency_contacts TO anon, authenticated;
GRANT ALL ON public.emergency_contacts TO service_role;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emergency contacts are public" ON public.emergency_contacts FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.emergency_contacts (name, phone, category, note, sort_order) VALUES
('Police', '100', 'police', 'All-India police emergency line', 1),
('Ambulance', '108', 'medical', 'Free 108 emergency ambulance service in Goa', 2),
('Fire Brigade', '101', 'fire', 'Fire and rescue services', 3),
('Emergency Helpline', '112', 'police', 'Single national emergency number', 4),
('Goa Tourist Police', '+918322428383', 'police', 'Help for tourists: scams, harassment, lost items', 5),
('Drishti Marine Lifeguards', '+918322520717', 'coastal', 'Beach lifeguard control room for drowning and sea rescue', 6),
('Women Helpline', '1091', 'helpline', 'Women in distress', 7),
('Child Helpline', '1098', 'helpline', 'Missing or distressed children', 8),
('Goa Medical College Hospital, Bambolim', '+918322495000', 'medical', 'Largest government hospital in Goa', 9),
('Traffic / Highway Accident', '1073', 'road', 'Road accident and highway assistance', 10),
('Disaster Management, Goa', '1077', 'helpline', 'Floods, cyclones and other disasters', 11);

CREATE OR REPLACE FUNCTION public.get_safety_tag(_token TEXT)
RETURNS TABLE (
  person_name TEXT, person_age INTEGER, category TEXT, description TEXT,
  guardian_name TEXT, guardian_phone TEXT, alt_phone TEXT, medical_notes TEXT, staying_at TEXT
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.person_name, t.person_age, t.category, t.description,
         t.guardian_name, t.guardian_phone, t.alt_phone, t.medical_notes, t.staying_at
  FROM public.safety_tags t WHERE t.token = _token;
$$;
GRANT EXECUTE ON FUNCTION public.get_safety_tag(TEXT) TO anon, authenticated;