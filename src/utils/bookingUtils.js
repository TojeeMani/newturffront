/**
 * Utility functions for booking-related operations
 */

/**
 * Check if a booking's slot time has ended
 * @param {Object} booking - The booking object
 * @returns {boolean} - True if slot time has ended, false otherwise
 */
export const isSlotTimeEnded = (booking) => {
  if (!booking?.bookingDate || !booking?.endTime) return false;
  
  const now = new Date();
  const d = new Date(booking.bookingDate);
  const [endHours, endMinutes] = String(booking.endTime).split(':');
  const slotEndTime = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    parseInt(endHours, 10),
    parseInt(endMinutes, 10),
    0,
    0
  );
  
  return now >= slotEndTime;
};

/**
 * Check if a booking can be rated (slot time ended, no existing review)
 * @param {Object} booking - The booking object
 * @returns {boolean} - True if booking can be rated, false otherwise
 */
export const canRateBooking = (booking) => {
  if (!booking) return false;
  
  const hasReview = booking?.reviews && booking.reviews.length > 0;
  const slotTimeHasEnded = isSlotTimeEnded(booking);
  const hasTurfId = !!booking.turfId?._id;
  
  // Allow rating if slot time has ended, regardless of booking status
  return hasTurfId && !hasReview && slotTimeHasEnded;
};

/**
 * Get the time remaining until slot ends
 * @param {Object} booking - The booking object
 * @returns {Object} - Object with hours, minutes, and total minutes remaining
 */
export const getTimeUntilSlotEnds = (booking) => {
  if (!booking?.bookingDate || !booking?.endTime) return null;
  
  const now = new Date();
  const d = new Date(booking.bookingDate);
  const [endHours, endMinutes] = String(booking.endTime).split(':');
  const slotEndTime = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    parseInt(endHours, 10),
    parseInt(endMinutes, 10),
    0,
    0
  );
  
  const timeDiff = slotEndTime - now;
  
  if (timeDiff <= 0) return null;
  
  const totalMinutes = Math.floor(timeDiff / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return {
    hours,
    minutes,
    totalMinutes,
    formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  };
};

/**
 * Format booking time for display
 * @param {Object} booking - The booking object
 * @returns {string} - Formatted time string
 */
export const formatBookingTime = (booking) => {
  if (!booking?.startTime || !booking?.endTime) return '';
  return `${booking.startTime} - ${booking.endTime}`;
};

/**
 * Format booking date for display
 * @param {Object} booking - The booking object
 * @returns {string} - Formatted date string
 */
export const formatBookingDate = (booking) => {
  if (!booking?.bookingDate) return '';
  return new Date(booking.bookingDate).toDateString();
};
