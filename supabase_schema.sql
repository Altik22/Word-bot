-- Supabase Schema for LingoMagic

-- 1. Profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. History table (formerly documents)
CREATE TABLE IF NOT EXISTS history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT,
  analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- 4. Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow public read of profiles for login verification (searching by full_name)
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- 5. Policies for history
CREATE POLICY "Users can view their own history" 
ON history FOR SELECT 
USING (auth.uid() = account_id);

CREATE POLICY "Users can create their own history" 
ON history FOR INSERT 
WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can update their own history" 
ON history FOR UPDATE 
USING (auth.uid() = account_id);

CREATE POLICY "Users can delete their own history" 
ON history FOR DELETE 
USING (auth.uid() = account_id);

-- 6. Grant permissions to anon and authenticated
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE history TO authenticated;
GRANT SELECT ON TABLE profiles TO anon;
