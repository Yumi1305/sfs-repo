import '../pages/WelcomePage.css';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import TextPlugin from 'gsap/TextPlugin';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

function WelcomePage() {
  const words = ["Students", "Learners", "Creators", "Dreamers", "Achievers"];
  const blinkerRef = useRef(null);
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const textRef = useRef(null);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Refs to track animations for cleanup
  const lenisRef = useRef(null);
  const masterTlRef = useRef(null);
  const scrollTriggerRef = useRef(null);
  const blinkerTlRef = useRef(null);
  const subscriptionRef = useRef(null);
  const isUnmountingRef = useRef(false);

  useEffect(() => {
    // Initialize Lenis
    lenisRef.current = new Lenis({
      duration: 1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    function raf(time) {
      if (lenisRef.current && !isUnmountingRef.current) {
        lenisRef.current.raf(time);
        requestAnimationFrame(raf);
      }
    }
    requestAnimationFrame(raf);
    
    if (lenisRef.current) {
      lenisRef.current.on('scroll', ScrollTrigger.update);
    }

    // ScrollTrigger animation
    if (section1Ref.current && section2Ref.current) {
      gsap.set(section2Ref.current, { yPercent: 100 });
      scrollTriggerRef.current = gsap.to(section2Ref.current, {
        yPercent: 0,
        ease: "ease-in",
        scrollTrigger: {
          trigger: section1Ref.current,
          start: "top top",
          end: "top bottom",
          scrub: 1,
          pin: section1Ref.current,
          pinSpacing: true,
          markers: false
        }
      });
    }

    return () => {
      // Set unmounting flag
      isUnmountingRef.current = true;
      
      // Clean up in reverse order of creation
      try {
        // Kill all timelines first
        if (masterTlRef.current) {
          masterTlRef.current.kill();
          masterTlRef.current = null;
        }
        
        // Kill ScrollTrigger instances
        ScrollTrigger.getAll().forEach(trigger => {
          if (trigger) {
            trigger.kill(true);
          }
        });
        
        // Clear ScrollTrigger completely
        ScrollTrigger.clearMatchMedia();
        ScrollTrigger.refresh();
        
        // Destroy Lenis
        if (lenisRef.current) {
          lenisRef.current.destroy();
          lenisRef.current = null;
        }
      } catch (error) {
        console.warn('Cleanup error (safe to ignore):', error);
      }
    };
  }, [navigate]);

  return (
    <>
      <section ref={section1Ref} className="section main-content">
        <WelcomePageTop />
      </section>

      <section ref={section2Ref} className="section about-us">
        <div style={{ color: "white", padding: "2rem", textAlign: "center" }}>
          {/* Optional additional content */}
        </div>
      </section>
    </>
  );
}

export default WelcomePage;
