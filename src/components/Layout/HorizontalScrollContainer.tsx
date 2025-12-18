import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  showArrows?: boolean;
  snapToItems?: boolean;
  itemWidth?: number;
  gap?: number;
}

export function HorizontalScrollContainer({ 
  children, 
  className = '', 
  showArrows = true,
  snapToItems = false,
  itemWidth = 280,
  gap = 16
}: HorizontalScrollContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const checkScrollability = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const scrollAmount = snapToItems ? itemWidth + gap : 300;
    const newScrollLeft = direction === 'left' 
      ? scrollRef.current.scrollLeft - scrollAmount
      : scrollRef.current.scrollLeft + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const handleScroll = () => {
    if (!isScrolling) {
      setIsScrolling(true);
      setTimeout(() => setIsScrolling(false), 150);
    }
    checkScrollability();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Left Arrow */}
      {showArrows && canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all"
          style={{ touchAction: 'manipulation' }}
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Right Arrow */}
      {showArrows && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all"
          style={{ touchAction: 'manipulation' }}
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`overflow-x-auto overflow-y-hidden scrollbar-hide ${
          snapToItems ? 'snap-x snap-mandatory' : ''
        } ${showArrows ? 'px-6' : ''}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div 
          className={`flex ${snapToItems ? 'space-x-4' : `gap-${gap / 4}`} min-w-max`}
          style={snapToItems ? { gap: `${gap}px` } : undefined}
        >
          {React.Children.map(children, (child, index) => (
            <div 
              key={index}
              className={snapToItems ? 'snap-start flex-shrink-0' : 'flex-shrink-0'}
              style={snapToItems ? { width: `${itemWidth}px` } : undefined}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="flex justify-center mt-3 space-x-1">
        {React.Children.toArray(children).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              isScrolling ? 'bg-blue-400' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}