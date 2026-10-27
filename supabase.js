import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://gjuwyyvuqozudbiisxnk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdXd5eXZ1cW96dWRiaWlzeG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMTI5ODksImV4cCI6MjEwODY4ODk4OX0.NXnZVfC_EGk74ohj1RR7p1o2wZnRfZROq05OKz-BV6Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);