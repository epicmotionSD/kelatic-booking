// Debug page to check tenant routing
// app/debug/tenant/page.tsx

'use client';

import { useEffect, useState } from 'react';

export default function TenantDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Get current hostname and other info
    const hostname = window.location.hostname;
    const href = window.location.href;
    const cookies = document.cookie;

    setDebugInfo({
      hostname,
      href,
      cookies,
      userAgent: navigator.userAgent,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Tenant Routing Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Current URL Info</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Expected Behavior</h2>
            <div className="text-sm space-y-2">
              <p><strong>For localhost:3000/admin:</strong> Should redirect to platform landing</p>
              <p><strong>For kelatic.localhost:3000/admin:</strong> Should show tenant admin dashboard</p>
              <p><strong>For localhost:3000/admin/command-center:</strong> Should show platform admin</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Test Links</h2>
            <div className="space-y-2">
              <a href="/admin" className="block text-blue-600 hover:underline">
                /admin (current domain)
              </a>
              <a href="/admin/command-center" className="block text-blue-600 hover:underline">
                /admin/command-center (platform admin)
              </a>
              <a href="http://kelatic.localhost:3000/admin" className="block text-blue-600 hover:underline">
                kelatic.localhost:3000/admin (tenant admin)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}