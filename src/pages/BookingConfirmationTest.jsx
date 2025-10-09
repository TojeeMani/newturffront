import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BookingConfirmationTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const mockBookingData = {
    turf: {
      _id: 'test_turf_id',
      name: 'Test Sports Arena',
      location: 'Test Location, City',
      sport: 'football',
      surface: 'artificial grass',
      dimensions: '100x60 meters',
      pricePerHour: 500,
      images: ['https://via.placeholder.com/400x300?text=Test+Turf'],
      amenities: ['Parking', 'Changing Room', 'Lighting', 'Water', 'First Aid']
    },
    selectedDate: new Date().toISOString().split('T')[0],
    selectedSlots: [
      { startTime: '10:00', endTime: '11:00', price: 500 },
      { startTime: '11:00', endTime: '12:00', price: 500 }
    ],
    teamA: { name: 'Team Alpha', players: 'Player 1, Player 2, Player 3' },
    teamB: { name: 'Team Beta', players: 'Player 4, Player 5, Player 6' },
    totalAmount: 1000,
    totalDuration: 2,
    courtType: 'full',
    paymentMethod: 'online'
  };

  const testBookingConfirmation = () => {
    navigate('/booking-confirmation', {
      state: { bookingData: mockBookingData }
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Booking Confirmation Test</h2>
          <p className="text-gray-600 mb-4">Please login to test booking confirmation</p>
          <button
            onClick={() => navigate('/login')}
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
        <h1 className="text-2xl font-bold text-center mb-6">Booking Confirmation Test</h1>
        
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Test Booking Details:</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Turf:</span> {mockBookingData.turf.name}</p>
              <p><span className="font-medium">Date:</span> {mockBookingData.selectedDate}</p>
              <p><span className="font-medium">Slots:</span> {mockBookingData.selectedSlots.length}</p>
              <p><span className="font-medium">Duration:</span> {mockBookingData.totalDuration} hours</p>
              <p><span className="font-medium">Amount:</span> ₹{mockBookingData.totalAmount}</p>
              <p><span className="font-medium">Court:</span> {mockBookingData.courtType}</p>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Team Details:</h3>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">{mockBookingData.teamA.name}:</span> {mockBookingData.teamA.players}</p>
              <p><span className="font-medium">{mockBookingData.teamB.name}:</span> {mockBookingData.teamB.players}</p>
            </div>
          </div>
        </div>

        <button
          onClick={testBookingConfirmation}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Test Booking Confirmation Page
        </button>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationTest;