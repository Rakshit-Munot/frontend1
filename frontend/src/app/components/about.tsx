'use client';

import { useEffect, useState } from 'react';

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  profile_picture: string;
  date_joined: string;
  last_login: string;
  is_active: boolean;
  is_superuser: boolean;
  is_staff: boolean;
  // Role-specific fields
  roll_number?: string;
  department?: string;
  branch?: string;
  year?: string;
  lab_days?: string[];
};

export default function About() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/full-detail`, {
      credentials: 'include',
    })
      .then((res) => {
        console.log("Response status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("Fetched data:", data);
        if (data.authenticated) {
          setUser(data.user);
          console.log("User state set to:", data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    console.log("Current user state:", user);
  }, [user]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-900 text-white rounded-xl shadow-lg max-w-2xl mx-auto mt-10 text-center">
        <h2 className="text-2xl font-bold mb-2">User Profile</h2>
        <p className="text-slate-300">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 bg-slate-900 text-white rounded-xl shadow-lg max-w-2xl mx-auto mt-10 text-center">
        <h2 className="text-2xl font-bold mb-2">User Profile</h2>
        <p className="text-slate-300">You are not logged in.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl shadow-lg max-w-2xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6">User Profile</h2>

      {/* Profile Picture */}
      {user.profile_picture && (
        <div className="mb-6 text-center">
          <img
            src={user.profile_picture}
            alt="Profile Picture"
            className="w-24 h-24 rounded-full mx-auto border-4 border-blue-400"
          />
        </div>
      )}

      {/* Basic Information */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-blue-400 mb-3">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <span className="font-semibold text-gray-300">Username:</span>
            <p className="text-white">{user.username || 'Not provided'}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-300">Email:</span>
            <p className="text-white">{user.email || 'Not provided'}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-300">Role:</span>
            <p className="text-white capitalize">
              <span
                className={`px-2 py-1 rounded text-sm font-medium ${
                  user.role === 'student'
                    ? 'bg-green-600'
                    : user.role === 'faculty'
                    ? 'bg-blue-600'
                    : user.role === 'staff'
                    ? 'bg-purple-600'
                    : 'bg-gray-600'
                }`}
              >
                {user.role || 'Not specified'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Role-Specific Information */}
      {user.role && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-blue-400 mb-3">
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {user.role === 'student' && (
            <>
              <div>
                <span className="font-semibold text-gray-300">Roll Number:</span>
                <p className="text-white">{user.roll_number || 'Not provided'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-300">Branch:</span>
                <p className="text-white">{user.branch || 'Not provided'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-300">Year:</span>
                <p className="text-white">Y{user.year || 'Not provided'}</p>
              </div>
              {user.lab_days && user.lab_days.length > 0 && (
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-300">Lab Day(s):</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {user.lab_days.map((day, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-emerald-600 rounded-full text-sm font-medium"
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

            {(user.role === 'faculty' || user.role === 'staff') && (
              <>
                <div>
                  <span className="font-semibold text-gray-300">Department:</span>
                  <p className="text-white">{user.department || 'Not provided'}</p>
                </div>
                {user.lab_days && user.lab_days.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="font-semibold text-gray-300">Lab Day(s):</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user.lab_days.map((day, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-emerald-600 rounded-full text-sm font-medium"
                        >
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-blue-400 mb-3">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <span className="font-semibold text-gray-300">Account Status:</span>
            <p className="text-white">
              <span
                className={`px-2 py-1 rounded text-sm font-medium ${
                  user.is_active ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
          <div>
            <span className="font-semibold text-gray-300">Date Joined:</span>
            <p className="text-white text-sm">{formatDate(user.date_joined)}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-300">Last Login:</span>
            <p className="text-white text-sm">{formatDate(user.last_login)}</p>
          </div>
        </div>
      </div>

      {/* Permissions */}
      {(user.is_staff || user.is_superuser) && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-blue-400 mb-3">Permissions</h3>
          <div className="flex flex-wrap gap-2">
            {user.is_staff && (
              <span className="px-3 py-1 bg-yellow-600 rounded-full text-sm font-medium">
                Staff Access
              </span>
            )}
            {user.is_superuser && (
              <span className="px-3 py-1 bg-red-600 rounded-full text-sm font-medium">
                Superuser
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
