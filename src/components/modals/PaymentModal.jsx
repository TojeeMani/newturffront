import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PaymentModal = ({ isOpen, onClose, bookingDetails, onPaymentSuccess, onPaymentFailure }) => {
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [currentQuote, setCurrentQuote] = useState('');

  useEffect(() => {
    const init = async () => {
      if (!isOpen || !bookingDetails?.id || !bookingDetails?.amount) return;
      try {
        setError('');
        setCreatingOrder(true);
        const res = await api.createPaymentOrder({ bookingId: bookingDetails.id, amount: bookingDetails.amount });
        const data = res?.data || res;
        setOrder(data);
      } catch (e) {
        setError(e.message || 'Failed to create payment order');
      } finally {
        setCreatingOrder(false);
      }
    };
    init();
  }, [isOpen, bookingDetails]);

  const startPayment = async () => {
    try {
      setError('');
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError('Payment gateway failed to load. Please try again.');
        return;
      }

      const key = order?.keyId || process.env.REACT_APP_RAZORPAY_KEY_ID;
      const orderId = order?.orderId;
      const amountPaise = order?.amount;
      const currency = order?.currency || 'INR';

      if (!key || !orderId) {
        setError('Payment configuration missing. Please retry.');
        return;
      }

      const options = {
        key,
        amount: amountPaise,
        currency,
        name: bookingDetails?.turfName || 'Turfease',
        description: `Booking ${bookingDetails?.id}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            setProcessingPayment(true);
            
            // Sports quotes for loading
            const sportsQuotes = [
              "Champions keep playing until they get it right. ⚽",
              "Success is where preparation and opportunity meet. 🏆",
              "The harder you work, the luckier you get. 💪",
              "Winners never quit and quitters never win. 🥇",
              "It's not whether you get knocked down; it's whether you get up. 🏃‍♂️",
              "The only way to prove you are a good sport is to lose. 🎯",
              "Excellence is not a skill, it's an attitude. ⭐",
              "Champions are made when nobody's watching. 👀",
              "Play like you're in first, train like you're in second. 🏋️‍♂️",
              "The game isn't over until it's over. ⏰"
            ];
            
            let quoteIndex = 0;
            const quoteInterval = setInterval(() => {
              setCurrentQuote(sportsQuotes[quoteIndex % sportsQuotes.length]);
              quoteIndex++;
            }, 2000);
            
            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingDetails.id
            });
            
            clearInterval(quoteInterval);
            setProcessingPayment(false);
            onPaymentSuccess?.(verifyRes);
            onClose?.();
          } catch (e) {
            setProcessingPayment(false);
            setError(e.message || 'Payment verification failed');
            onPaymentFailure?.(e);
          }
        },
        theme: { color: '#22c55e' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setError(resp.error?.description || 'Payment failed');
        onPaymentFailure?.(resp);
      });
      rzp.open();
    } catch (e) {
      setError(e.message || 'Failed to start payment');
      onPaymentFailure?.(e);
    }
  };

  if (!isOpen) return null;

  const rupeeTotal = bookingDetails?.amount || 0;

  // Processing payment overlay
  if (processingPayment) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Processing Payment...
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Sending confirmation email with receipt
            </p>
          </div>
          
          {currentQuote && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200 font-medium text-sm italic">
                {currentQuote}
              </p>
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Please wait while we process your booking...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-5">
        <h2 className="text-lg font-semibold mb-4">Proceed to Payment</h2>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
          <div className="flex justify-between"><span>Booking</span><span>{bookingDetails?.id}</span></div>
          <div className="flex justify-between"><span>Turf</span><span>{bookingDetails?.turfName || 'Turf'}</span></div>
          <div className="flex justify-between"><span>Amount</span><span>₹{rupeeTotal}</span></div>
        </div>
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        <div className="mt-5 flex gap-2">
          <button className="flex-1 border rounded-lg px-4 py-2 dark:border-gray-700" onClick={onClose}>Cancel</button>
          <button className="flex-1 btn-primary" disabled={creatingOrder || !order} onClick={startPayment}>
            {creatingOrder ? 'Preparing...' : 'Pay Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;