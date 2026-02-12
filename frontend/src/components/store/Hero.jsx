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
      <div className="relative flex items-center min-h-[clamp(520px,90vh,1000px)] overflow-hidden">

        {/* Background Images */}
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          alt=""
          aria-hidden="true"
          style={{ imageRendering: "auto" }}
 className={`absolute inset-0 h-full w-full object-cover object-center
  transition-opacity duration-[1800ms] ease-linear
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

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />

        {/* Content */}
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="max-w-xl text-left text-white">

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-montserrat leading-tight mb-6">
              Discover Our<br />
              <span>Latest Collection</span>
            </h1>

            <p className="text-base sm:text-lg mb-8 opacity-90 leading-relaxed max-w-md font-montserrat">
              Shop premium quality products at
              <br />
              unbeatable prices.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <a
                href="#products"
                onClick={handleShopNow}
                className="bg-blue-700 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-medium text-lg transition-all duration-300 hover:scale-105 w-[min(92vw,420px)] mx-auto sm:w-auto sm:mx-0 text-center"
              >
                SHOP NOW
              </a>

              <a
                href="#categories"
                onClick={handleExploreCategories}
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 w-[min(92vw,420px)] mx-auto sm:w-auto sm:mx-0 text-center"
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