-- Fix critical privacy issues: Restrict public access to user-generated content
-- This migration addresses security vulnerabilities where sensitive mental health data
-- was publicly accessible to anyone on the internet

-- 1. Remove public access policies for posts table
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Public can read posts" ON public.posts;

-- 2. Remove public access policies for comments table  
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Public can read comments" ON public.comments;

-- 3. Remove public access policies for likes table
DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
DROP POLICY IF EXISTS "Public can read likes" ON public.likes;

-- 4. Remove public access policies for room_messages table
DROP POLICY IF EXISTS "Anyone can view room messages" ON public.room_messages;

-- 5. Remove public access policies for room_participants table
DROP POLICY IF EXISTS "Anyone can view room participants" ON public.room_participants;

-- 6. Create secure, authenticated-only access policies for posts
CREATE POLICY "Authenticated users can view posts" 
ON public.posts 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 7. Create secure, authenticated-only access policies for comments
CREATE POLICY "Authenticated users can view comments" 
ON public.comments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 8. Create secure, authenticated-only access policies for likes
CREATE POLICY "Authenticated users can view likes" 
ON public.likes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 9. Create secure, authenticated-only access policies for room messages
CREATE POLICY "Authenticated users can view room messages" 
ON public.room_messages 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 10. Create secure, authenticated-only access policies for room participants
CREATE POLICY "Authenticated users can view room participants" 
ON public.room_participants 
FOR SELECT 
USING (auth.uid() IS NOT NULL);