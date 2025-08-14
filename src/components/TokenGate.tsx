import React, { useState } from 'react';

interface Props {
  onConnect(token: string): void;
}

export default function TokenGate({ onConnect }: Props) {
  const [value, setValue] = useState('');
  return (
    <div className="p-4 border rounded space-y-2 max-w-md">
      <label className="block text-sm font-medium">API Token</label>
      <input
        type="password"
        className="border p-2 w-full rounded"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button
        className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-400"
        disabled={!value}
        onClick={() => onConnect(value.trim())}
      >
        OK
      </button>
    </div>
  );
}
