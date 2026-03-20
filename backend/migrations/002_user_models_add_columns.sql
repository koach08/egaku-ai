-- Migration: Add model_type and safetensors_name columns to user_models
-- Run this in Supabase SQL Editor

ALTER TABLE public.user_models
ADD COLUMN IF NOT EXISTS model_type TEXT NOT NULL DEFAULT 'LORA',
ADD COLUMN IF NOT EXISTS safetensors_name TEXT DEFAULT '';
