// contexts/CursorContext.jsx
import React, { createContext, useContext, useRef, useEffect } from 'react';
import gsap from 'gsap';

const CursorContext = createContext();

export const useCursor = () => {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
};

export const CursorProvider = ({ children }) => {
  const cursorRef = useRef();

  useEffect(() => {
    // Set initial cursor position
    if (cursorRef.current) {
      gsap.set(cursorRef.current, {
        x: -100, // Start off-screen
        y: -100,
        xPercent: -50,
        yPercent: -50,
        width: 15,
        height: 15,
        backgroundColor: "rgb(255, 255, 255)",
        borderWidth: 0,
        borderStyle: "solid",
        borderColor: "white",
        borderRadius: "50%"
      });
    }

    const handleMouseMove = (e) => {
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.1,
          ease: "power2.out",
          xPercent: -50,
          yPercent: -50
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Cursor animation methods
  const animateCursor = (properties) => {
    if (cursorRef.current) {
      gsap.to(cursorRef.current, {
        ...properties,
        duration: properties.duration || 0.2,
        ease: properties.ease || "power2.inOut",
        transform: cursorRef.current.transform
      });
    }
  };

  const resetCursor = () => {
    animateCursor({
      width: 15,
      height: 15,
      backgroundColor: "rgb(255, 255, 255)",
      borderWidth: 0,
      borderRadius: "50%"
    });
  };

  // Predefined cursor states
  const cursorStates = {
    hover: () => animateCursor({
      width: 50,
      height: 50,
      backgroundColor: "rgba(154, 152, 255, 0)",
      borderWidth: 1,
      borderColor: "rgb(199, 192, 255)"
    }),
    
    click: () => animateCursor({
      width: 25,
      height: 25,
      backgroundColor: "rgba(255,255,255,0.8)",
      duration: 0.1
    }),
    
    text: () => animateCursor({
      width: 2,
      height: 20,
      backgroundColor: "white",
      borderRadius: "1px"
    }),
    
    loading: () => animateCursor({
      width: 30,
      height: 30,
      backgroundColor: "rgba(255,255,255,0.3)",
      borderWidth: 2,
      borderColor: "white"
    })
  };

  const contextValue = {
    cursorRef,
    animateCursor,
    resetCursor,
    ...cursorStates
  };

  return (
    <CursorContext.Provider value={contextValue}>
      {children}
      <div 
        ref={cursorRef}
        className="cursor"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          transform: 'translate(-50%, -50%)'
        }}
      />
    </CursorContext.Provider>
  );
};

// Custom hook for common cursor interactions
export const useCursorInteractions = () => {
  const { hover, resetCursor, click } = useCursor();

  return {
    onMouseEnter: hover,
    onMouseLeave: resetCursor,
    onClick: () => {
      click();
      setTimeout(resetCursor, 150);
    }
  };
};
