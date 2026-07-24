import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Creates the cinematic storytelling timeline for the Home page hero.
 * Narrative: Frame -> Lens -> Light -> Vision -> Collection
 */
export function createHeroNarrativeTimeline(containerRef: React.RefObject<HTMLElement | null>) {
  if (!containerRef.current) return;

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=400%',
        scrub: 1, // Smooth scrubbing, takes 1 second to catch up
        pin: true,
        anticipatePin: 1,
      },
    });

    // We will assume classes like .story-frame, .story-lens, etc., exist inside the container.
    // Frame fades in and scales up
    tl.to('.story-frame', { scale: 1.5, opacity: 0, duration: 1 })
      // Lens comes into focus
      .fromTo('.story-lens', { opacity: 0, scale: 0.8, filter: 'blur(20px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1 }, '<0.5')
      .to('.story-lens', { scale: 1.2, opacity: 0, duration: 1 })
      // Light sweeps across
      .fromTo('.story-light', { opacity: 0, x: -100 }, { opacity: 1, x: 0, duration: 1 }, '<0.5')
      .to('.story-light', { opacity: 0, x: 100, duration: 1 })
      // Vision becomes clear
      .fromTo('.story-vision', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1 }, '<0.5')
      .to('.story-vision', { opacity: 0, y: -50, duration: 1 })
      // Collection reveals
      .fromTo('.story-collection', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1 }, '<0.5');
  }, containerRef);

  return ctx; // Return context for cleanup
}
