import NavBar from '../../components/NavBar';
import styles from './Donations.module.css';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useCursor, useCursorInteractions } from '../../contexts/CursorContext';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger)

const useSmoothScroll = () => {
  const wrapperRef = useRef();
  const contentRef = useRef();


  useEffect(() => {
    let scrollY = 0;
    let currentY = 0;

    const updateScroll = () => {
      scrollY = window.pageYOffset;
      
      // Smooth interpolation
      currentY = gsap.utils.interpolate(currentY, scrollY, 0.1);
      
      if (contentRef.current) {
        gsap.set(contentRef.current, {
          y: -currentY
        });
      }
      
      requestAnimationFrame(updateScroll);
    };

    // Set up the container
    if (wrapperRef.current) {
      gsap.set(wrapperRef.current, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      });
    }

    // Set body height for scroll bar
    document.body.style.height = `${contentRef.current?.scrollHeight}px`;

    updateScroll();

    return () => {
      document.body.style.height = 'auto';
    };
  }, []);

  return { wrapperRef, contentRef };
};

function Donations(){
  const {wrapperRef, contentRef} = useSmoothScroll();
  const {hover, resetCursor} = useCursor();
  const missionRef = useRef();


  useEffect(() => {
    // Animation for the stats section
    gsap.utils.toArray(`.${styles["reveal-up"]}`).forEach((element, i) => {
      gsap.fromTo(element, {
        opacity: 0,
        y: 20
      }, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: i * 0.1,
        scrollTrigger: {
          trigger: element,
          start: "top 80%",
          toggleActions: "play none none none"
        }
      });
    });

    // Animation for progress bars
    gsap.utils.toArray(`.${styles["progress-bar"]}`).forEach(bar => {
      const width = bar.style.width;
      bar.style.width = '0%';
      
      ScrollTrigger.create({
        trigger: bar,
        start: "top 80%",
        onEnter: () => {
          gsap.to(bar, {
            width: width,
            duration: 1.5,
            ease: "power3.out"
          });
        }
      });
    });

    // Your existing intersection observer code
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry)=>{
          if (entry.isIntersecting){
            gsap.to(entry.target, {
              opacity: 1,
              filter: 'blur(0px)',
              duration: 0.8
            })
          } else{
            gsap.to(entry.target, {
              opacity: 0.4,
              filter: "blur(1.5rem)",
              duration: 0.8,
            });
          }
        })
      }, 
      {threshold: 0.5}
    )
    if (missionRef.current) {
      observer.observe(missionRef.current);
    }
    return () => observer.disconnect();
  }, [])

  return (
    <div ref={wrapperRef}>
      <div ref={contentRef}>
        <div className={styles.container}>
          <NavBar></NavBar>
          <section
            className={styles.head}
            onMouseEnter={hover}
            onMouseLeave={resetCursor}
          >
            <div className={styles.squares}>
              <div className={styles.square}></div>
              <div className={styles.square}></div>
            </div>

            <div className={styles["book-container"]}>
              <div className={styles.book}></div>
              <div className={styles.book}></div>
            </div>
            <div className={styles.left} style={{ color: "white" }}>
              <h1 className={styles.header1}>
                Help us sustain our large learning platform.
              </h1>
              <h3 className={styles.header2}>
                Your impact is just one click away
              </h3>
              <button
                className={styles["donate-btn"]}
                onClick={() => window.open("https://gofund.me/07060664")}
              >
                Donate
              </button>
            </div>
            <div className={styles["computer"]}></div>
          </section>
          <section className={styles["mission-container"]}>
            <section className={styles["our-mission"]}>
              <svg
                className={styles["sparkle-icon"]}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                id="Sparkle--Streamline-Phosphor"
              >
                <desc>Sparkle Streamline Icon: https://streamlinehq.com</desc>
                <path d="m12.4329 8.34055 -3.4854875 -1.2879625 -1.2839125 -3.48819375c-0.28606875 -0.77715625 -1.3061625 -0.95320625 -1.83616875 -0.31688125 -0.07863125 0.09440625 -0.1405125 0.20158125 -0.18295 0.31688125l-1.292025 3.48819375 -3.4881875 1.2839125c-0.7771625 0.28606875 -0.95320625 1.3061625 -0.31688125 1.83616875 0.09440625 0.07863125 0.20158125 0.1405125 0.31688125 0.18295l3.4881875 1.292025 1.2839125 3.4881875c0.28606875 0.7771625 1.3061625 0.95320625 1.83616875 0.31688125 0.0786375 -0.09440625 0.1405125 -0.20158125 0.18295625 -0.31688125l1.29201875 -3.4881875 3.48819375 -1.2839125c0.77715625 -0.28606875 0.95320625 -1.3061625 0.31688125 -1.83616875 -0.09440625 -0.0786375 -0.20158125 -0.1405125 -0.31688125 -0.18295625Zm-4.09365625 2.37591875c-0.14850625 0.05473125 -0.26556875 0.17179375 -0.3203 0.3203l-1.36905625 3.70915625 -1.36635625 -3.70645c-0.05465625 -0.15010625 -0.1729 -0.26835 -0.32300625 -0.32300625l-3.70645 -1.36635625 3.70645 -1.36635c0.15010625 -0.05465625 0.26835 -0.17290625 0.32300625 -0.32300625l1.36635625 -3.70645625 1.36635 3.70645625c0.05473125 0.14850625 0.1718 0.26556875 0.32030625 0.3203l3.70915625 1.36905625Zm0.473025 -8.3940875c0 -0.2985625 0.24203125 -0.54059375 0.54059375 -0.54059375h1.0811875V0.70059375c0 -0.41615 0.4505 -0.67624375 0.81089375 -0.46816875 0.1672625 0.09656875 0.2703 0.27503125 0.2703 0.46816875v1.08119375h1.0811875c0.41615 0 0.67624375 0.45049375 0.46816875 0.8108875 -0.0965625 0.16725625 -0.27504375 0.27029375 -0.46816875 0.2703h-1.0811875v1.0811875c0 0.41615 -0.4505 0.67624375 -0.81089375 0.46816875 -0.1672625 -0.0965625 -0.2703 -0.27503125 -0.2703 -0.46816875v-1.0811875h-1.0811875c-0.298575 0.0000125 -0.54059375 -0.242025 -0.54059375 -0.54059375ZM15.84 5.56595c0 0.29855 -0.24204375 0.54058125 -0.54059375 0.54059375h-0.54059375v0.54059375c0 0.41615 -0.4505 0.67624375 -0.81089375 0.46816875 -0.1672625 -0.09656875 -0.2703 -0.27503125 -0.2703 -0.46816875v-0.54059375h-0.54059375c-0.41615 0.00001875 -0.6762375 -0.4504625 -0.46818125 -0.81086875 0.0965625 -0.167275 0.2750375 -0.27031875 0.46818125 -0.27031875h0.54059375v-0.5406c0 -0.41615 0.4505 -0.67624375 0.81089375 -0.46816875 0.1672625 0.09656875 0.2703 0.2750375 0.2703 0.46816875v0.5406h0.54059375c0.2985625 0 0.54059375 0.24203125 0.54059375 0.54059375Z"></path>
              </svg>
              <h3
                style={{
                  marginLeft: "5px",
                  fontFamily: "Clash Display",
                  color: "rgb(227, 211, 255)",
                  letterSpacing: "1px",
                  fontSize: "1.1rem",
                }}
              >
                OUR MISSION
              </h3>
            </section>
            <h1
              className={styles["mission-statement"]}
              onMouseEnter={hover}
              onMouseLeave={resetCursor}
              ref={missionRef}
            >
              <span className={styles.catch}>
                All the resources you could ever need in one website. {" "}
              </span>
              Students for Students is a nonprofit organization creating a virtual peer learning environment.{" "}
              <span className={styles.highlight}>
                Help us save your time.
              </span>{" "}
            </h1>
          </section>
          <div className={styles.divider}>
            <div className={styles.plus}>+</div>
            <div className={styles.line}></div>
            <div className={styles.plus}>+</div>
          </div>
         
          <div className="calendly-inline-widget" data-url="https://calendly.com/xueyumi13/30min"></div>
          <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
        </div>
      </div>
    </div>
  );
}

export default Donations;