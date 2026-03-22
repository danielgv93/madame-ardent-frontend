import { useState, useRef, useEffect, useCallback } from 'react';

export interface SegmentOption {
  id: string;
  label: string;
}

interface Props {
  options: SegmentOption[];
  defaultActive?: string;
  onChange?: (id: string) => void;
}

export const SegmentedControl = ({ options, defaultActive, onChange }: Props) => {
  const [activeId, setActiveId] = useState(defaultActive || options[0]?.id);
  const [sliderStyle, setSliderStyle] = useState<React.CSSProperties>({ width: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<Map<string, HTMLButtonElement>>(new Map());

  const updateSlider = useCallback(() => {
    const btn = buttonsRef.current.get(activeId);
    if (btn) {
      setSliderStyle({
        width: btn.offsetWidth + 'px',
        left: btn.offsetLeft + 'px',
      });
    }
  }, [activeId]);

  useEffect(() => {
    requestAnimationFrame(updateSlider);
  }, [updateSlider]);

  useEffect(() => {
    window.addEventListener('resize', updateSlider);
    return () => window.removeEventListener('resize', updateSlider);
  }, [updateSlider]);

  const handleClick = (id: string) => {
    setActiveId(id);
    onChange?.(id);

    // Dispatch DOM event for non-React consumers
    containerRef.current?.dispatchEvent(
      new CustomEvent('segment-change', {
        detail: { id },
        bubbles: true,
      })
    );
  };

  return (
    <div
      ref={containerRef}
      className="segmented-control relative bg-(--color-primary-100) p-1 rounded-full inline-flex w-fit shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-black/5"
      data-active={activeId}
    >
      <div
        className="toggle-slider absolute top-1 left-1 h-[calc(100%-8px)] bg-(--color-primary) rounded-full transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] z-1"
        style={sliderStyle}
      />
      {options.map((option) => (
        <button
          key={option.id}
          ref={(el) => {
            if (el) buttonsRef.current.set(option.id, el);
          }}
          className={`toggle-option relative z-2 py-2.5 px-6 cursor-pointer transition-colors duration-400 ease-in-out text-lg bg-transparent border-none whitespace-nowrap text-(--color-secondary-500) ${
            option.id === activeId ? 'active text-white!' : ''
          }`}
          data-segment-id={option.id}
          type="button"
          onClick={() => handleClick(option.id)}
        >
          <span dangerouslySetInnerHTML={{ __html: option.label }} />
        </button>
      ))}
    </div>
  );
}

export default SegmentedControl;
