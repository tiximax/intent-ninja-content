// Debug script to test live content generation

const endpoint = 'https://msnakgazemgwnxzgfiio.supabase.co/functions/v1/generate-content';
const anon = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing live content generation...');
console.log('Endpoint:', endpoint);
console.log('Has anon key:', !!anon);

async function testGeneration() {
  try {
    const body = {
      title: 'SEO cho kẹo hồng sâm Achimmadang',
      keywords: ['kẹo hồng sâm', 'Achimmadang'],
      language: 'vi',
      tone: 'professional',
      wordCount: 2000,
    };

    console.log('Sending request...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anon}`,
        'x-request-id': 'debug-test-' + Date.now(),
      },
      body: JSON.stringify(body),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const data = await response.json();
    console.log('Response data keys:', Object.keys(data));
    console.log('Success:', data.success);
    console.log('Provider used:', data.providerUsed);
    
    if (data.content) {
      const text = String(data.content.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const wordCount = text.split(' ').filter(Boolean).length;
      console.log('Content word count:', wordCount);
      console.log('Meta description length:', String(data.content.metaDescription || '').length);
    }
    
    if (data.error) {
      console.log('Error:', data.error);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testGeneration();