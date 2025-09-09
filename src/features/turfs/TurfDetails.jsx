import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import turfService from '../../services/turfService';
import { ArrowLeftIcon, MapPinIcon, StarIcon as StarIconSolid, ClockIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import EnhancedImage from '../../components/ui/EnhancedImage';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BookingConfirmModal } from '../../components/modals';

const TurfDetails = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [turf, setTurf] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [activeImage, setActiveImage] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const { isAuthenticated } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');

	const loadTurf = useCallback(async () => {
		try {
			setLoading(true);
			const res = await turfService.getTurf(id);
			setTurf(res.data || null);
		} catch (err) {
			setError(err.message || 'Failed to load turf');
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		loadTurf();
	}, [loadTurf]);

	const images = useMemo(() => Array.isArray(turf?.images) ? turf.images : [], [turf]);

  // Date limits: today to today + advanceBookingDays
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const maxDateStr = useMemo(() => {
    const days = parseInt(turf?.advanceBookingDays || 30, 10);
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }, [turf?.advanceBookingDays]);

  const loadSlots = useCallback(async (dateStr) => {
    if (!id || !dateStr) return;
    try {
      setSlotsLoading(true);
      setSlotsError('');
      setAvailableSlots([]);

      const res = await turfService.getAvailableSlots(id, dateStr);
      const data = res?.data || res;
      // Accept a few shapes: { slots: [...] } or direct array
      const slots = Array.isArray(data?.slots) ? data.slots : (Array.isArray(data) ? data : []);
      setAvailableSlots(slots);
    } catch (e) {
      setSlotsError(e.message || 'Failed to load available slots');
    } finally {
      setSlotsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      loadSlots(selectedDate);
    }
  }, [selectedDate, loadSlots]);

  const handleConfirmBooking = useCallback(async () => {
    if (!selectedDate || selectedSlots.length === 0) return;
    if (!isAuthenticated) {
      showErrorToast('Please login to book a slot');
      navigate('/login', { state: { from: `/turfs/${id}` } });
      return;
    }
    try {
      if (selectedSlots.length === 1) {
        const { startTime, endTime } = selectedSlots[0];
        await api.createBooking({ turfId: id, date: selectedDate, startTime, endTime, paymentMethod });
      } else {
        const slots = selectedSlots.map(s => ({ date: selectedDate, startTime: s.startTime, endTime: s.endTime, paymentMethod }));
        await api.createBooking({ turfId: id, slots });
      }
      showSuccessToast('Booking confirmed!');
      await loadSlots(selectedDate);
      setSelectedSlots([]);
      setShowConfirm(false);
    } catch (e) {
      showErrorToast(e.message || 'Failed to complete booking');
    }
  }, [id, selectedDate, selectedSlots, isAuthenticated, navigate, loadSlots, paymentMethod]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<ArrowPathIcon className="w-6 h-6 animate-spin text-gray-500" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="max-w-5xl mx-auto p-4">
				<button onClick={() => navigate(-1)} className="inline-flex items-center mb-4 text-primary-600 hover:text-primary-700">
					<ArrowLeftIcon className="w-5 h-5 mr-1" /> Back
				</button>
				<div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>
			</div>
		);
	}

	if (!turf) return null;

	return (
		<div className="max-w-6xl mx-auto p-4">
			<button onClick={() => navigate(-1)} className="inline-flex items-center mb-4 text-primary-600 hover:text-primary-700">
				<ArrowLeftIcon className="w-5 h-5 mr-1" /> Back
			</button>

			<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
				<div className="lg:col-span-3">
					<div className="w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
						{images.length > 0 ? (
							<EnhancedImage src={images[activeImage]} alt={turf.name} className="w-full h-full object-cover" sport={turf.sport?.toLowerCase()} />
						) : (
							<div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
						)}
					</div>
					{images.length > 1 && (
						<div className="mt-3 grid grid-cols-5 md:grid-cols-6 gap-2">
							{images.map((img, idx) => (
								<button key={idx} onClick={() => setActiveImage(idx)} className={`rounded-lg overflow-hidden border ${activeImage === idx ? 'border-primary-600' : 'border-gray-200 dark:border-gray-700'}`}>
									<img src={img} alt={`${turf.name} ${idx + 1}`} className="w-full h-16 object-cover" />
								</button>
							))}
						</div>
					)}
				</div>

				<div className="lg:col-span-2">
					<h1 className="text-2xl font-bold mb-2">{turf.name}</h1>
					<div className="flex items-center text-gray-600 dark:text-gray-300 mb-3">
						<MapPinIcon className="w-5 h-5 mr-1" />
						<span>{turf.location?.address || 'Location not specified'}</span>
					</div>
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center">
							{[...Array(5)].map((_, i) => (
								<StarIconSolid key={i} className={`w-5 h-5 ${i < Math.floor(turf.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
							))}
							<span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{turf.rating || 'New'}{turf.totalReviews > 0 && ` (${turf.totalReviews})`}</span>
						</div>
						<div className="text-2xl font-bold text-primary-600">₹{turf.pricePerHour}/hr</div>
					</div>

					{turf.description && (
						<div className="mb-4">
							<h2 className="text-lg font-semibold mb-1">About this turf</h2>
							<p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{turf.description}</p>
						</div>
					)}

					{Array.isArray(turf.amenities) && turf.amenities.length > 0 && (
						<div className="mb-4">
							<h2 className="text-lg font-semibold mb-2">Amenities</h2>
							<div className="flex flex-wrap gap-2">
								{turf.amenities.map((a, i) => (
									<span key={i} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-xs">{a}</span>
								))}
							</div>
						</div>
					)}

					<div className="mb-4">
						<h2 className="text-lg font-semibold mb-2">Availability</h2>
						<div className="flex items-center gap-3 mb-3">
							<label className="text-sm text-gray-700 dark:text-gray-300">Date</label>
							<input
								type="date"
								value={selectedDate}
								onChange={(e) => setSelectedDate(e.target.value)}
								min={todayStr}
								max={maxDateStr}
								className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
							/>
						</div>
						<div className="text-sm text-gray-700 dark:text-gray-300 flex items-center mb-2"><ClockIcon className="w-4 h-4 mr-1" /> Slot duration: {turf.slotDuration || 60} mins</div>
						{slotsLoading && (
							<div className="text-sm text-gray-500 flex items-center"><ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" /> Loading slots...</div>
						)}
						{slotsError && (
							<div className="text-sm text-red-600">{slotsError}</div>
						)}
						{!slotsLoading && !slotsError && (
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
								{Array.isArray(availableSlots) && availableSlots.length > 0 ? (
									availableSlots.map((slot, idx) => {
										const start = slot.startTime || slot.start || slot.start_time;
										const end = slot.endTime || slot.end || slot.end_time;
										const isAvailable = slot.isAvailable ?? slot.available ?? true;
										const isSelected = selectedSlots.some(s => s.startTime === start && s.endTime === end);
										return (
											<button
												key={idx}
												disabled={!isAvailable}
												onClick={() => {
													if (!isAvailable) return;
													setSelectedSlots(prev => {
														const exists = prev.some(s => s.startTime === start && s.endTime === end);
														return exists ? prev.filter(s => !(s.startTime === start && s.endTime === end)) : [...prev, { startTime: start, endTime: end }];
													});
												}}
												aria-pressed={isSelected}
												className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
													!isAvailable
														? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 cursor-not-allowed line-through'
														: isSelected
															? 'bg-primary-600 text-white border-primary-600 shadow-inner'
															: 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-800'
												}`}
											>
												{start} - {end}
												{isSelected && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-white/20 border border-white/30">Selected</span>}
											</button>
										);
									})
								) : (
									<div className="text-sm text-gray-500 col-span-full">No slots available for this date.</div>
								)}
							</div>
						)}
					</div>

					<div className="mt-6">
						{!isAuthenticated && (
							<div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Login is required to book a slot.</div>
						)}
            <div className="mb-3">
              <label className="text-sm text-gray-700 dark:text-gray-300 mr-2">Payment</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                <option value="online">Online</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
						<button
							disabled={!selectedSlots.length}
							onClick={() => setShowConfirm(true)}
							className={`btn-primary w-full ${!selectedSlots.length ? 'opacity-60 cursor-not-allowed' : ''}`}
						>
							Review & Confirm ({selectedSlots.length})
						</button>
					</div>

					<BookingConfirmModal
						open={showConfirm}
						onClose={() => setShowConfirm(false)}
						onConfirm={handleConfirmBooking}
						turf={turf}
						date={selectedDate}
						startTime={selectedSlots[0]?.startTime}
						endTime={selectedSlots[0]?.endTime}
						pricePerHour={turf.pricePerHour}
						durationMinutes={turf.slotDuration}
						selectedSlots={selectedSlots}
						totalAmount={selectedSlots.length * turf.pricePerHour * ((turf.slotDuration || 60) / 60)}
					/>
				</div>
			</div>
		</div>
	);
};

export default TurfDetails;

