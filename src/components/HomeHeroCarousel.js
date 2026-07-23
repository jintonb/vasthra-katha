'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomeHeroCarousel({ banners = [] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 6000); // Change slide every 6 seconds

    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <section className="hero-slider" aria-label="Heritage Saree Showcases">
      {banners.map((banner, index) => {
        const isActive = index === current;
        return (
          <div
            key={banner.id || index}
            className="hero-slide"
            style={{
              backgroundImage: `url(${banner.image})`,
              opacity: isActive ? 1 : 0,
              zIndex: isActive ? 5 : 1,
              pointerEvents: isActive ? 'auto' : 'none',
              transition: 'opacity 1s ease-in-out',
            }}
          >
            <div className="hero-overlay"></div>
            <div className="hero-content">
              <h1 className="hero-title">{banner.title}</h1>
              {banner.subtitle && <p className="hero-subtitle">{banner.subtitle}</p>}
              <Link href={banner.link || "/collection"} className="hero-btn">
                Explore Collection
              </Link>
            </div>
          </div>
        );
      })}

      {/* Slide Navigation Buttons (Render only if more than 1 banner) */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="carousel-control-btn prev-btn"
            aria-label="Previous banner slide"
          >
            &#10094;
          </button>
          <button
            onClick={nextSlide}
            className="carousel-control-btn next-btn"
            aria-label="Next banner slide"
          >
            &#10095;
          </button>

          {/* Indicator Dot Indicators */}
          <div className="carousel-dots">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`carousel-dot ${idx === current ? 'active' : ''}`}
                aria-label={`Jump to banner slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Embedded Component Specific CSS */}
      <style jsx global>{`
        .carousel-control-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 15;
          transition: all 0.3s ease;
        }
        .carousel-control-btn:hover {
          background: var(--accent);
          color: var(--primary);
          border-color: var(--accent);
        }
        .prev-btn {
          left: 2rem;
        }
        .next-btn {
          right: 2rem;
        }
        .carousel-dots {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.75rem;
          z-index: 15;
        }
        .carousel-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          border: none;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .carousel-dot.active {
          background: var(--accent);
          transform: scale(1.2);
          box-shadow: 0 0 8px var(--accent);
        }
        @media (max-width: 768px) {
          .carousel-control-btn {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }
          .prev-btn { left: 1rem; }
          .next-btn { right: 1rem; }
        }
      `}</style>
    </section>
  );
}
