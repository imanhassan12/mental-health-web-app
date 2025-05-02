import React, { useState } from 'react';

export default function TestPage() {
  console.log('TestPage mounted');
  const [value, setValue] = useState('');
  return (
    <div>
      <h2>Test Page</h2>
      <input value={value} onChange={e => setValue(e.target.value)} placeholder="Type here..." />
    </div>
  );
} 