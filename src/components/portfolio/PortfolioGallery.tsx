import { useRef, useEffect, useCallback, useState } from 'react';
import type { PortfolioSection } from '../../data/portfolio-types';
import PortfolioCard from './PortfolioCard';
import '../../styles/portfolio.css';

interface Props {
  section: PortfolioSection;
}

const PortfolioGallery = ({ section }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [leftDisabled, setLeftDisabled] = useState(true);
  const [rightDisabled, setRightDisabled] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const holdStartRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const SPEED = 16;
  const HOLD_THRESHOLD = 150;
  const JUMP_AMOUNT = 300;

  const updateButtons = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    setLeftDisabled(scroll.scrollLeft <= 0);
    setRightDisabled(scroll.scrollLeft >= scroll.scrollWidth - scroll.clientWidth - 1);
  }, []);

  useEffect(() => {
    updateButtons();
  }, [updateButtons]);

  const startContinuousScroll = useCallback((direction: number) => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    holdStartRef.current = Date.now();
    scroll.classList.add('dragging');
    const step = () => {
      scroll.scrollLeft += direction * SPEED;
      updateButtons();
      animFrameRef.current = requestAnimationFrame(step);
    };
    animFrameRef.current = requestAnimationFrame(step);
  }, [updateButtons]);

  const stopContinuousScroll = useCallback((direction: number) => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const elapsed = Date.now() - holdStartRef.current;
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    scroll.classList.remove('dragging');
    if (elapsed < HOLD_THRESHOLD) {
      scroll.scrollBy({ left: direction * JUMP_AMOUNT, behavior: 'smooth' });
    }
  }, []);

  // Drag to scroll
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      hasDraggedRef.current = false;
      startXRef.current = e.pageX;
      scrollStartRef.current = scroll.scrollLeft;
      scroll.classList.add('dragging');
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.pageX - startXRef.current;
      if (Math.abs(dx) > 3) hasDraggedRef.current = true;
      scroll.scrollLeft = scrollStartRef.current - dx;
    };

    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      scroll.classList.remove('dragging');
    };

    const onClick = (e: MouseEvent) => {
      if (hasDraggedRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    scroll.addEventListener('mousedown', onMouseDown);
    scroll.addEventListener('scroll', updateButtons, { passive: true });
    scroll.addEventListener('click', onClick, true);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      scroll.removeEventListener('mousedown', onMouseDown);
      scroll.removeEventListener('scroll', updateButtons);
      scroll.removeEventListener('click', onClick, true);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [updateButtons]);

  return (
    <div className="mb-12">
      <div className="flex items-center gap-4 mb-6 px-8">
        <span className="text-xs tracking-[0.2em] uppercase text-secondary-500 whitespace-nowrap">{section.title}</span>
        <div className="grow h-px bg-black/10" />
      </div>
      <div className="relative group/wrapper">
        <button
          className="absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-black/10 bg-white text-primary flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-[opacity,transform] duration-200 opacity-0 group-hover/wrapper:opacity-100 hover:-translate-y-1/2 hover:scale-110 disabled:!opacity-0 disabled:cursor-default left-2"
          aria-label="Anterior"
          type="button"
          disabled={leftDisabled}
          onMouseDown={() => startContinuousScroll(-1)}
          onMouseUp={() => stopContinuousScroll(-1)}
          onMouseLeave={() => stopContinuousScroll(-1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="gallery-scroll flex gap-6 overflow-x-auto px-8 pt-2 pb-6 cursor-grab select-none" ref={scrollRef}>
          {section.images.map((image, i) => (
            <PortfolioCard key={i} image={image} />
          ))}
        </div>
        <button
          className="absolute top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-black/10 bg-white text-primary flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-[opacity,transform] duration-200 opacity-0 group-hover/wrapper:opacity-100 hover:-translate-y-1/2 hover:scale-110 disabled:!opacity-0 disabled:cursor-default right-2"
          aria-label="Siguiente"
          type="button"
          disabled={rightDisabled}
          onMouseDown={() => startContinuousScroll(1)}
          onMouseUp={() => stopContinuousScroll(1)}
          onMouseLeave={() => stopContinuousScroll(1)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>
    </div>
  );
}

export default PortfolioGallery;
