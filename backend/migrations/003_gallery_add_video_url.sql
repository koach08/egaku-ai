-- Migration: Add video_url column to gallery table
-- Run this in Supabase SQL Editor

ALTER TABLE public.gallery
ADD COLUMN IF NOT EXISTS video_url TEXT;
