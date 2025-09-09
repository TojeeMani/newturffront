import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/bookings');
      const data = res?.data || res;
      setBookings(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) {
      setError(e.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-500">
        <ArrowPathIcon className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>
      {bookings.length === 0 ? (
        <div className="p-6 bg-white rounded-xl border text-gray-600">You have no bookings yet.</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b._id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{b.turfId?.name || 'Turf'}</div>
                <div className="text-sm text-gray-600">{new Date(b.bookingDate).toDateString()} • {b.startTime} - {b.endTime}</div>
                <div className="text-sm text-gray-600">Payment: {b.paymentMethod} • Status: {b.status}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">₹{b.totalAmount}</div>
                <div className="text-xs text-gray-500">{b.pricePerHour}/hr</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;


