'use server';

const CF_API = 'https://api.cloudflare.com/client/v4';

async function cfFetch(token, endpoint, options = {}) {
  const url = `${CF_API}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) return await res.json();
  return await res.text();
}

export async function verifyToken(token) {
  try {
    const data = await cfFetch(token, '/user/tokens/verify');
    return { success: true, message: `Token valid: ${data.result.status}` };
  } catch (err) { return { success: false, message: err.message }; }
}

export async function getWorkers(token, accountId) {
  try {
    const data = await cfFetch(token, `/accounts/${accountId}/workers/scripts`);
    return { success: true, data: data.result };
  } catch (err) { return { success: false, message: err.message }; }
}

export async function createWorker(token, accountId, name) {
  try {
    const helloCode = `export default { async fetch(request) { return new Response("Hello from ${name}!"); } };`;
    const formData = new FormData();
    
    formData.append('metadata', new Blob([JSON.stringify({ 
      main_module: 'worker.js', 
      compatibility_date: '2024-01-01' 
    })], { type: 'application/json' }), 'metadata.json');
    
    formData.append('worker.js', new Blob([helloCode], { type: 'application/javascript+module' }), 'worker.js');

    // 1. Worker बनाएं
    await cfFetch(token, `/accounts/${accountId}/workers/scripts/${name}`, { 
      method: 'PUT', 
      body: formData 
    });

    // 2. डोमेन (workers.dev route) को Auto-Enable करें
    try {
      await cfFetch(token, `/accounts/${accountId}/workers/scripts/${name}/subdomain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true })
      });
    } catch (domainErr) {
      console.warn('Domain auto-enable failed:', domainErr.message);
    }
    
    return { success: true, message: 'Worker Created & Domain Enabled!' };
  } catch (err) { return { success: false, message: err.message }; }
}

export async function getWorkerCode(token, accountId, workerName) {
  try {
    const code = await cfFetch(token, `/accounts/${accountId}/workers/scripts/${workerName}`, { headers: { 'Accept': 'application/javascript' } });
    let cleanCode = code;
    if (cleanCode.trim().startsWith('--')) {
      const parts = cleanCode.split('name="worker.js"');
      if (parts.length > 1) cleanCode = parts[1].split('--')[0].trim();
    }
    return { success: true, data: cleanCode };
  } catch (err) { return { success: false, message: err.message }; }
}

export async function deployWorker(token, accountId, workerName, code) {
  try {
    const formData = new FormData();
    
    formData.append('metadata', new Blob([JSON.stringify({ 
      main_module: 'worker.js', 
      compatibility_date: '2024-01-01' 
    })], { type: 'application/json' }), 'metadata.json');
    
    formData.append('worker.js', new Blob([code], { type: 'application/javascript+module' }), 'worker.js');

    await cfFetch(token, `/accounts/${accountId}/workers/scripts/${workerName}`, { 
      method: 'PUT', 
      body: formData 
    });
    return { success: true, message: 'Deploy हो गया!' };
  } catch (err) { return { success: false, message: err.message }; }
}

export async function deleteWorker(token, accountId, workerName) {
  try {
    await cfFetch(token, `/accounts/${accountId}/workers/scripts/${workerName}`, { method: 'DELETE' });
    return { success: true, message: 'Delete हो गया!' };
  } catch (err) { return { success: false, message: err.message }; }
}

export async function getSubdomain(token, accountId) {
  try {
    const data = await cfFetch(token, `/accounts/${accountId}/workers/subdomain`);
    return { success: true, data: data.result?.subdomain || '' };
  } catch (err) { return { success: false, message: err.message }; }
}

export async function updateSubdomain(token, accountId, subdomain) {
  try {
    await cfFetch(token, `/accounts/${accountId}/workers/subdomain`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subdomain })
    });
    return { success: true, message: 'Subdomain Updated!' };
  } catch (err) { return { success: false, message: err.message }; }
}