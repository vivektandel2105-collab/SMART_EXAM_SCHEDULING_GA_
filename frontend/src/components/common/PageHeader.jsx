import React from 'react';

// The page title now lives in the hero band (App.jsx); PageHeader only renders the action row.
export default function PageHeader({ action }) {
  if (!action) return null;
  return <div className="flex justify-end pb-2">{action}</div>;
}
