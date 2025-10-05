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

    // Blinker animation
    if (blinkerRef.current) {
      blinkerTlRef.current = gsap.to(blinkerRef.current, {
        opacity: 0,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
      });
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

    // Text animation
    if (textRef.current) {
      masterTlRef.current = gsap.timeline({ repeat: -1 });
      words.forEach((word) => {
        let tlText = gsap.timeline({ repeat: 1, yoyo: true, repeatDelay: 1.5 });
        tlText.to(textRef.current, {
          duration: 1,
          text: {
            value: word,
            delimiter: ""
          }
        });
        masterTlRef.current.add(tlText);
      });
    }

    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isUnmountingRef.current) return;
      
      if (event === 'SIGNED_IN' && session) {
        // Create or update user profile
        await createOrUpdateUserProfile(session.user);
        if (!isUnmountingRef.current) {
          navigate('/mainpg');
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear any local state if needed
        if (!isUnmountingRef.current) {
          setEmail('');
          setPassword('');
          setError('');
          setMessage('');
        }
      }
    });
    
    subscriptionRef.current = subscription;

    // Check if user is already logged in
    const checkUser = async () => {
      if (isUnmountingRef.current) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !isUnmountingRef.current) {
        await createOrUpdateUserProfile(session.user);
        navigate('/mainpg');
      }
    };
    checkUser();

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
        
        if (blinkerTlRef.current) {
          blinkerTlRef.current.kill();
          blinkerTlRef.current = null;
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
        
        // Unsubscribe from auth
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      } catch (error) {
        console.warn('Cleanup error (safe to ignore):', error);
      }
    };
  }, [navigate]);

  const createOrUpdateUserProfile = async (user) => {
    if (isUnmountingRef.current) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          avatar_url: user.user_metadata?.avatar_url || null,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'id' 
        });

      if (error) {
        console.error('Error creating/updating user profile:', error);
      }
    } catch (err) {
      console.error('Error in createOrUpdateUserProfile:', err);
    }
  };

  const handleLogin = async (e) => {
  console.log('handleLogin called!', e); // Add this
  e.preventDefault();
  
  console.log('Starting login process...'); // Add this
  setLoading(true);
  setError('');
  setMessage('');

  try {
    console.log('Attempting to sign in with:', { email, password: '***' }); // Add this
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (error && !isUnmountingRef.current) {
      console.log('Login error:', error); // Add this
      setError(error.message);
    } else {
      console.log('Login successful!'); // Add this
      navigate('/mainpg');
    }
  } catch (err) {
    console.log('Login exception:', err); // Add this
    if (!isUnmountingRef.current) {
      setError('An unexpected error occurred. Please try again.');
    }
  } finally {
    setLoading(false);

  }
};
  const handleGoogleLogin = async () => {
    // if (isUnmountingRef.current) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/mainpg`
        }
      });
      
      if (error && !isUnmountingRef.current) {
        setError(error.message);
      }
    } catch (err) {
      if (!isUnmountingRef.current) {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {

      setLoading(false);

    }
  };

  const handleSignupRedirect = (e) => {
    e.preventDefault();
    
    // Set unmounting flag immediately
    isUnmountingRef.current = true;
    
    // Clean up animations before navigation
    try {
      if (masterTlRef.current) {
        masterTlRef.current.kill();
      }
      if (blinkerTlRef.current) {
        blinkerTlRef.current.kill();
      }
      ScrollTrigger.getAll().forEach(trigger => trigger.kill(true));
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
    } catch (error) {
      console.warn('Pre-navigation cleanup error:', error);
    }
    
    // Navigate immediately
    navigate('/signup');
  };

  const handleForgotPassword = async () => {
    if (isUnmountingRef.current) return;
    
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error && !isUnmountingRef.current) {
        setError(error.message);
      } else if (!isUnmountingRef.current) {
        setMessage('Password reset email sent! Check your inbox and follow the link to reset your password.');
      }
    } catch (err) {
      if (!isUnmountingRef.current) {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      if (!isUnmountingRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <section ref={section1Ref} className="section main-content">
        <div className="left">
          <div className="t">
            <div className="title t1">Students for</div>
            <div className="title students-interactive">
              <span ref={textRef}></span>
              <div className="blinker" ref={blinkerRef}>
                _
              </div>
            </div>
            <p className="desc">Empowering the next generation of learners.</p>
          </div>
        </div>

        <div className="right">
          <div className="signup-container">
            <div className="signup-card">
              <h2
                style={{
                  color: "var(--orange)",
                }}
              >
                Welcome back!
              </h2>

              {message && (
                <div
                  style={{
                    color: "green",
                    marginBottom: "1rem",
                    padding: "0.5rem",
                    backgroundColor: "#e8f5e8",
                    borderRadius: "4px",
                  }}
                >
                  {message}
                </div>
              )}

              {error && (
                <div
                  style={{
                    color: "red",
                    marginBottom: "1rem",
                    padding: "0.5rem",
                    backgroundColor: "#fef2f2",
                    borderRadius: "4px",
                  }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <input
                  style={{
                    borderRadius: "20px",
                    paddingLeft: "20px",
                    fontSize: "0.9rem",
                  }}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email"
                  required
                />
                <input
                  style={{
                    borderRadius: "20px",
                    paddingLeft: "20px",
                    marginBottom: "9px",
                    fontSize: "0.9rem",
                  }}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  required
                />
                
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--blue)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    marginBottom: "0.8rem",
                    textAlign: "left",
                    paddingLeft: "10px",
                  }}
                  disabled={loading}
                >
                  Forgot your password?
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  onClick={handleLogin}
                  style={{
                    border: "none",
                    borderRadius: "20px",
                    padding: "10px",
                    color: "var(--background-color)",
                    backgroundColor: "var(--orange)",
                  }}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  width: "100%",
                  padding: "10px 16px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #dadce0",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#3c4043",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  marginTop: "1rem",
                  fontFamily: "Roboto, arial, sans-serif",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285f4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34a853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fbbc05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#ea4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {loading ? "Signing in..." : "Sign in with Google"}
              </button>

              <p className="signin-link">
                Don't have an account?
                <span
                  onClick={handleSignupRedirect}
                  style={{
                    color: "var(--blue)",
                    cursor: "pointer",
                    marginLeft: "0.5rem",
                  }}
                >
                  Sign up
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="scroll-down-stack">
          <svg className="chevron" viewBox="0 0 24 24">
            <path
              d="M6 8l6 6 6-6"
              fill="none"
              stroke="#202d7d"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <svg className="chevron delay1" viewBox="0 0 24 24">
            <path
              d="M6 8l6 6 6-6"
              fill="none"
              stroke="#202d7d"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
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
