import React, { useState } from 'react';
import PaymentModal from '../components/modals/PaymentModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PaymentTest = () => {
  const { user } = useAuth();
  const [showPayment, setShowPayment] = useState(false);

  const mockBookingDetails = {
    turfName: 'Test Turf',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    pricePerHour: 500
  };

  const mockCreateBooking = async () => {
    // Simulate booking creation with proper API call structure
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            _id: 'test_booking_' + Date.now(),
            ...mockBookingDetails,
            customerId: user?.id,
            customerInfo: {
              name: (user?.firstName || '') + ' ' + (user?.lastName || ''),
              email: user?.email,
              phone: user?.phone || 'N/A'
            },
            status: 'confirmed',
            paymentStatus: 'pending'
          }
        });
      }, 1000);
    });
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    toast.success('Payment test successful!');
    setShowPayment(false);
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    toast.error('Payment test failed: ' + error);
    setShowPayment(false);
  };

  const testDirectPayment = async () => {
    try {
      // Test the payment service directly with a mock booking ID
      const mockBookingId = 'test_' + Date.now();
      const amount = 500;
      
      console.log('Testing direct payment with:', { mockBookingId, amount });
      
      // This will fail but we can see the error details
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bookingId: mockBookingId,
          amount: amount
        })
      });
      
      const data = await response.json();
      console.log('Direct payment test response:', data);
      
      if (data.success) {
        toast.success('Direct payment test successful!');
      } else {
        toast.error('Direct payment test failed: ' + data.message);
      }
    } catch (error) {
      console.error('Direct payment test error:', error);
      toast.error('Direct payment test error: ' + error.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Payment Test</h2>
          <p className="text-gray-600 mb-4">Please login to test payment functionality</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Payment Integration Test</h1>
        
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Test Booking Details:</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Turf:</span> {mockBookingDetails.turfName}</p>
              <p><span className="font-medium">Date:</span> {mockBookingDetails.date}</p>
              <p><span className="font-medium">Time:</span> {mockBookingDetails.startTime} - {mockBookingDetails.endTime}</p>
              <p><span className="font-medium">Price:</span> ₹{mockBookingDetails.pricePerHour}/hour</p>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Razorpay Test Credentials:</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Key ID:</span> rzp_test_RL5vMta3bKvRd4</p>
              <p><span className="font-medium">Test Cards:</span> 4111 1111 1111 1111</p>
              <p><span className="font-medium">CVV:</span> Any 3 digits</p>
              <p><span className="font-medium">Expiry:</span> Any future date</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setShowPayment(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Test Payment Integration
          </button>
          
          <button
            onClick={testDirectPayment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Test Direct Payment (No Booking)
          </button>
        </div>

        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          bookingDetails={mockBookingDetails}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
          createBooking={mockCreateBooking}
        />
      </div>
    </div>
  );
};

export default PaymentTest;