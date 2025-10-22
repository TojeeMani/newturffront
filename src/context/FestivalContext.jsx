import React, { createContext, useContext, useState, useEffect } from 'react';

const FestivalContext = createContext();

export const useFestival = () => {
  const context = useContext(FestivalContext);
  if (!context) {
    throw new Error('useFestival must be used within a FestivalProvider');
  }
  return context;
};

// Festival database with 2025 dates only
const FESTIVALS = [
  {
    id: 'test',
    name: 'Test Festival',
    actualDate: '2024-12-20', // Test festival active now
    colors: {
      primary: '#FF6B35',    // Orange
      secondary: '#F7931E',  // Golden Orange
      accent: '#FFD700',     // Gold
      background: '#FFF8DC', // Cornsilk
      text: '#8B4513',       // Saddle Brown
      light: '#FFE4B5',      // Moccasin
      dark: '#B8860B'        // Dark Goldenrod
    },
    decorations: {
      diyas: true,
      rangoli: true,
      fireworks: true,
      lanterns: true
    },
    animations: {
      sparkle: true,
      float: true,
      glow: true
    }
  },
  {
    id: 'newyear',
    name: 'New Year',
    actualDate: '2025-01-01', // New Year 2025
    colors: {
      primary: '#3B82F6',    // Blue
      secondary: '#8B5CF6',  // Purple
      accent: '#F59E0B',     // Amber
      background: '#EFF6FF', // Blue 50
      text: '#1E40AF',       // Blue 800
      light: '#DBEAFE',      // Blue 100
      dark: '#1E3A8A'        // Blue 900
    },
    decorations: {
      fireworks: true,
      confetti: true,
      stars: true,
      balloons: true
    },
    animations: {
      sparkle: true,
      bounce: true,
      glow: true
    }
  },
  {
    id: 'holi',
    name: 'Holi',
    actualDate: '2025-03-14', // Actual Holi date 2025
    colors: {
      primary: '#EC4899',    // Pink
      secondary: '#8B5CF6',  // Purple
      accent: '#10B981',     // Emerald
      background: '#FDF2F8', // Pink 50
      text: '#581C87',       // Purple 900
      light: '#FCE7F3',      // Pink 100
      dark: '#BE185D'        // Pink 700
    },
    decorations: {
      colors: true,
      water: true,
      flowers: true,
      balloons: true
    },
    animations: {
      splash: true,
      rainbow: true,
      confetti: true
    }
  },
  {
    id: 'eid',
    name: 'Eid al-Fitr',
    actualDate: '2025-03-30', // Approximate Eid date 2025
    colors: {
      primary: '#059669',    // Emerald
      secondary: '#7C3AED',  // Violet
      accent: '#F59E0B',     // Amber
      background: '#F0FDF4', // Green 50
      text: '#064E3B',       // Emerald 900
      light: '#D1FAE5',      // Emerald 100
      dark: '#047857'        // Emerald 700
    },
    decorations: {
      crescents: true,
      stars: true,
      lanterns: true,
      patterns: true
    },
    animations: {
      crescent: true,
      star: true,
      glow: true
    }
  },
  {
    id: 'diwali',
    name: 'Diwali',
    actualDate: '2024-10-20', // Moved to past date to disable
    colors: {
      primary: '#FF6B35',    // Orange
      secondary: '#F7931E',  // Golden Orange
      accent: '#FFD700',     // Gold
      background: '#FFF8DC', // Cornsilk
      text: '#8B4513',       // Saddle Brown
      light: '#FFE4B5',      // Moccasin
      dark: '#B8860B'        // Dark Goldenrod
    },
    decorations: {
      diyas: true,
      rangoli: true,
      fireworks: true,
      lanterns: true
    },
    animations: {
      sparkle: true,
      float: true,
      glow: true
    }
  },
  {
    id: 'christmas',
    name: 'Christmas',
    actualDate: '2025-12-25', // Actual Christmas date 2025
    colors: {
      primary: '#DC2626',    // Red
      secondary: '#16A34A',  // Green
      accent: '#F59E0B',     // Amber
      background: '#FEF2F2', // Red 50
      text: '#1F2937',       // Gray 800
      light: '#FEE2E2',      // Red 100
      dark: '#991B1B'        // Red 800
    },
    decorations: {
      snowflakes: true,
      ornaments: true,
      lights: true,
      stars: true
    },
    animations: {
      snow: true,
      twinkle: true,
      bounce: true
    }
  }
];

export const FestivalProvider = ({ children }) => {
  const [activeFestival, setActiveFestival] = useState(null);
  const [isFestivalActive, setIsFestivalActive] = useState(false);

  // Check for active festivals
  useEffect(() => {
    const checkActiveFestival = () => {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      const activeFestival = FESTIVALS.find(festival => {
        const actualDate = new Date(festival.actualDate);
        
        // Calculate 3 days before and 3 days after the actual festival date
        const startDate = new Date(actualDate);
        startDate.setDate(actualDate.getDate() - 3);
        
        const endDate = new Date(actualDate);
        endDate.setDate(actualDate.getDate() + 3);
        
        const startDateString = startDate.toISOString().split('T')[0];
        const endDateString = endDate.toISOString().split('T')[0];
        
        return todayString >= startDateString && todayString <= endDateString;
      });

      if (activeFestival) {
        setActiveFestival(activeFestival);
        setIsFestivalActive(true);
        
        // Apply festival theme to document
        applyFestivalTheme(activeFestival);
      } else {
        setActiveFestival(null);
        setIsFestivalActive(false);
        
        // Remove festival theme
        removeFestivalTheme();
      }
    };

    // Check immediately
    checkActiveFestival();

    // Check daily at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timeoutId = setTimeout(() => {
      checkActiveFestival();
      // Set up daily checks
      const intervalId = setInterval(checkActiveFestival, 24 * 60 * 60 * 1000);
      return () => clearInterval(intervalId);
    }, timeUntilMidnight);

    return () => clearTimeout(timeoutId);
  }, []);

  const applyFestivalTheme = (festival) => {
    const root = document.documentElement;
    const body = document.body;

    // Add festival class
    root.classList.add(`festival-${festival.id}`);
    body.classList.add(`festival-${festival.id}`);

    // Apply CSS custom properties
    root.style.setProperty('--festival-primary', festival.colors.primary);
    root.style.setProperty('--festival-secondary', festival.colors.secondary);
    root.style.setProperty('--festival-accent', festival.colors.accent);
    root.style.setProperty('--festival-background', festival.colors.background);
    root.style.setProperty('--festival-text', festival.colors.text);
    root.style.setProperty('--festival-light', festival.colors.light);
    root.style.setProperty('--festival-dark', festival.colors.dark);

    // Add festival decorations
    if (festival.decorations.diyas) addDiyas();
    if (festival.decorations.snowflakes) addSnowflakes();
    if (festival.decorations.colors) addColorSplashes();
    if (festival.decorations.crescents) addCrescents();
  };

  const removeFestivalTheme = () => {
    const root = document.documentElement;
    const body = document.body;

    // Remove all festival classes
    FESTIVALS.forEach(festival => {
      root.classList.remove(`festival-${festival.id}`);
      body.classList.remove(`festival-${festival.id}`);
    });

    // Remove CSS custom properties
    root.style.removeProperty('--festival-primary');
    root.style.removeProperty('--festival-secondary');
    root.style.removeProperty('--festival-accent');
    root.style.removeProperty('--festival-background');
    root.style.removeProperty('--festival-text');
    root.style.removeProperty('--festival-light');
    root.style.removeProperty('--festival-dark');

    // Remove decorations
    removeDecorations();
  };

  const addDiyas = () => {
    const diyaContainer = document.createElement('div');
    diyaContainer.id = 'diya-container';
    diyaContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    document.body.appendChild(diyaContainer);

    // Add floating diyas
    for (let i = 0; i < 8; i++) {
      const diya = document.createElement('div');
      diya.className = 'diya';
      diya.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, #FFD700 0%, #FF6B35 50%, #8B4513 100%);
        border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        animation: diyaFloat ${3 + Math.random() * 2}s ease-in-out infinite;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        box-shadow: 0 0 20px #FFD700;
      `;
      diyaContainer.appendChild(diya);
    }
  };

  const addSnowflakes = () => {
    const snowContainer = document.createElement('div');
    snowContainer.id = 'snow-container';
    snowContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    document.body.appendChild(snowContainer);

    // Add snowflakes
    for (let i = 0; i < 50; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      snowflake.innerHTML = '❄';
      snowflake.style.cssText = `
        position: absolute;
        color: white;
        font-size: ${10 + Math.random() * 10}px;
        animation: snowFall ${3 + Math.random() * 4}s linear infinite;
        left: ${Math.random() * 100}%;
        top: -20px;
      `;
      snowContainer.appendChild(snowflake);
    }
  };

  const addColorSplashes = () => {
    const colorContainer = document.createElement('div');
    colorContainer.id = 'color-container';
    colorContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    document.body.appendChild(colorContainer);

    // Add color splashes
    for (let i = 0; i < 15; i++) {
      const splash = document.createElement('div');
      splash.className = 'color-splash';
      splash.style.cssText = `
        position: absolute;
        width: ${20 + Math.random() * 30}px;
        height: ${20 + Math.random() * 30}px;
        background: ${['#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)]};
        border-radius: 50%;
        animation: colorSplash ${2 + Math.random() * 3}s ease-in-out infinite;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        opacity: 0.7;
      `;
      colorContainer.appendChild(splash);
    }
  };

  const addCrescents = () => {
    const crescentContainer = document.createElement('div');
    crescentContainer.id = 'crescent-container';
    crescentContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    `;
    document.body.appendChild(crescentContainer);

    // Add crescents
    for (let i = 0; i < 6; i++) {
      const crescent = document.createElement('div');
      crescent.className = 'crescent';
      crescent.innerHTML = '🌙';
      crescent.style.cssText = `
        position: absolute;
        font-size: ${20 + Math.random() * 15}px;
        animation: crescentFloat ${4 + Math.random() * 2}s ease-in-out infinite;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        filter: drop-shadow(0 0 10px #059669);
      `;
      crescentContainer.appendChild(crescent);
    }
  };

  const removeDecorations = () => {
    const containers = ['diya-container', 'snow-container', 'color-container', 'crescent-container'];
    containers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.remove();
      }
    });
  };

  const getUpcomingFestivals = () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    return FESTIVALS.filter(festival => {
      const actualDate = new Date(festival.actualDate);
      const startDate = new Date(actualDate);
      startDate.setDate(actualDate.getDate() - 3);
      const startDateString = startDate.toISOString().split('T')[0];
      
      return startDateString > todayString;
    }).sort((a, b) => new Date(a.actualDate) - new Date(b.actualDate));
  };

  const value = {
    activeFestival,
    isFestivalActive,
    getUpcomingFestivals,
    festivals: FESTIVALS
  };

  return (
    <FestivalContext.Provider value={value}>
      {children}
    </FestivalContext.Provider>
  );
};

export default FestivalProvider;
