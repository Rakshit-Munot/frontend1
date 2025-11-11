'use client';

import { useState } from 'react';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/import-users`; // adjust if needed

interface FailedImport {
  row: number;
  error: string;
}
const UserImportForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setMessage('');
  setErrors([]);
  setLoading(true);

  if (!file) {
    setErrors(['Please select an Excel file.']);
    setLoading(false);
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok) {
      setMessage(`✅ ${data.success_count} users imported successfully.`);

      // Show import failures if any
      if (data.failed && data.failed.length > 0) {
        setErrors(
          (data.failed as FailedImport[]).map(
            (f) => `❌ Row ${f.row}: ${f.error}`
          )
        );
      }
    } else {
      const msg = data.detail || 'Import failed.';
      setErrors([typeof msg === 'string' ? msg : JSON.stringify(msg)]);
    }
    } catch {
      setErrors(['❌ Server error. Please try again.']);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-gray-900 text-white border border-gray-700 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Import Users via Excel</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-medium"
        >
          {loading ? 'Importing...' : 'Upload & Import'}
        </button>
      </form>

      {message && (
        <div className="mt-4 p-3 bg-green-600 text-white rounded-md text-sm">{message}</div>
      )}

      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-600 text-white rounded-md text-sm space-y-1">
          {errors.map((err, idx) => (
            <p key={idx}>{err}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserImportForm;
