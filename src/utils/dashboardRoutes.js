// Utility function to get the appropriate dashboard route based on user type
export const getDashboardRoute = (userType) => {
  switch (userType) {
    case 'admin':
      return '/admin-dashboard';
    case 'owner':
      return '/owner-dashboard';
    case 'player':
    default:
      return '/player-dashboard';
  }
};

// Utility function to get user type display name
export const getUserTypeDisplayName = (userType) => {
  switch (userType) {
    case 'admin':
      return 'Administrator';
    case 'owner':
      return 'Turf Owner';
    case 'player':
    default:
      return 'Football Player';
  }
};

// Utility function to get user type color
export const getUserTypeColor = (userType) => {
  switch (userType) {
    case 'admin':
      return 'bg-red-100 text-red-800';
    case 'owner':
      return 'bg-blue-100 text-blue-800';
    case 'player':
    default:
      return 'bg-green-100 text-green-800';
  }
};