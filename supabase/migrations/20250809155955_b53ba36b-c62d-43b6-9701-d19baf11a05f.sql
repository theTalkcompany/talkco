-- Create unique constraint on profiles.user_id to support FKs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT posts_user_fk FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for posts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Anyone can view posts' AND tablename = 'posts'
  ) THEN
    CREATE POLICY "Anyone can view posts"
    ON public.posts
    FOR SELECT
    USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Users can create their own posts' AND tablename = 'posts'
  ) THEN
    CREATE POLICY "Users can create their own posts"
    ON public.posts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Users can update their own posts' AND tablename = 'posts'
  ) THEN
    CREATE POLICY "Users can update their own posts"
    ON public.posts
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Users can delete their own posts' AND tablename = 'posts'
  ) THEN
    CREATE POLICY "Users can delete their own posts"
    ON public.posts
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger to update updated_at on posts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_updated_at'
  ) THEN
    CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for comments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Anyone can view comments' AND tablename = 'comments'
  ) THEN
    CREATE POLICY "Anyone can view comments"
    ON public.comments
    FOR SELECT
    USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Users can create their own comments' AND tablename = 'comments'
  ) THEN
    CREATE POLICY "Users can create their own comments"
    ON public.comments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Users can update their own comments' AND tablename = 'comments'
  ) THEN
    CREATE POLICY "Users can update their own comments"
    ON public.comments
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Users can delete their own comments' AND tablename = 'comments'
  ) THEN
    CREATE POLICY "Users can delete their own comments"
    ON public.comments
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger to update updated_at on comments
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_comments_updated_at'
  ) THEN
    CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT likes_unique UNIQUE (post_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for likes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Anyone can view likes' AND tablename = 'likes'
  ) THEN
    CREATE POLICY "Anyone can view likes"
    ON public.likes
    FOR SELECT
    USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Users can like posts' AND tablename = 'likes'
  ) THEN
    CREATE POLICY "Users can like posts"
    ON public.likes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE polname = 'Users can unlike their likes' AND tablename = 'likes'
  ) THEN
    CREATE POLICY "Users can unlike their likes"
    ON public.likes
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;