import React from 'react';

const BookingConfirmModal = ({ open, onClose, onConfirm, turf, date, startTime, endTime, pricePerHour, durationMinutes, selectedSlots = [], totalAmount, courtType }) => {
  if (!open) return null;

  const hasMulti = Array.isArray(selectedSlots) && selectedSlots.length > 1;
  const duration = durationMinutes || 60;
  const computedTotal = typeof totalAmount === 'number' ? totalAmount : (pricePerHour || 0) * (duration / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-5">
        <h2 className="text-lg font-semibold mb-4">Confirm your booking</h2>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
          <div className="flex justify-between"><span>Turf</span><span>{turf?.name}</span></div>
          <div className="flex justify-between"><span>Date</span><span>{date}</span></div>
          {courtType && (
            <div className="flex justify-between"><span>Court</span><span>{courtType === 'half' ? 'Half Court' : 'Full Court'}</span></div>
          )}
          {!hasMulti ? (
            <>
              <div className="flex justify-between"><span>Time</span><span>{startTime} - {endTime}</span></div>
              <div className="flex justify-between"><span>Duration</span><span>{duration} mins</span></div>
              <div className="flex justify-between"><span>Price per hour</span><span>₹{pricePerHour || turf?.pricePerHour}</span></div>
              <div className="border-t pt-2 flex justify-between font-medium"><span>Total</span><span>₹{computedTotal}</span></div>
            </>
          ) : (
            <>
              <div className="flex justify-between"><span>Selected Slots</span><span>{selectedSlots.length}</span></div>
              <div className="max-h-36 overflow-auto rounded border border-gray-200 dark:border-gray-700 p-2">
                {selectedSlots.map((s, i) => (
                  <div key={`${s.startTime}-${s.endTime}-${i}`} className="flex justify-between text-xs py-1">
                    <span>{s.startTime} - {s.endTime}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 flex justify-between font-medium"><span>Total</span><span>₹{computedTotal}</span></div>
            </>
          )}
        </div>
        <div className="mt-5 flex gap-2">
          <button className="flex-1 border rounded-lg px-4 py-2 dark:border-gray-700" onClick={onClose}>Cancel</button>
          <button className="flex-1 btn-primary" onClick={onConfirm}>Confirm Booking</button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmModal;


