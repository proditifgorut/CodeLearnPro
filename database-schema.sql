/*
  CodeLearn Pro - Database Schema
  Version: 3.0
  Description: This script sets up the complete database schema including tables,
  roles, policies, and functions for the CodeLearn Pro application.
  This version is idempotent and includes automated profile creation.
*/

-- 1. Custom Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'user', 'mentor');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
    END IF;
END$$;


-- 2. Profiles Table
-- Stores public user information.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  role user_role NOT NULL DEFAULT 'user'
);

-- 3. Row Level Security (RLS) for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- 4. Function and Trigger for New User Profile Creation
-- This function automatically creates a profile entry when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, phone, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    'user' -- Default role for all new users
  );
  RETURN new;
END;
$$;

-- Drop existing trigger to avoid conflicts, then create a new one.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 5. Course and Content Tables
CREATE TABLE IF NOT EXISTS public.course_categories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.courses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL,
  description TEXT,
  category_id BIGINT REFERENCES public.course_categories(id),
  image_url TEXT,
  price NUMERIC(10, 2),
  old_price NUMERIC(10, 2)
);

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  course_id BIGINT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT,
  duration_minutes INT
);

-- 6. User Progress and Enrollment
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id BIGINT NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, lesson_id)
);

-- 7. RLS for Content and Progress Tables
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories are public." ON public.course_categories;
CREATE POLICY "Categories are public." ON public.course_categories FOR SELECT USING (true);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Courses are public." ON public.courses;
CREATE POLICY "Courses are public." ON public.courses FOR SELECT USING (true);

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lessons are viewable by enrolled users." ON public.course_lessons;
CREATE POLICY "Lessons are viewable by enrolled users." ON public.course_lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE course_enrollments.course_id = course_lessons.course_id
      AND course_enrollments.user_id = auth.uid()
    )
  );

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own enrollments." ON public.course_enrollments;
CREATE POLICY "Users can manage their own enrollments." ON public.course_enrollments
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own lesson progress." ON public.lesson_progress;
CREATE POLICY "Users can manage their own lesson progress." ON public.lesson_progress
  FOR ALL USING (auth.uid() = user_id);

-- 8. Initial Data (Optional, for demonstration)
-- Using ON CONFLICT DO NOTHING to make it safe to re-run.
INSERT INTO public.course_categories (name, description) VALUES
  ('Web Development', 'Courses related to building websites and web applications.'),
  ('AI & Machine Learning', 'Courses on artificial intelligence and data science.')
ON CONFLICT (name) DO NOTHING;

-- Note: Admin policies for inserting/updating courses would be needed for a full CMS.
-- For now, data can be inserted via the Supabase dashboard.

-- 9. Website Services and Orders
CREATE TABLE IF NOT EXISTS public.website_services (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    description TEXT,
    price_range TEXT
);

CREATE TABLE IF NOT EXISTS public.service_orders (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    service_id BIGINT NOT NULL REFERENCES public.website_services(id),
    status order_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Services and Orders
ALTER TABLE public.website_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Services are public." ON public.website_services;
CREATE POLICY "Services are public." ON public.website_services FOR SELECT USING (true);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own orders." ON public.service_orders;
CREATE POLICY "Users can manage their own orders." ON public.service_orders
  FOR ALL USING (auth.uid() = user_id);

-- End of script
