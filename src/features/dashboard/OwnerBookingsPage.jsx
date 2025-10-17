import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Phone, DollarSign, Plus, X, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OwnerDashboardNav } from '../../components/layout';
import turfService from '../../services/turfService';
import api from '../../services/api';

const OwnerBookingsPage = () => {
  const { user } = useAuth();
  const [turfs, setTurfs] = useState([]);
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const getTodayYmd = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  
  const getMaxAllowedDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 5); // Add 5 days to current date
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  
  const todayYmd = getTodayYmd();
  const maxAllowedDate = getMaxAllowedDate();
  const [selectedDate, setSelectedDate] = useState(todayYmd);

  const openDetails = (booking) => {
    setSelectedBooking(booking || null);
    setShowDetailsModal(!!booking);
  };
  const closeDetails = () => {
    setShowDetailsModal(false);
    setSelectedBooking(null);
  };
  
  const handleDateChange = (newDate) => {
    if (newDate >= todayYmd && newDate <= maxAllowedDate) {
      setSelectedDate(newDate);
    } else {
      setError('You can only allocate turfs for the next 5 days from today');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAllocateSlots = async () => {
    try {
      if (!allocationData.slots.length) {
        setError('Please add at least one slot');
        return;
      }
      
      if (allocationData.date < todayYmd || allocationData.date > maxAllowedDate) {
        setError('Selected date is outside the allowed allocation period');
        return;
      }

      await turfService.allocateSlotsForDay(selectedTurf, allocationData);
      setSuccess('Slots allocated successfully for the selected day');
      setTimeout(() => setSuccess(''), 3000);
      setShowAllocateSlotsModal(false);
      setAllocationData({ date: todayYmd, slots: [] });
      await loadBookings();
    } catch (e) {
      setError(e.message || 'Failed to allocate slots');
    }
  };

  const addSlotToAllocation = () => {
    const startTime = document.getElementById('allocation-start-time')?.value;
    const endTime = document.getElementById('allocation-end-time')?.value;
    const price = document.getElementById('allocation-price')?.value;

    if (!startTime || !endTime || !price) {
      setError('Please fill in all slot details');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    const toMinutes = (t) => {
      const [h, m] = String(t || '').split(':').map(Number);
      return (isNaN(h) || isNaN(m)) ? NaN : (h * 60 + m);
    };

    // Prevent duplicates and overlaps within the UI list
    const overlaps = (aStart, aEnd, bStart, bEnd) => {
      const s1 = toMinutes(aStart); const e1 = toMinutes(aEnd);
      const s2 = toMinutes(bStart); const e2 = toMinutes(bEnd);
      if ([s1,e1,s2,e2].some(Number.isNaN)) return false;
      return Math.max(s1, s2) < Math.min(e1, e2);
    };

    // If allocating for today, do not allow past-ended slots
    const now = new Date();
    const allocDate = new Date(allocationData.date);
    if (now.toDateString() === allocDate.toDateString()) {
      const endMinutes = toMinutes(endTime);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (!Number.isNaN(endMinutes) && endMinutes <= nowMinutes) {
        setError('Cannot add slots that already ended today');
        return;
      }
    }

    const hasDuplicate = allocationData.slots.some(s => s.startTime === startTime && s.endTime === endTime);
    if (hasDuplicate) {
      setError('This slot is already added');
      return;
    }
    const hasOverlap = allocationData.slots.some(s => overlaps(s.startTime, s.endTime, startTime, endTime));
    if (hasOverlap) {
      setError('This slot overlaps an existing one');
      return;
    }

    const newSlot = { startTime, endTime, price: parseInt(price) };

    setAllocationData(prev => ({ ...prev, slots: [...prev.slots, newSlot] }));

    // Clear form
    document.getElementById('allocation-start-time').value = '';
    document.getElementById('allocation-end-time').value = '';
    document.getElementById('allocation-price').value = '';
    setError('');
  };

  const removeSlotFromAllocation = (index) => {
    setAllocationData(prev => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index)
    }));
  };
  const [showAddBookingModal, setShowAddBookingModal] = useState(false);
  const [showAllocateSlotsModal, setShowAllocateSlotsModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]); // normalized display strings
  const [availableSlotsRaw, setAvailableSlotsRaw] = useState([]); // [{startTime,endTime,price}]
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [allocationData, setAllocationData] = useState({
    date: todayYmd,
    slots: []
  });
  const [offlineCustomer, setOfflineCustomer] = useState({ name: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState({
    name: '',
    phone: '',
    email: '',
    price: ''
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [scanError, setScanError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) {
      return 'Name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) {
      return 'Phone number is required';
    }
    // Remove any non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      return 'Phone number must be exactly 10 digits';
    }
    if (phone !== digitsOnly) {
      return 'Phone number should contain only digits';
    }
    return '';
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return ''; // Email is optional
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePrice = (price) => {
    if (!price.trim()) {
      return ''; // Price is optional
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return 'Price must be a positive number';
    }
    return '';
  };

  const validateField = (field, value) => {
    let error = '';
    switch (field) {
      case 'name':
        error = validateName(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'price':
        error = validatePrice(value);
        break;
      default:
        break;
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    return error === '';
  };

  const validateAllFields = () => {
    const nameValid = validateField('name', offlineCustomer.name);
    const phoneValid = validateField('phone', offlineCustomer.phone);
    const emailValid = validateField('email', customerEmail);
    const priceValid = validateField('price', priceOverride);
    
    return nameValid && phoneValid && emailValid && priceValid;
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const statusParam = filterStatus !== 'all' ? filterStatus : undefined;
      const response = await turfService.getTurfBookings(selectedTurf, selectedDate, statusParam);
      const data = response.data?.bookings || response.data || response;
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadMyTurfs = async () => {
      try {
        const response = await turfService.getMyTurfs();
        const turfData = response.data || response;
        setTurfs(turfData);
        if (turfData.length > 0) setSelectedTurf(turfData[0]._id || turfData[0].id);
      } catch (err) {
        setError('Failed to load your turfs');
      } finally {
        setLoading(false);
      }
    };
    loadMyTurfs();
  }, []);

  useEffect(() => { if (selectedTurf && selectedDate) loadBookings(); }, [selectedTurf, selectedDate, filterStatus]);

  // Load allocated available slots when opening offline booking modal
  useEffect(() => {
    const fetchSlots = async () => {
      if (!showAddBookingModal || !selectedTurf || !selectedDate) return;
      try {
        const res = await turfService.getAvailableSlots(selectedTurf, selectedDate);
        const list = res?.data?.slots || res?.slots || res || [];
        const now = new Date();
        const selDate = new Date(selectedDate);
        const toMinutes = (t) => { const [h,m] = String(t||'').split(':').map(Number); return (isNaN(h)||isNaN(m))?NaN:(h*60+m); };
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const isToday = now.toDateString() === selDate.toDateString();
        // Filter out slots that already ended if viewing today
        const raw = Array.isArray(list) ? list.filter(s => {
          if (!s || !s.startTime || !s.endTime) return false;
          if (!isToday) return true;
          const endM = toMinutes(s.endTime);
          return Number.isNaN(endM) ? true : endM > nowMinutes;
        }) : [];
        const normalized = raw.map(s => `${s.startTime} - ${s.endTime} (₹${s.price ?? ''})`);
        setAvailableSlotsRaw(raw);
        setAvailableSlots(normalized);
        setSelectedSlotIndex(0);
      } catch (e) {
        setError('Failed to load available slots');
      }
    };
    fetchSlots();
  }, [showAddBookingModal, selectedTurf, selectedDate]);

  // Preload previously allocated slots in Allocate modal for selected date
  useEffect(() => {
    const loadAllocatedForDate = async () => {
      if (!showAllocateSlotsModal || !selectedTurf || !allocationData.date) return;
      try {
        const res = await turfService.getAvailableSlots(selectedTurf, allocationData.date);
        const list = res?.data?.slots || res?.slots || [];
        // Populate list with current allocations that are not booked for that date
        const sanitized = Array.isArray(list) ? list.filter(s => s && s.startTime && s.endTime) : [];
        setAllocationData(prev => ({
          ...prev,
          slots: sanitized.map(s => ({ startTime: s.startTime, endTime: s.endTime, price: s.price }))
        }));
      } catch {}
    };
    loadAllocatedForDate();
  }, [showAllocateSlotsModal, selectedTurf, allocationData.date]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-indigo-100 text-indigo-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const verifyAndCheckIn = async (code) => {
    try {
      setScanError('');
      console.log('🔍 Verifying booking code:', code);
      
      const res = await api.post('/bookings/checkin', { bookingCode: String(code || '').trim() });
      
      if (res.data && res.data.success) {
        console.log('✅ Booking verified successfully:', res.data);
        setSuccess(`Booking verified and checked in! Booking ID: ${res.data.data?._id || code}`);
        setTimeout(() => setSuccess(''), 3000);
        setShowScanner(false);
        setScannedCode(String(code || ''));
        await loadBookings();
      } else {
        throw new Error(res.data?.message || 'Verification failed');
      }
    } catch (e) {
      console.error('❌ Verification error:', e);
      let errorMessage = 'Invalid code. Please try again.';
      
      if (e.response && e.response.data) {
        errorMessage = e.response.data.message || errorMessage;
      } else if (e.message) {
        errorMessage = e.message;
      }
      
      setScanError(errorMessage);
    }
  };

  // Scanner controls
  useEffect(() => {
    const startScanner = async () => {
      try {
        if (!showScanner) return;
        setScanError('');
        setScannedCode('');
        if ('mediaDevices' in navigator) {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            await videoRef.current.play();
          }
          if ('BarcodeDetector' in window) {
            const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
            const tick = async () => {
              if (!showScanner) return;
              try {
                if (videoRef.current?.readyState === 4) {
                  const detections = await detector.detect(videoRef.current);
                  if (detections && detections.length) {
                    const raw = detections[0].rawValue || '';
                    console.log('🔍 QR Code detected:', raw);
                    
                    let code = null;
                    
                    // Try to parse as JSON first
                    try {
                      const parsed = JSON.parse(raw);
                      console.log('🔍 Parsed QR data:', parsed);
                      
                      // Check for bookingCode in various possible structures
                      if (parsed.bookingCode) {
                        code = parsed.bookingCode;
                      } else if (parsed.bookingId) {
                        // If only bookingId is available, we need to fetch the bookingCode
                        // For now, we'll use the bookingId as fallback
                        code = parsed.bookingId;
                      }
                    } catch (e) {
                      // If not JSON, treat as plain text booking code
                      console.log('🔍 QR data is not JSON, treating as plain text');
                      code = raw.trim();
                    }
                    
                    if (code) {
                      console.log('🔍 Using booking code:', code);
                      await verifyAndCheckIn(code);
                    } else {
                      console.log('❌ No valid booking code found in QR data');
                      setScanError('Invalid QR code format. Please scan a valid booking QR code.');
                    }
                  }
                }
              } catch {}
              requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        }
      } catch (e) {
        setScanError('Camera not available. Enter code manually.');
      }
    };
    startScanner();
    return () => {
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    };
  }, [showScanner]);

  const filteredBookings = bookings.filter(booking => {
    const statusOk = filterStatus === 'all' ? true : booking.status === filterStatus;
    const paymentOk = filterPayment === 'all' ? true : (booking.paymentStatus || 'pending') === filterPayment;
    const methodVal = booking.bookingType || booking.method || 'online';
    const methodOk = filterMethod === 'all' ? true : methodVal === filterMethod;
    return statusOk && paymentOk && methodOk;
  });

  const isHighlighted = (b) => {
    const code = (b.bookingCode || '').toString();
    return scannedCode && code && code === scannedCode.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <OwnerDashboardNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <OwnerDashboardNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Booking Management</h1>
              <p className="text-gray-600 dark:text-gray-400">Verify codes by scanning QR or entering manually.</p>
              <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Allocation Period:</strong> You can only allocate turfs for the next 5 days from today ({new Date(todayYmd).toLocaleDateString()} to {new Date(maxAllowedDate).toLocaleDateString()})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setAllocationData({ date: todayYmd, slots: [] }); setShowAllocateSlotsModal(true); }}
                className={`inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white`}>
                <Plus className="h-4 w-4 mr-2" /> Allocate Slots
              </button>
              <button
                onClick={() => { setSelectedDate(getTodayYmd()); setShowAddBookingModal(true); }}
                className={`inline-flex items-center px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white`}>
                <Plus className="h-4 w-4 mr-2" /> Offline Booking
              </button>
              <button onClick={() => setShowScanner(true)} className="inline-flex items-center px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                <Camera className="h-4 w-4 mr-2" /> Scan QR
              </button>
            </div>
          </div>

          {success && <div className="mb-4 p-3 rounded bg-green-50 text-green-700 border border-green-200">{success}</div>}
          {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Date</label>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e)=> setSelectedDate(e.target.value)} 
                className="w-full px-3 py-2 border rounded" 
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Status</label>
              <select value={filterStatus} onChange={(e)=> setFilterStatus(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="all">All</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Payment Status</label>
              <select value={filterPayment} onChange={(e)=> setFilterPayment(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Booking Method</label>
              <select value={filterMethod} onChange={(e)=> setFilterMethod(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="all">All</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bookings for {turfs.find(t => t._id === selectedTurf)?.name || ''} • {new Date(selectedDate).toLocaleDateString()}</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBookings.length === 0 ? (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">No bookings found.</div>
              ) : (
                filteredBookings.map((b) => (
                  <div key={b._id || b.id} className={`p-6 ${isHighlighted(b) ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{b.customerInfo?.name || 'Customer'}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>{(b.status || '').toUpperCase()}</span>
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{b.paymentStatus || 'pending'}</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-4">
                          <span><Clock className="inline h-4 w-4 mr-1" />{b.startTime} - {b.endTime}</span>
                          <span><DollarSign className="inline h-4 w-4 mr-1" />₹{b.totalAmount || b.pricePerHour}</span>
                          <span><Calendar className="inline h-4 w-4 mr-1" />{new Date(b.bookingDate).toDateString()}</span>
                          {b.customerInfo?.phone && <span><Phone className="inline h-4 w-4 mr-1" />{b.customerInfo.phone}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetails(b)}
                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {showScanner && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Scan Customer QR Code</h3>
              <button onClick={() => setShowScanner(false)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Instructions:</strong> Point the camera at the customer's booking QR code. The system will automatically detect and verify the booking.
              </p>
            </div>
            
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-3 relative">
              <video ref={videoRef} className="w-full h-64 bg-black object-cover" muted playsInline />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50"></div>
              </div>
            </div>
            
            {scanError && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{scanError}</p>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mb-2">Manual entry (if camera scanning fails):</div>
            <div className="flex gap-2">
              <input 
                value={scannedCode} 
                onChange={(e)=>{ setScannedCode(e.target.value); setScanError(''); }} 
                placeholder="Enter booking code or ID" 
                className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
              />
              <button 
                onClick={()=> verifyAndCheckIn(scannedCode)} 
                disabled={!scannedCode.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Booking Details</h3>
              <button onClick={closeDetails} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Booking Code</div>
                  <div className="text-sm font-medium">{selectedBooking.bookingCode || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Turf</div>
                  <div className="text-sm font-medium">{selectedBooking.turfId?.name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="text-sm font-medium">{selectedBooking.bookingDate ? new Date(selectedBooking.bookingDate).toLocaleDateString() : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Time</div>
                  <div className="text-sm font-medium">{selectedBooking.startTime} - {selectedBooking.endTime}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Duration</div>
                  <div className="text-sm font-medium">{selectedBooking.duration ? `${selectedBooking.duration} min` : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Court Type</div>
                  <div className="text-sm font-medium capitalize">{selectedBooking.courtType || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Price / Hour</div>
                  <div className="text-sm font-medium">₹{selectedBooking.pricePerHour ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Total Amount</div>
                  <div className="text-sm font-medium">₹{selectedBooking.totalAmount ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Payment Status</div>
                  <div className="text-sm font-medium capitalize">{selectedBooking.paymentStatus || 'pending'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Payment Method</div>
                  <div className="text-sm font-medium capitalize">{selectedBooking.paymentMethod || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Paid Amount</div>
                  <div className="text-sm font-medium">₹{selectedBooking.paymentAmount ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Refund Status</div>
                  <div className="text-sm font-medium capitalize">{selectedBooking.refundStatus || 'none'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Refund Amount</div>
                  <div className="text-sm font-medium">₹{selectedBooking.refundAmount ?? 0}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Booking Type</div>
                  <div className="text-sm font-medium capitalize">{selectedBooking.bookingType || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="text-sm font-medium capitalize">{selectedBooking.status || '—'}</div>
                </div>
                {selectedBooking.cancellationReason && (
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500">Cancellation Reason</div>
                    <div className="text-sm font-medium">{selectedBooking.cancellationReason}</div>
                  </div>
                )}
                {selectedBooking.cancelledAt && (
                  <div>
                    <div className="text-xs text-gray-500">Cancelled At</div>
                    <div className="text-sm font-medium">{new Date(selectedBooking.cancelledAt).toLocaleString()}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Customer Name</div>
                  <div className="text-sm font-medium">{selectedBooking.customerId?.name || selectedBooking.customerInfo?.name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="text-sm font-medium">{selectedBooking.customerId?.phone || selectedBooking.customerInfo?.phone || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-sm font-medium">{selectedBooking.customerId?.email || selectedBooking.customerInfo?.email || '—'}</div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <div className="text-xs text-gray-500">Notes</div>
                  <div className="text-sm font-medium whitespace-pre-wrap">{selectedBooking.notes}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Created At</div>
                  <div className="text-sm font-medium">{selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Updated At</div>
                  <div className="text-sm font-medium">{selectedBooking.updatedAt ? new Date(selectedBooking.updatedAt).toLocaleString() : '—'}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={closeDetails} className="px-3 py-2 rounded border">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddBookingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Offline Booking</h3>
              <button onClick={() => {
                setShowAddBookingModal(false);
                // Reset validation errors when closing modal
                setValidationErrors({ name: '', phone: '', email: '', price: '' });
              }} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Booking Date</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  min={todayYmd}
                  max={maxAllowedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded" 
                />
                <p className="text-xs text-gray-500 mt-1">You can only allocate turfs for the next 5 days from today.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Allocated Slot</label>
                <select value={selectedSlotIndex} onChange={(e)=> setSelectedSlotIndex(parseInt(e.target.value))} className="w-full px-3 py-2 border rounded">
                  {availableSlots.length === 0 && <option value={-1}>No allocated slots available</option>}
                  {availableSlots.map((s, idx) => (
                    <option key={`${s}-${idx}`} value={idx}>{s}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Only slots allocated by you are listed.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer Name</label>
                  <input 
                    value={offlineCustomer.name} 
                    onChange={(e) => {
                      setOfflineCustomer({ ...offlineCustomer, name: e.target.value });
                      validateField('name', e.target.value);
                    }} 
                    className={`w-full px-3 py-2 border rounded ${
                      validationErrors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`} 
                    placeholder="Name" 
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input 
                    value={offlineCustomer.phone} 
                    onChange={(e) => {
                      // Block alphabets and non-numeric characters
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setOfflineCustomer({ ...offlineCustomer, phone: value });
                      validateField('phone', value);
                    }} 
                    onKeyDown={(e) => {
                      // Block alphabets and special characters on key press
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded ${
                      validationErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`} 
                    placeholder="Phone" 
                    maxLength={10}
                    inputMode="numeric"
                  />
                  {validationErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Email (optional)</label>
                  <input 
                    value={customerEmail} 
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      validateField('email', e.target.value);
                    }} 
                    className={`w-full px-3 py-2 border rounded ${
                      validationErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`} 
                    placeholder="Email" 
                    type="email"
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (optional)</label>
                  <input 
                    type="number" 
                    min={0} 
                    value={priceOverride} 
                    onChange={(e) => {
                      setPriceOverride(e.target.value);
                      validateField('price', e.target.value);
                    }} 
                    className={`w-full px-3 py-2 border rounded ${
                      validationErrors.price ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`} 
                    placeholder={`Default ₹${availableSlotsRaw[selectedSlotIndex]?.price ?? ''}`} 
                  />
                  {validationErrors.price && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.price}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea value={notes} onChange={(e)=> setNotes(e.target.value)} className="w-full px-3 py-2 border rounded" rows={3} placeholder="Any notes..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={(e)=> setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border rounded">
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => {
                  setShowAddBookingModal(false);
                  // Reset validation errors when canceling
                  setValidationErrors({ name: '', phone: '', email: '', price: '' });
                }} className="px-3 py-2 rounded border">Cancel</button>
                <button
                  onClick={async () => {
                    try {
                      // Validate all fields first
                      if (!validateAllFields()) {
                        setError('Please fix the validation errors before submitting');
                        return;
                      }
                      
                      if (!availableSlotsRaw.length || selectedSlotIndex < 0) return setError('Select an allocated slot');
                      if (selectedDate < todayYmd || selectedDate > maxAllowedDate) return setError('Selected date is outside the allowed allocation period');
                      
                      const sel = availableSlotsRaw[selectedSlotIndex];
                      const startTime = sel.startTime;
                      const endTime = sel.endTime;
                      await turfService.bookSlot(selectedTurf, {
                        date: selectedDate,
                        startTime,
                        endTime,
                        customerName: offlineCustomer.name.trim(),
                        customerPhone: offlineCustomer.phone.trim(),
                        customerEmail: customerEmail.trim() || undefined,
                        notes: notes.trim() || undefined,
                        price: priceOverride ? Number(priceOverride) : undefined
                      });
                      setSuccess('Offline booking added');
                      setTimeout(() => setSuccess(''), 1500);
                      setShowAddBookingModal(false);
                      // Reset form and validation errors
                      setOfflineCustomer({ name: '', phone: '' });
                      setCustomerEmail('');
                      setNotes('');
                      setPriceOverride('');
                      setValidationErrors({ name: '', phone: '', email: '', price: '' });
                      await loadBookings();
                    } catch (e) {
                      setError(e.message || 'Failed to add booking');
                    }
                  }}
                  className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700">
                  Add Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAllocateSlotsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Allocate Slots for Day</h3>
              <button onClick={() => setShowAllocateSlotsModal(false)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Select Date</label>
                <input 
                  type="date" 
                  value={allocationData.date} 
                  min={todayYmd}
                  max={maxAllowedDate}
                  onChange={(e) => setAllocationData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border rounded" 
                />
                <p className="text-xs text-gray-500 mt-1">You can only allocate slots for the next 5 days from today.</p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Add Slots</h4>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                    <input 
                      id="allocation-start-time"
                      type="time" 
                      className="w-full px-2 py-1 border rounded text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Time</label>
                    <input 
                      id="allocation-end-time"
                      type="time" 
                      className="w-full px-2 py-1 border rounded text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Price (₹)</label>
                    <input 
                      id="allocation-price"
                      type="number" 
                      min="0"
                      className="w-full px-2 py-1 border rounded text-sm" 
                    />
                  </div>
                </div>
                <button 
                  onClick={addSlotToAllocation}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Add Slot
                </button>
              </div>

              {allocationData.slots.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Allocated Slots</h4>
                  <div className="space-y-2">
                    {allocationData.slots.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium">{slot.startTime} - {slot.endTime}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">₹{slot.price}</span>
                        </div>
                        <button 
                          onClick={() => removeSlotFromAllocation(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  onClick={() => setShowAllocateSlotsModal(false)} 
                  className="px-4 py-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAllocateSlots}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Allocate Slots
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerBookingsPage;
