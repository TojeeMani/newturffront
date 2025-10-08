import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import turfService from '../../services/turfService';
import { ArrowLeftIcon, MapPinIcon, StarIcon as StarIconSolid, ClockIcon } from '@heroicons/react/24/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import EnhancedImage from '../../components/ui/EnhancedImage';
import PaymentModal from '../../components/modals/PaymentModal';
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
  const [courtType, setCourtType] = useState('full');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [teamA, setTeamA] = useState({ name: 'Team A', players: '' });
  const [teamB, setTeamB] = useState({ name: 'Team B', players: '' });
  const [canReview, setCanReview] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const location = useLocation();

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

  const loadReviews = useCallback(async () => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      setReviewsError('');
      const res = await turfService.getTurfReviews(id);
      const data = res?.data || res;
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setReviewsError(err.message || 'Failed to load reviews');
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

	useEffect(() => {
		loadTurf();
    loadReviews();
	}, [loadTurf, loadReviews]);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!isAuthenticated || !id) { setCanReview(false); return; }
      try {
        const eligible = await turfService.canReviewTurf(id);
        setCanReview(!!eligible);
      } catch { setCanReview(false); }
    };
    checkEligibility();
  }, [id, isAuthenticated]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('review') === '1') {
      // Attempt to open review panel: set eligibility if logged in
      (async () => {
        if (isAuthenticated) {
          const eligible = await turfService.canReviewTurf(id);
          setCanReview(!!eligible);
        }
      })();
    }
  }, [location.search, id, isAuthenticated]);

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
      const teamsPayload = [
        { name: teamA.name?.trim() || 'Team A', players: (teamA.players || '') },
        { name: teamB.name?.trim() || 'Team B', players: (teamB.players || '') }
      ];
      if (selectedSlots.length === 1) {
        const { startTime, endTime } = selectedSlots[0];
        const res = await api.createBooking({ turfId: id, date: selectedDate, startTime, endTime, paymentMethod, teams: teamsPayload, courtType });
        const booking = res?.data || res;

        if (paymentMethod === 'online') {
          const factor = courtType === 'half' ? 0.5 : 1;
          const amount = booking?.totalAmount || (turf.pricePerHour * ((turf.slotDuration || 60) / 60) * factor);
          setPaymentBooking({ id: booking?._id, amount, turfName: turf?.name });
          setShowPayment(true);
        } else {
          showSuccessToast('Booking confirmed!');
          await loadSlots(selectedDate);
          setSelectedSlots([]);
          setShowConfirm(false);
        }
      } else {
        if (paymentMethod === 'online') {
          showErrorToast('Online payment supports single-slot bookings for now.');
          return;
        }
        const slots = selectedSlots.map(s => ({ date: selectedDate, startTime: s.startTime, endTime: s.endTime, paymentMethod, courtType }));
        await api.createBooking({ turfId: id, slots, teams: teamsPayload, courtType });
        showSuccessToast('Booking confirmed!');
        await loadSlots(selectedDate);
        setSelectedSlots([]);
        setShowConfirm(false);
      }
    } catch (e) {
      showErrorToast(e.message || 'Failed to complete booking');
    }
  }, [id, selectedDate, selectedSlots, isAuthenticated, navigate, loadSlots, paymentMethod, courtType, turf]);

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

          {canReview && (
            <div className="mb-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-2">Rate and review</h2>
              <div className="flex items-center gap-2 mb-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setMyRating(n)} aria-label={`Rate ${n}`}
                    className={`w-6 h-6 ${n <= myRating ? 'text-yellow-400' : 'text-gray-300'}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </button>
                ))}
              </div>
              <textarea value={myComment} onChange={e=>setMyComment(e.target.value)} rows={3}
                placeholder="Share your experience..."
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 mb-2" />
              <button disabled={!myRating || submittingReview} onClick={async ()=>{
                if (!myRating) return;
                try {
                  setSubmittingReview(true);
                  await turfService.createReview(id, { rating: myRating, comment: myComment });
                  showSuccessToast('Thank you for your review!');
                  setCanReview(false);
                  // Refresh turf to update rating/totalReviews and reload reviews
                  await loadTurf();
                  await loadReviews();
                } catch (e) {
                  showErrorToast(e.message || 'Failed to submit review');
                } finally { setSubmittingReview(false); }
              }} className={`btn-primary ${!myRating ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {submittingReview ? 'Submitting...' : 'Submit review'}
              </button>
            </div>
          )}

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

					{/* User Reviews Section - Flipkart Style */}
					<div className="mb-6">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold">Ratings & Reviews</h2>
							<div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
								<span>{reviews.length} Reviews</span>
							</div>
						</div>

						{reviewsLoading && (
							<div className="text-sm text-gray-500 flex items-center justify-center py-8">
								<ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" /> Loading reviews...
							</div>
						)}

						{reviewsError && (
							<div className="text-sm text-red-600 mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
								{reviewsError}
							</div>
						)}

						{!reviewsLoading && !reviewsError && (
							<>
								{/* Overall Rating Summary */}
								{reviews.length > 0 && (
									<div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
										<div className="flex items-center justify-between">
											<div className="flex items-center">
												<div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mr-4">
													{turf.rating ? turf.rating.toFixed(1) : 'New'}
												</div>
												<div>
													<div className="flex items-center mb-1">
														{[...Array(5)].map((_, i) => (
															<StarIconSolid key={i} className={`w-5 h-5 ${i < Math.floor(turf.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
														))}
													</div>
													<div className="text-sm text-gray-600 dark:text-gray-400">
														{turf.totalReviews || reviews.length} ratings & {reviews.length} reviews
													</div>
												</div>
											</div>
											
											{/* Rating Distribution */}
											<div className="flex-1 max-w-xs ml-8">
												{[5, 4, 3, 2, 1].map(rating => {
													const count = reviews.filter(r => r.rating === rating).length;
													const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
													return (
														<div key={rating} className="flex items-center mb-1">
															<span className="text-sm w-3 text-gray-600 dark:text-gray-400">{rating}</span>
															<StarIconSolid className="w-3 h-3 text-yellow-400 mx-1" />
															<div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mx-2">
																<div 
																	className="bg-green-500 h-2 rounded-full transition-all duration-300"
																	style={{ width: `${percentage}%` }}
																></div>
															</div>
															<span className="text-xs text-gray-500 dark:text-gray-400 w-8">{count}</span>
														</div>
													);
												})}
											</div>
										</div>
									</div>
								)}

								{/* Individual Reviews */}
								<div className="space-y-4">
									{reviews.length > 0 ? (
										reviews.map((review, idx) => (
											<div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
												<div className="flex items-start space-x-4">
													{/* User Avatar */}
													<div className="flex-shrink-0">
														<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
															{(review.userId?.name || 'A').charAt(0).toUpperCase()}
														</div>
													</div>
													
													{/* Review Content */}
													<div className="flex-1 min-w-0">
														<div className="flex items-center justify-between mb-2">
															<div>
																<h4 className="font-medium text-gray-900 dark:text-gray-100">
																	{review.userId?.name || 'Anonymous User'}
																</h4>
																<div className="flex items-center mt-1">
																	<div className="flex items-center mr-3">
																		{[...Array(5)].map((_, i) => (
																			<StarIconSolid key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
																		))}
																	</div>
																	<span className="text-sm text-gray-600 dark:text-gray-400">
																		{review.bookingId?.bookingDate ? new Date(review.bookingId.bookingDate).toLocaleDateString('en-IN', {
																			day: 'numeric',
																			month: 'short',
																			year: 'numeric'
																		}) : new Date(review.createdAt).toLocaleDateString('en-IN', {
																			day: 'numeric',
																			month: 'short',
																			year: 'numeric'
																		})}
																	</span>
																</div>
															</div>
															
															{/* Verified Badge */}
															<div className="flex items-center">
																<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
																	<svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
																		<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
																	</svg>
																	Verified Booking
																</span>
															</div>
														</div>
														
														{/* Review Text */}
														{review.comment && (
															<div className="mt-3">
																<p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed">
																	{review.comment}
																</p>
															</div>
														)}
														
														{/* Helpful Actions */}
														<div className="flex items-center mt-4 space-x-4">
															<button className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
																<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L9 6v4m-2 4h2m0 0h2m-2 0v2m0-2v-2" />
																</svg>
																Helpful
															</button>
															<button className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
																<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
																</svg>
																Report
															</button>
														</div>
													</div>
												</div>
											</div>
										))
									) : (
										<div className="text-center py-12">
											<div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
												<StarIconSolid className="w-8 h-8 text-gray-400" />
											</div>
											<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No reviews yet</h3>
											<p className="text-gray-500 dark:text-gray-400 mb-4">
												Be the first to review this turf and help others make informed decisions!
											</p>
										</div>
									)}
								</div>
							</>
						)}
					</div>

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
            {selectedSlots.length > 0 && (
              <div className="mb-4 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-2">Teams (optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Team A Name</label>
                    <input value={teamA.name} onChange={e=>setTeamA(prev=>({...prev, name:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" placeholder="Team A" />
                    <label className="block text-xs text-gray-600 dark:text-gray-300 mt-2 mb-1">Team A Players (comma‑separated)</label>
                    <input value={teamA.players} onChange={e=>setTeamA(prev=>({...prev, players:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" placeholder="e.g. John, Mike, Ali" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">Team B Name</label>
                    <input value={teamB.name} onChange={e=>setTeamB(prev=>({...prev, name:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" placeholder="Team B" />
                    <label className="block text-xs text-gray-600 dark:text-gray-300 mt-2 mb-1">Team B Players (comma‑separated)</label>
                    <input value={teamB.players} onChange={e=>setTeamB(prev=>({...prev, players:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700" placeholder="e.g. Sam, Raj, Omar" />
                  </div>
                </div>
              </div>
            )}
						{!isAuthenticated && (
							<div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Login is required to book a slot.</div>
						)}
            <div className="mb-3">
              <label className="text-sm text-gray-700 dark:text-gray-300 mr-2">Court Type</label>
              <select value={courtType} onChange={(e) => setCourtType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700">
                <option value="full">Full Court</option>
                <option value="half">Half Court</option>
              </select>
            </div>
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
            courtType={courtType}
            totalAmount={selectedSlots.length * turf.pricePerHour * ((turf.slotDuration || 60) / 60) * (courtType === 'half' ? 0.5 : 1)}
          />

          <PaymentModal
            isOpen={showPayment}
            onClose={() => { setShowPayment(false); setShowConfirm(false); }}
            bookingDetails={paymentBooking}
            onPaymentSuccess={async () => {
              showSuccessToast('Payment successful! Booking confirmed.');
              await loadSlots(selectedDate);
              setSelectedSlots([]);
              setShowPayment(false);
              // Redirect to My Bookings page after successful payment
              navigate('/bookings/my');
            }}
            onPaymentFailure={(err) => {
              showErrorToast(err?.message || 'Payment failed. Please try again.');
            }}
          />
				</div>
			</div>
		</div>
	);
};

export default TurfDetails;

