import { createClient } from '@supabase/supabase-js';

const URL = 'https://kppdvozuesiycwdacqgf.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcGR2b3p1ZXNpeWN3ZGFjcWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjQ5NTYsImV4cCI6MjA3OTAwMDk1Nn0.Gsc4qx8RK82k6pz0zoZWimXkRsN90Zz3OjvTwpZbO5c';

console.log('Testing Supabase connection...');
console.log('URL:', URL);

const supabase = createClient(URL, ANON_KEY);

console.log('\nTrying a simple query...');
const response = await supabase.auth.getSession();
console.log('Auth session:', response);

// Try health check
try {
  const healthCheck = await fetch(URL + '/rest/v1/', {
    headers: {
      'apikey': ANON_KEY,
    }
  });
  console.log('Health check status:', healthCheck.status);
  const healthData = await healthCheck.json();
  console.log('Health check response:', healthData);
} catch (e) {
  console.log('Health check error:', e.message);
}
