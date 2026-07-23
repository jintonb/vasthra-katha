import Link from 'next/link';
import { getProducts, getCategories, getBanners } from '@/lib/db';
import SareeCard from '@/components/SareeCard';
import HomeHeroCarousel from '@/components/HomeHeroCarousel';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const allProducts = await getProducts();
  const categories = await getCategories();
  const allBanners = await getBanners();

  // Filter active banners
  const activeBanners = allBanners.filter(b => b.isActive);
  const newArrivals = allProducts
    .filter(p => p.isPublished && p.isNewArrival)
    .slice(0, 4);
  const featuredProducts = allProducts
    .filter(p => p.isPublished && p.isFeatured)
    .slice(0, 4);

  // Retrieve all active main banners
  const homeBanners = activeBanners.filter(b => b.type === 'home_banner');

  const defaultBanners = [
    {
      id: 'default-1',
      title: "Heritage Elegance in Every Thread",
      subtitle: "Discover our handpicked collection of pure Kanchipuram silk and bridal sarees.",
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1600&q=80",
      link: "/collection?category=silk-sarees"
    },
    {
      id: 'default-2',
      title: "Artisanal Banarasi Brocades",
      subtitle: "Masterfully crafted heritage weaves directly from traditional Indian looms.",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&q=80",
      link: "/collection?category=banarasi"
    },
    {
      id: 'default-3',
      title: "Linen & Organza Summer Atelier",
      subtitle: "Experience lightweight elegance and breathy silhouettes for contemporary styling.",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1600&q=80",
      link: "/collection?category=organza"
    }
  ];

  const displayBanners = homeBanners.length > 0 ? homeBanners : defaultBanners;

  const festivalBanner = activeBanners.find(b => b.type === 'festival_banner');
  const offersBanner = activeBanners.find(b => b.type === 'offers_banner');

  return (
    <div className="homepage-container">
      {/* Hero Slider Carousel Section */}
      <HomeHeroCarousel banners={displayBanners} />

      {/* Brand Intro Summary */}
      <section className="about-widget">
        <div className="about-widget-img-box">
          <img
            src="/brand-intro.png"
            alt="Her Own Threads Handloom Craft"
          />
        </div>
        <div className="about-widget-content">
          <h2>Her Own Threads</h2>
          <p className="lead-text"><em>Where elegance meets authenticity.</em></p>
          <p>
            Welcome to Her Own Threads. We believe a saree is not just an outfit—it is an art form, a heritage, and a standard of grace. We bring you hand-selected, premium quality sarees that represent the pinnacle of Indian weaving traditions.
          </p>
          <p>
            From the heavy gold border Kanchipurams to the ethereal lightweight Organza drapes, each piece is selected to highlight the pure beauty of traditional craftsmanship. Explore our collections online and enquire directly for pricing and availability.
          </p>
          <Link href="/about" className="outline-btn">Our Story</Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section-container">
        <div className="section-header">
          <h2>Shop by Category</h2>
          <p>Explore our curated selections of fine textiles</p>
        </div>
        <div className="categories-grid">
          {categories.map((cat) => (
            <div key={cat.id} className="category-card">
              <img src={cat.image} alt={cat.name} className="category-img" />
              <div className="category-overlay">
                <h3 className="category-name">{cat.name}</h3>
                <p className="category-desc">{cat.description}</p>
                <Link href={`/collection?category=${cat.id}`} className="category-link-text">
                  Browse Category →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="section-container" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '5rem' }}>
          <div className="section-header">
            <h2>New Arrivals</h2>
            <p>Fresh additions to our exclusive saree collection</p>
          </div>
          <div className="saree-grid">
            {newArrivals.map((product) => (
              <SareeCard key={product.code} product={product} />
            ))}
          </div>
          <div className="view-all-container">
            <Link href="/collection?newArrival=true" className="outline-btn">
              View All New Arrivals
            </Link>
          </div>
        </section>
      )}

      {/* Offers Banner Section if active */}
      {offersBanner && (
        <section
          className="hero-slider"
          style={{
            backgroundImage: `url(${offersBanner.image})`,
            height: '40vh',
            minHeight: '280px',
            margin: '5rem 0'
          }}
        >
          <div className="hero-overlay" style={{ background: 'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.55))' }}></div>
          <div className="hero-content" style={{ textAlign: 'center' }}>
            <h2 className="hero-title" style={{ fontSize: '2.5rem', margin: '0 auto 0.75rem', maxWidth: '850px' }}>
              {offersBanner.title}
            </h2>
            <p className="hero-subtitle" style={{ margin: '0 auto 1.5rem', maxWidth: '650px', fontSize: '1.05rem' }}>
              {offersBanner.subtitle}
            </p>
            <Link href={offersBanner.link || "/collection"} className="hero-btn" style={{ padding: '0.7rem 1.8rem' }}>
              Explore Offers
            </Link>
          </div>
        </section>
      )}


      {/* Festival Promo Banner if active */}
      {festivalBanner && (
        <section
          className="hero-slider"
          style={{
            backgroundImage: `url(${festivalBanner.image})`,
            height: '45vh',
            minHeight: '300px',
            margin: '5rem 0'
          }}
        >
          <div className="hero-overlay" style={{ background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.6))' }}></div>
          <div className="hero-content" style={{ textAlign: 'center' }}>
            <h2 className="hero-title" style={{ fontSize: '2.5rem', margin: '0 auto 1rem', maxWidth: '800px' }}>
              {festivalBanner.title}
            </h2>
            <p className="hero-subtitle" style={{ margin: '0 auto 1.5rem', maxWidth: '600px' }}>
              {festivalBanner.subtitle}
            </p>
            <Link href={festivalBanner.link || "/collection"} className="hero-btn">
              Explore Festival Wear
            </Link>
          </div>
        </section>
      )}

      {/* Featured Collection Section */}
      {featuredProducts.length > 0 && (
        <section className="section-container">
          <div className="section-header">
            <h2>Featured Collection</h2>
            <p>Our handpicked pieces of exceptional style and artistry</p>
          </div>
          <div className="saree-grid">
            {featuredProducts.map((product) => (
              <SareeCard key={product.code} product={product} />
            ))}
          </div>
          <div className="view-all-container">
            <Link href="/collection?featured=true" className="outline-btn">
              View Featured Collection
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
