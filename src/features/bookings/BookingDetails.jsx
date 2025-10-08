import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PaymentModal from '../../components/modals/PaymentModal';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { showErrorToast, showSuccessToast } from '../../utils/toast';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);

  useEffect(() => {
    const loadBooking = async () => {
      try {
        setError('');
        setLoading(true);
        const res = await api.getBooking(id);
        const data = res?.data || res;
        setBooking(data);
      } catch (e) {
        setError(e.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    loadBooking();
  }, [id]);

  const tryPayNow = () => {
    if (!booking) return;
    const amount = booking.totalAmount || booking.paymentAmount || 0;
    setPaymentBooking({ id: booking._id, amount, turfName: booking.turfId?.name });
    setShowPayment(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center mb-4 text-primary-600 hover:text-primary-700">
          <ArrowLeftIcon className="w-5 h-5 mr-1" /> Back
        </button>
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const factorLabel = booking.courtType === 'half' ? 'Half Court' : 'Full Court';

  return (
    <div className="max-w-3xl mx-auto p-4">
      <button onClick={() => navigate(-1)} className="inline-flex items-center mb-4 text-primary-600 hover:text-primary-700">
        <ArrowLeftIcon className="w-5 h-5 mr-1" /> Back
      </button>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
        <h1 className="text-2xl font-semibold mb-3">Booking Details</h1>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
          <div className="flex justify-between"><span>Booking ID</span><span>{booking._id}</span></div>
          <div className="flex justify-between"><span>Turf</span><span>{booking.turfId?.name}</span></div>
          <div className="flex justify-between"><span>Date</span><span>{new Date(booking.bookingDate).toLocaleDateString()}</span></div>
          <div className="flex justify-between"><span>Time</span><span>{booking.startTime} - {booking.endTime}</span></div>
          <div className="flex justify-between"><span>Duration</span><span>{booking.duration} mins</span></div>
          <div className="flex justify-between"><span>Court</span><span>{factorLabel}</span></div>
          <div className="flex justify-between"><span>Price / hr</span><span>₹{booking.pricePerHour}</span></div>
          <div className="flex justify-between"><span>Total</span><span>₹{booking.totalAmount || (booking.pricePerHour * (booking.duration/60) * (booking.courtType==='half'?0.5:1))}</span></div>
          <div className="flex justify-between"><span>Status</span><span>{booking.status}</span></div>
          <div className="flex justify-between"><span>Payment</span><span>{booking.paymentStatus}</span></div>
        </div>
        {booking.paymentStatus !== 'paid' && (
          <div className="mt-4">
            <button className="btn-primary" onClick={tryPayNow}>Pay Now</button>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        bookingDetails={paymentBooking}
        onPaymentSuccess={async () => {
          showSuccessToast('Payment successful!');
          try {
            const res = await api.getBooking(id);
            setBooking(res?.data || res);
          } catch (e) {}
          setShowPayment(false);
        }}
        onPaymentFailure={(err) => {
          showErrorToast(err?.message || 'Payment failed');
        }}
      />
    </div>
  );
};

export default BookingDetails;