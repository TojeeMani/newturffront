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

  const formattedDate = useMemo(() => {
    try {
      if (!bookingData?.selectedDate) return bookingData?.selectedDate || '';
      const d = new Date(`${bookingData.selectedDate}T00:00:00`);
      return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(d);
    } catch {
      return bookingData?.selectedDate || '';
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate(-1)} 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" /> 
              Back to Selection
        </button>
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Review & Confirm</h1>
              <p className="text-gray-600 dark:text-gray-400">Please review your booking details before proceeding</p>
            </div>
            <div className="w-24"></div> {/* Spacer for centering */}
      </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center text-sm">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-semibold">✓</div>
                  <span className="ml-2 text-green-600 dark:text-green-400 font-medium">Select</span>
        </div>
                <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 mx-4"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">2</div>
                  <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">Review</span>
      </div>
                <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 mx-4"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center text-xs font-semibold">3</div>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">Pay</span>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Turf Image Section */}
          <div className="xl:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="relative w-full aspect-video overflow-hidden">
                {turf.images && turf.images.length > 0 ? (
                  <img 
                    src={turf.images[0]} 
                    alt={turf.name} 
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <TagIcon className="w-8 h-8 text-gray-500" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">No Image Available</p>
                    </div>
            </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl md:text-3xl font-bold drop-shadow-lg mb-2">{turf.name}</h2>
                      <div className="flex items-center text-sm drop-shadow">
                        <MapPinIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span className="truncate">{turf.location?.address || turf.location || ''}</span>
            </div>
            </div>
                    {turf.sport && (
                      <span className="px-4 py-2 rounded-full bg-white/95 text-gray-900 text-sm font-semibold drop-shadow-lg flex items-center ml-4 flex-shrink-0">
                        <TagIcon className="w-4 h-4 mr-2" /> 
                        {turf.sport.charAt(0).toUpperCase() + turf.sport.slice(1)}
                      </span>
                    )}
            </div>
            </div>
              </div>
            </div>

            {/* Selected Time Slots Section - Prominent Position */}
            <div className="mt-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <ClockIcon className="w-6 h-6 mr-2" />
                      Your Selected Time Slots
                    </h3>
                    <span className="px-3 py-1 bg-white/20 text-white text-sm font-semibold rounded-full">
                      {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedSlots.map((slot, idx) => (
                      <div key={`${slot.startTime}-${idx}`} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:scale-105">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <ClockIcon className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              Duration: {turf.slotDuration || 60} minutes
                            </p>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                              {formatCurrency(perSlotPrice)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Quick Summary */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-indigo-800 dark:text-indigo-200 font-semibold">Total Duration</p>
                        <p className="text-indigo-600 dark:text-indigo-400 text-sm">{totalDuration} hours</p>
                      </div>
                      <div className="text-right">
                        <p className="text-indigo-800 dark:text-indigo-200 font-semibold">Court Type</p>
                        <p className="text-indigo-600 dark:text-indigo-400 text-sm">{courtType === 'half' ? 'Half Court' : 'Full Court'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          {/* Reservation Summary Sidebar */}
          <div className="xl:col-span-2 xl:self-start xl:sticky xl:top-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <CreditCardIcon className="w-6 h-6 mr-2" />
                  Reservation Summary
                </h3>
                <p className="text-blue-100 text-sm mt-1">Review your booking details</p>
              </div>

              <div className="p-6">
                {/* Booking Details Grid */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{formattedDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedSlots.length} slot(s) • {totalDuration} hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <TagIcon className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Court Type</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{courtType === 'half' ? 'Half Court' : 'Full Court'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <BanknotesIcon className="w-5 h-5 text-orange-600 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Rate</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(turf.pricePerHour || 0)}/hour</p>
              </div>
            </div>

                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <CreditCardIcon className="w-5 h-5 text-indigo-600 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Payment</p>
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">{paymentMethod}</p>
                    </div>
                  </div>
                </div>
                {/* Total Amount Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-700 dark:text-green-300 font-semibold text-lg">Total Amount</p>
                      <p className="text-green-600 dark:text-green-400 text-sm">Including all charges</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(computedAmount)}</p>
                      <p className="text-green-600 dark:text-green-400 text-xs">Final price</p>
                    </div>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <ShieldCheckIcon className="w-5 h-5 text-emerald-600 mb-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-300 text-center">Verified</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <LockClosedIcon className="w-5 h-5 text-blue-600 mb-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-300 text-center">Secure</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <CreditCardIcon className="w-5 h-5 text-indigo-600 mb-1" />
                    <span className="text-xs text-gray-600 dark:text-gray-300 text-center">Razorpay</span>
                  </div>
                </div>

                {/* Team Details */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Team Details
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">{teamA?.name || 'Team A'}</p>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">{teamA?.players || 'No players listed'}</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                      <p className="font-semibold text-purple-900 dark:text-purple-100 text-sm mb-1">{teamB?.name || 'Team B'}</p>
                      <p className="text-purple-700 dark:text-purple-300 text-sm">{teamB?.players || 'No players listed'}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Person */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <UserIcon className="w-5 h-5 mr-2 text-green-600" />
                    Booking Person
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-3 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{bookingPerson.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <TagIcon className="w-4 h-4 mr-3 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{bookingPerson.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-3 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">{bookingPerson.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
            <button
              disabled={submitting}
              onClick={handleConfirm}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 ${
                    submitting 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : paymentMethod === 'online'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    paymentMethod === 'online' ? 'Proceed to Secure Payment' : 'Confirm Reservation'
                  )}
            </button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                  You'll receive a booking receipt by email and SMS
                </p>

                {/* Contact Support */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <PhoneIcon className="w-5 h-5 mr-2 text-orange-600" />
                    Need Help?
                  </h3>
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <p className="text-orange-800 dark:text-orange-200 text-sm font-medium">
                      Contact: {turf.contactNumber || turf.phone || 'Not available'}
                    </p>
                    <p className="text-orange-600 dark:text-orange-400 text-xs mt-1">
                      Available 24/7 for support
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Price Breakdown Section */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <BanknotesIcon className="w-6 h-6 mr-2" />
                Price Breakdown
              </h3>
      </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Per-slot price</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(perSlotPrice)}</span>
          </div>
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Number of slots</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedSlots.length}</span>
                </div>
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Court type factor</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{courtType === 'half' ? '× 0.5 (Half Court)' : '× 1.0 (Full Court)'}</span>
              </div>
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Total duration</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{totalDuration} hours</span>
          </div>
                <div className="border-t-2 border-gray-300 dark:border-gray-600 my-4"></div>
                <div className="flex items-center justify-between py-4 px-6 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <span className="text-emerald-800 dark:text-emerald-200 font-bold text-lg">Total Amount</span>
                  <span className="text-emerald-900 dark:text-emerald-100 font-bold text-2xl">{formatCurrency(computedAmount)}</span>
        </div>
      </div>
          </div>
        </div>
      </div>

        {/* Turf Details Section */}
      {(turf.surface || turf.dimensions || (Array.isArray(turf.amenities) && turf.amenities.length)) && (
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <TagIcon className="w-6 h-6 mr-2" />
                  Turf Details
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {turf.surface && (
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-3">
                        <TagIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Surface Type</p>
                        <p className="font-semibold text-gray-900 dark:text-white capitalize">{turf.surface}</p>
                      </div>
                    </div>
                  )}
                  {turf.dimensions && (
                    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                        <MapPinIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Dimensions</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{turf.dimensions}</p>
                      </div>
                    </div>
                  )}
              {Array.isArray(turf.amenities) && turf.amenities.length > 0 && (
                <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-3">Available Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {turf.amenities.map((a, i) => (
                          <span key={`${a}-${i}`} className="px-3 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-800 dark:text-indigo-200 text-sm font-medium border border-indigo-200 dark:border-indigo-800">
                            {a}
                          </span>
                    ))}
                  </div>
                </div>
              )}
                </div>
            </div>
          </div>
        </div>
      )}

        {/* Policies Section */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4">
              <div className="flex items-center">
                <InformationCircleIcon className="w-6 h-6 mr-2 text-white" />
                <h3 className="text-xl font-bold text-white">Booking Policies</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">Early Arrival</p>
                    <p className="text-amber-700 dark:text-amber-300 text-sm">Please arrive 10–15 minutes early for check-in to ensure a smooth start to your session.</p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Secure Payments</p>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">All online payments are secured via encrypted processing and PCI-DSS compliance standards.</p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200 mb-1">Rescheduling</p>
                    <p className="text-green-700 dark:text-green-300 text-sm">For rescheduling, please contact the turf at least 24 hours prior to your booking time.</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  By confirming this booking, you agree to our booking terms and refund policy.
                </p>
              </div>
          </div>
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
    </div>
  );
};

export default BookingConfirmation;