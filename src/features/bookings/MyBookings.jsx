import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowPathIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

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

  const openRatingModal = (booking) => {
    setSelectedBooking(booking);
    setRating(0);
    setComment('');
    setShowRatingModal(true);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedBooking(null);
    setRating(0);
    setComment('');
  };

  const submitRating = async () => {
    if (!selectedBooking || rating === 0) return;
    
    try {
      setSubmittingRating(true);
      console.log('📤 Submitting rating data:', {
        bookingId: selectedBooking._id,
        rating: rating,
        comment: comment.trim() || undefined
      });
      
      await api.post(`/turfs/${selectedBooking.turfId._id}/reviews`, {
        bookingId: selectedBooking._id,
        rating,
        comment: comment.trim() || undefined
      });
      
      // Refresh bookings to update the UI
      await load();
      closeRatingModal();
    } catch (err) {
      console.error('❌ Rating submission error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Failed to submit rating';
      
      // Handle specific error cases
      if (errorMessage.includes('already reviewed')) {
        setError('You have already reviewed this booking/turf. You can only review once per booking.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmittingRating(false);
    }
  };

  const canRate = (booking) => {
    return booking.status === 'completed' && booking.turfId?._id && !booking.hasReview;
  };

  const getUserRating = (booking) => {
    const r = booking?.reviews && booking.reviews.length > 0 ? booking.reviews[0]?.rating : null;
    return typeof r === 'number' ? r : (r ? parseInt(r, 10) : null);
  };

  const getUserComment = (booking) => {
    const c = booking?.reviews && booking.reviews.length > 0 ? booking.reviews[0]?.comment : '';
    return (typeof c === 'string' ? c.trim() : '') || '';
  };

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
            <div
              key={b._id}
              className="bg-white rounded-xl border p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/bookings/${b._id}`)}
              role="button"
              tabIndex={0}
            >
              <div>
                <div className="font-semibold">{b.turfId?.name || 'Turf'}</div>
                <div className="text-sm text-gray-600">{new Date(b.bookingDate).toDateString()} • {b.startTime} - {b.endTime}</div>
                <div className="text-sm text-gray-600">Payment: {b.paymentMethod} • Status: {b.status}</div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <div className="text-lg font-bold">₹{b.totalAmount}</div>
                  <div className="text-xs text-gray-500">{b.pricePerHour}/hr</div>
                </div>
                {canRate(b) ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); openRatingModal(b); }}
                    className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                  >
                    <StarIcon className="w-4 h-4" />
                    Rate
                  </button>
                ) : (
                  (() => {
                    const ratingVal = getUserRating(b);
                    const commentVal = getUserComment(b);
                    return ratingVal ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map((i) => (
                            i <= ratingVal ? (
                              <StarIconSolid key={i} className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <StarIcon key={i} className="w-4 h-4 text-gray-300" />
                            )
                          ))}
                          <span className="text-sm font-medium text-gray-700 ml-1">{ratingVal}/5</span>
                        </div>
                        {commentVal && (
                          <div className="mt-1 text-xs text-gray-500 max-w-[240px] truncate" title={commentVal}>
                            {commentVal}
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Rating Modal */}
      {showRatingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Rate Your Experience</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                How was your experience at <span className="font-medium">{selectedBooking.turfId?.name}</span>?
              </p>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    {star <= rating ? (
                      <StarIconSolid className="w-8 h-8 text-yellow-400" />
                    ) : (
                      <StarIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (optional)"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 text-sm"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{comment.length}/500 characters</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={closeRatingModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submittingRating}
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                disabled={rating === 0 || submittingRating}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;


