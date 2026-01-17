import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxosgkriafkvqmtilwab.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4b3Nna3JpYWZrdnFtdGlsd2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDgwOTUsImV4cCI6MjA4NDIyNDA5NX0.d3cvDzVPywhyqeQHv7oVnBlo5bG-Uaf1TbZg-f15LFo';

export const supabase = createClient(supabaseUrl, supabaseKey);