import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, MapPinIcon, UserIcon, CreditCardIcon, BanknotesIcon, TagIcon, InformationCircleIcon, PhoneIcon, ShieldCheckIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import PaymentModal from '../components/modals/PaymentModal';
import { showErrorToast, showSuccessToast } from '../utils/toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state?.bookingData || (() => {
    try {
      const raw = sessionStorage.getItem('bookingData');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  })();
  const { user } = useAuth();

  const [showPayment, setShowPayment] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isValid = !!bookingData && !!bookingData.turf && (Array.isArray(bookingData.selectedSlots) && bookingData.selectedSlots.length > 0);

  useEffect(() => {
    // Persist booking data so reloads or direct visits don't blank out the page
    try {
      if (location.state?.bookingData && isValid) {
        sessionStorage.setItem('bookingData', JSON.stringify(location.state.bookingData));
      }
    } catch (e) {
      // no-op
    }
  }, [location.state, isValid]);

  const totalDuration = useMemo(() => {
    const durPerSlotHours = (bookingData?.turf?.slotDuration || 60) / 60;
    return (bookingData?.selectedSlots?.length || 0) * durPerSlotHours;
  }, [bookingData]);

  const computedAmount = useMemo(() => {
    const pricePerHour = bookingData?.turf?.pricePerHour || 0;
    const durPerSlotHours = (bookingData?.turf?.slotDuration || 60) / 60;
    const count = bookingData?.selectedSlots?.length || 0;
    const factor = bookingData?.courtType === 'half' ? 0.5 : 1;
    return Math.round(pricePerHour * durPerSlotHours * count * factor);
  }, [bookingData]);

  const perSlotPrice = useMemo(() => {
    const pricePerHour = bookingData?.turf?.pricePerHour || 0;
    const durPerSlotHours = (bookingData?.turf?.slotDuration || 60) / 60;
    const factor = bookingData?.courtType === 'half' ? 0.5 : 1;
    return Math.round(pricePerHour * durPerSlotHours * factor);
  }, [bookingData]);

  const formatCurrency = useCallback((amount) => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount || 0));
    } catch {
      return `₹${Number(amount || 0)}`;
    }
  }, []);

  const bookingPerson = useMemo(() => {
    const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.displayName || user?.email || 'Customer';
    return {
      name,
      email: user?.email || '—',
      phone: user?.phone || '—'
    };
  }, [user]);

  const handleConfirm = useCallback(async () => {
    if (!isValid) {
      showErrorToast('Missing booking details');
      return;
    }
    try {
      setSubmitting(true);
      const { turf, selectedDate, selectedSlots, paymentMethod, teamA, teamB, courtType } = bookingData;
      const teamsPayload = [
        { name: teamA?.name?.trim() || 'Team A', players: teamA?.players || '' },
        { name: teamB?.name?.trim() || 'Team B', players: teamB?.players || '' }
      ];

      if (selectedSlots.length === 1) {
        const { startTime, endTime } = selectedSlots[0];
        const res = await api.createBooking({ turfId: turf._id, date: selectedDate, startTime, endTime, paymentMethod, teams: teamsPayload, courtType });
        const booking = res?.data || res;

        if (paymentMethod === 'online') {
          const amount = booking?.totalAmount || computedAmount;
          setPaymentBooking({ id: booking?._id, amount, turfName: turf?.name });
          setShowPayment(true);
        } else {
          showSuccessToast('Booking confirmed!');
          navigate('/bookings/my');
        }
      } else {
        if (paymentMethod === 'online') {
          showErrorToast('Online payment supports single-slot bookings for now.');
          return;
        }
        const slotsPayload = selectedSlots.map(s => ({ date: selectedDate, startTime: s.startTime, endTime: s.endTime, paymentMethod, courtType }));
        await api.createBooking({ turfId: turf._id, slots: slotsPayload, teams: teamsPayload, courtType });
        showSuccessToast('Booking confirmed!');
        navigate('/bookings/my');
      }
    } catch (e) {
      showErrorToast(e?.message || 'Failed to confirm booking');
    } finally {
      setSubmitting(false);
    }
  }, [bookingData, computedAmount, isValid, navigate]);

  if (!isValid) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="flex items-center justify-center mb-3">
            <InformationCircleIcon className="w-6 h-6 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Booking details missing</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Please return to the turf page and select your slots again.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => navigate(-1)} className="px-4 py-2 rounded border">Go Back</button>
            <button onClick={() => navigate('/')} className="px-4 py-2 btn-primary">Browse Turfs</button>
          </div>
        </div>
      </div>
    );
  }

  const { turf, selectedDate, selectedSlots, teamA, teamB, paymentMethod, courtType } = bookingData;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="inline-flex items-center text-primary-600 hover:text-primary-700">
          <ArrowLeftIcon className="w-5 h-5 mr-1" /> Edit Selection
        </button>
        <h1 className="text-xl md:text-2xl font-bold">Review & Confirm</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            {turf.images && turf.images.length > 0 ? (
              <img src={turf.images[0]} alt={turf.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold drop-shadow">{turf.name}</h2>
                {turf.sport && (
                  <span className="px-3 py-1 rounded-full bg-white/90 text-gray-900 text-xs font-medium drop-shadow flex items-center">
                    <TagIcon className="w-4 h-4 mr-1" /> {turf.sport}
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm flex items-center drop-shadow">
                <MapPinIcon className="w-4 h-4 mr-1" />
                <span>{turf.location?.address || turf.location || ''}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 lg:self-start lg:sticky lg:top-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Reservation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 text-sm">
              <div className="flex items-center text-gray-700 dark:text-gray-300"><CalendarIcon className="w-5 h-5 mr-2" /><span>{selectedDate}</span></div>
              <div className="flex items-center text-gray-700 dark:text-gray-300"><ClockIcon className="w-5 h-5 mr-2" /><span>{selectedSlots.length} slot(s)</span></div>
              <div className="flex items-center text-gray-700 dark:text-gray-300"><TagIcon className="w-5 h-5 mr-2" /><span>{courtType === 'half' ? 'Half Court' : 'Full Court'}</span></div>
              <div className="flex items-center text-gray-700 dark:text-gray-300"><BanknotesIcon className="w-5 h-5 mr-2" /><span>Per‑hour: {formatCurrency(turf.pricePerHour || 0)}</span></div>
              <div className="flex items-center text-gray-700 dark:text-gray-300"><ClockIcon className="w-5 h-5 mr-2" /><span>Slot: {(turf.slotDuration || 60)} min</span></div>
              <div className="flex items-center text-gray-700 dark:text-gray-300"><CreditCardIcon className="w-5 h-5 mr-2" /><span>Payment: {paymentMethod}</span></div>
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 mb-6">
              <span className="text-gray-700 dark:text-gray-300">Total Duration</span>
              <span className="text-gray-900 dark:text-white font-semibold">{totalDuration} hours</span>
            </div>
            <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <span className="text-primary-700 dark:text-primary-300 font-medium">Total Amount</span>
              <span className="text-primary-800 dark:text-primary-200 font-bold">{formatCurrency(computedAmount)}</span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-300"><ShieldCheckIcon className="w-4 h-4 mr-1 text-emerald-600" /> Verified Turf</div>
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-300"><LockClosedIcon className="w-4 h-4 mr-1 text-primary-600" /> Secure Checkout</div>
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-300"><CreditCardIcon className="w-4 h-4 mr-1 text-indigo-600" /> Powered by Razorpay</div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Team Details</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm space-y-1">
                <p><span className="font-medium">{teamA?.name || 'Team A'}:</span> {teamA?.players || '—'}</p>
                <p><span className="font-medium">{teamB?.name || 'Team B'}:</span> {teamB?.players || '—'}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Booking Person</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm space-y-1">
                <p className="flex items-center"><UserIcon className="w-4 h-4 mr-2" /><span className="font-medium">{bookingPerson.name}</span></p>
                <p className="flex items-center"><TagIcon className="w-4 h-4 mr-2" /><span>{bookingPerson.email}</span></p>
                <p className="flex items-center"><PhoneIcon className="w-4 h-4 mr-2" /><span>{bookingPerson.phone}</span></p>
              </div>
            </div>

            <button
              disabled={submitting}
              onClick={handleConfirm}
              className={`w-full btn-primary ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {paymentMethod === 'online' ? 'Proceed to Secure Payment' : 'Confirm Reservation'}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">You’ll receive a booking receipt by email.</p>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Need Help?</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm space-y-1">
                <p className="flex items-center"><PhoneIcon className="w-4 h-4 mr-2" /><span>Contact</span>: {turf.contactNumber || turf.phone || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Selected Slots</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">{selectedSlots.length} total</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedSlots.map((slot, idx) => (
              <div key={`${slot.startTime}-${idx}`} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{slot.startTime} - {slot.endTime}</p>
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(perSlotPrice)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Price Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="text-gray-700 dark:text-gray-300">Per‑slot price</span><span className="font-medium text-gray-900 dark:text-white">{formatCurrency(perSlotPrice)}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-700 dark:text-gray-300">Slots</span><span className="font-medium text-gray-900 dark:text-white">{selectedSlots.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-700 dark:text-gray-300">Court factor</span><span className="font-medium text-gray-900 dark:text-white">{courtType === 'half' ? '× 0.5' : '× 1.0'}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-700 dark:text-gray-300">Total duration</span><span className="font-medium text-gray-900 dark:text-white">{totalDuration} hours</span></div>
            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
            <div className="flex items-center justify-between"><span className="text-gray-900 dark:text-white font-semibold">Total</span><span className="text-primary-700 dark:text-primary-300 font-bold">{formatCurrency(computedAmount)}</span></div>
          </div>
        </div>
      </div>

      {(turf.surface || turf.dimensions || (Array.isArray(turf.amenities) && turf.amenities.length)) && (
        <div className="mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Turf Details</h3>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {turf.surface && <p><span className="font-medium">Surface:</span> {turf.surface}</p>}
              {turf.dimensions && <p><span className="font-medium">Dimensions:</span> {turf.dimensions}</p>}
              {Array.isArray(turf.amenities) && turf.amenities.length > 0 && (
                <div>
                  <p className="font-medium mb-1">Amenities:</p>
                  <div className="flex flex-wrap gap-2">
                    {turf.amenities.map((a, i) => (
                      <span key={`${a}-${i}`} className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-2">
            <InformationCircleIcon className="w-5 h-5 mr-2 text-gray-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Policies</h3>
          </div>
          <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc ml-5 space-y-1">
            <li>Please arrive 10 minutes early for check‑in.</li>
            <li>Online payments are secured via encrypted processing.</li>
            <li>For rescheduling, contact the turf at least 24 hours prior.</li>
          </ul>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">By confirming, you agree to our booking terms and refund policy.</p>
        </div>
      </div>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        bookingDetails={paymentBooking}
        onPaymentSuccess={() => {
          showSuccessToast('Payment successful! Booking confirmed.');
          setShowPayment(false);
          navigate('/bookings/my');
        }}
        onPaymentFailure={(err) => {
          showErrorToast(err?.message || 'Payment failed. Please try again.');
        }}
      />
    </div>
  );
};

export default BookingConfirmation;