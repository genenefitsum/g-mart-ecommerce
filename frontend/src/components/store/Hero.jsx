import { useEffect, useMemo, useState } from "react";

import heroImage from "../../assets/hero.jpeg";
import img1 from "../../assets/download.jpeg";
import img2 from "../../assets/download (2).jpeg";
import img3 from "../../assets/download (3).jpeg";
import img4 from "../../assets/download (4).jpeg";
import img5 from "../../assets/download (5).jpeg";
import img6 from "../../assets/download (6).jpeg";

const HeroSection = () => {
  const images = useMemo(
    () => [heroImage, img1, img2, img3, img4, img5, img6],
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto image change (5.2s)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5200);

    return () => clearInterval(interval);
  }, [images.length]);

  const handleShopNow = (e) => {
    e.preventDefault();
    const section = document.getElementById("products");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleExploreCategories = (e) => {
    e.preventDefault();
    const section = document.getElementById("categories");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="w-full m-0 p-0">
      <div className="relative flex items-center min-h-[clamp(440px,76vh,880px)] overflow-hidden">

        {/* Background Images */}
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt=""
            aria-hidden="true"
            style={{ imageRendering: "auto" }}
            className={`absolute inset-0 h-full w-full object-cover object-center
  transition-opacity [transition-duration:1800ms] ease-linear
  will-change-transform will-change-opacity
  transform-gpu backface-visibility-hidden
  ${
    index === currentIndex
      ? "opacity-100 animate-heroCinematic"
      : "opacity-0"
  }`}
            loading="eager"
            decoding="async"
          />
        ))}

        {/* Gradient Overlay - darker on mobile for crisp text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30 sm:to-transparent" />

        {/* Content */}
        <div className="relative container mx-auto px-5 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28">
          <div className="max-w-xl text-left text-white">

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold font-montserrat leading-tight mb-4 sm:mb-6 tracking-tight">
              Discover Our<br />
              <span>Latest Collection</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 opacity-90 leading-relaxed max-w-md font-montserrat">
              Shop premium quality products at
              <br />
              unbeatable prices.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              <a
                href="#products"
                onClick={handleShopNow}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-7 py-3.5 rounded-xl font-semibold text-sm sm:text-base tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-95 w-full sm:w-auto text-center shadow-lg shadow-blue-900/30"
              >
                SHOP NOW
              </a>

              <a
                href="#categories"
                onClick={handleExploreCategories}
                className="border-2 border-white/80 text-white px-7 py-3.5 rounded-xl font-semibold text-sm sm:text-base tracking-wide hover:bg-white hover:text-black active:bg-white/90 active:text-black transition-all duration-200 hover:scale-[1.02] active:scale-95 w-full sm:w-auto text-center backdrop-blur-sm bg-black/10"
              >
                EXPLORE CATEGORIES
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;