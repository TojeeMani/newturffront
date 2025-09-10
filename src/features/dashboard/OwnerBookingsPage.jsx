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
      const res = await api.post('/bookings/checkin', { bookingCode: String(code || '').trim() });
      setSuccess('Booking verified and checked in');
      setTimeout(() => setSuccess(''), 1500);
      setShowScanner(false);
      setScannedCode(String(code || ''));
      await loadBookings();
    } catch (e) {
      setScanError(e.message || 'Invalid code. Please try again.');
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
                    const parsed = (() => { try { return JSON.parse(raw); } catch { return null; } })();
                    const code = parsed?.bookingCode || raw;
                    if (code) await verifyAndCheckIn(code);
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
              <h3 className="text-lg font-semibold">Scan Customer QR</h3>
              <button onClick={() => setShowScanner(false)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-3">
              <video ref={videoRef} className="w-full h-64 bg-black object-cover" muted playsInline />
            </div>
            {scanError && <div className="mb-2 text-sm text-red-600">{scanError}</div>}
            <div className="text-xs text-gray-500 mb-2">If camera scanning is not supported, enter the 4‑digit code:</div>
            <div className="flex gap-2">
              <input value={scannedCode} onChange={(e)=>{ setScannedCode(e.target.value); setScanError(''); }} placeholder="4‑digit code" maxLength={4} className="flex-1 px-3 py-2 border rounded" />
              <button onClick={()=> verifyAndCheckIn(scannedCode)} className="px-3 py-2 bg-primary-600 text-white rounded">Verify</button>
            </div>
          </div>
        </div>
      )}

      {showAddBookingModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Offline Booking</h3>
              <button onClick={() => setShowAddBookingModal(false)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5" /></button>
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
                  <input value={offlineCustomer.name} onChange={(e)=> setOfflineCustomer({ ...offlineCustomer, name: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input value={offlineCustomer.phone} onChange={(e)=> setOfflineCustomer({ ...offlineCustomer, phone: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="Phone" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Email (optional)</label>
                  <input value={customerEmail} onChange={(e)=> setCustomerEmail(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder="Email" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (optional)</label>
                  <input type="number" min={0} value={priceOverride} onChange={(e)=> setPriceOverride(e.target.value)} className="w-full px-3 py-2 border rounded" placeholder={`Default ₹${availableSlotsRaw[selectedSlotIndex]?.price ?? ''}`} />
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
                <button onClick={() => setShowAddBookingModal(false)} className="px-3 py-2 rounded border">Cancel</button>
                <button
                  onClick={async () => {
                    try {
                      if (!availableSlotsRaw.length || selectedSlotIndex < 0) return setError('Select an allocated slot');
                      if (!offlineCustomer.name || !offlineCustomer.phone) return setError('Enter customer name and phone');
                      if (selectedDate < todayYmd || selectedDate > maxAllowedDate) return setError('Selected date is outside the allowed allocation period');
                      const sel = availableSlotsRaw[selectedSlotIndex];
                      const startTime = sel.startTime;
                      const endTime = sel.endTime;
                      await turfService.bookSlot(selectedTurf, {
                        date: selectedDate,
                        startTime,
                        endTime,
                        customerName: offlineCustomer.name,
                        customerPhone: offlineCustomer.phone,
                        customerEmail: customerEmail,
                        notes: notes,
                        price: priceOverride ? Number(priceOverride) : undefined
                      });
                      setSuccess('Offline booking added');
                      setTimeout(() => setSuccess(''), 1500);
                      setShowAddBookingModal(false);
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
