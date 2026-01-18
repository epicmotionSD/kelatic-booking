'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StylistCarousel } from '@/components/home/stylist-carousel';
import { Footer } from '@/components/layout/footer';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';
import {
  Calendar,
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  Instagram,
  ChevronRight,
  Sparkles,
  Heart,
  Shield,
  Award,
  Menu,
  X,
  Play,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
  base_price: number;
  duration: number;
  description?: string;
}

interface Stylist {
  id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  specialties?: string[];
  instagram_handle?: string;
}

export default function LandingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, stylistsRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/stylists'),
      ]);

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.services?.slice(0, 6) || []);
      }

      if (stylistsRes.ok) {
        const data = await stylistsRes.json();
        setStylists(data.stylists || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const featuredServices = services.length > 0 ? services : [
    { id: '1', name: 'Loc Retwist', category: 'locs', base_price: 85, duration: 90, description: 'Maintain your locs with our expert retwist service' },
    { id: '2', name: 'Starter Locs', category: 'locs', base_price: 200, duration: 180, description: 'Begin your loc journey with us' },
    { id: '3', name: 'Loc Clarifying Treatment', category: 'locs', base_price: 150, duration: 120, description: 'Deep cleanse and rejuvenate your locs' },
    { id: '4', name: 'Loc Extensions', category: 'locs', base_price: 300, duration: 240, description: 'Add length and fullness to your locs' },
    { id: '5', name: 'Loc Repair', category: 'locs', base_price: 100, duration: 90, description: 'Fix thinning, breakage, or damaged locs' },
    { id: '6', name: 'Loc Styling', category: 'locs', base_price: 75, duration: 60, description: 'Updos, styles, and special occasion looks' },
  ];

  const featuredStylists = stylists.length > 0 ? stylists : [
    { id: '1', first_name: 'Kel', last_name: '', bio: 'Master loctician with 15+ years of experience. Known as "The Loc Gawd" for expert loc installation and maintenance.', specialties: ['Starter Locs', 'Retwists', 'Loc Repair'], instagram_handle: 'kelatic' },
    { id: '2', first_name: 'Destiny', last_name: '', bio: 'Skilled loctician specializing in loc styling and creative loc designs.', specialties: ['Loc Styling', 'Retwists', 'Color'], instagram_handle: '' },
    { id: '3', first_name: 'Shoop', last_name: '', bio: 'Loc specialist with a keen eye for detail and a passion for healthy locs.', specialties: ['Retwists', 'Loc Clarifying Treatment', 'Maintenance'], instagram_handle: '' },
  ];

  const testimonials = [
    { name: 'Aisha M.', text: 'Best loc retwist I\'ve ever had! Kel really knows his craft. My locs have never looked better.', rating: 5 },
    { name: 'Terrence W.', text: 'Started my loc journey here 2 years ago. The team is amazing and my locs are thriving!', rating: 5 },
    { name: 'Marcus J.', text: 'Finally found a salon that understands men\'s locs. Professional service every time.', rating: 5 },
    { name: 'Keisha R.', text: 'The loc clarifying treatment was amazing. My scalp feels so clean and my locs are thriving!', rating: 5 },
  ];

  const stylistMenu = featuredStylists;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="Kelatic Hair Lounge"
                className="h-14 w-auto"
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-10">
              <Link href="/services" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Services</Link>
              <div className="relative group">
                <button
                  type="button"
                  className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors inline-flex items-center gap-1"
                >
                  Book a Stylist
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </button>
                <div className="absolute left-0 mt-3 w-56 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {stylistMenu.map((stylist) => (
                    <Link
                      key={stylist.id}
                      href={`/book?stylist=${stylist.id}`}
                      className="block px-4 py-2 text-sm text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors"
                    >
                      {stylist.first_name} {stylist.last_name}
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/special-offers" className="text-sm font-medium text-amber-400 hover:text-yellow-400 transition-colors animate-pulse">$75 Wednesday Special</Link>
              <Link href="/gallery" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Gallery</Link>
              <Link href="/loc-academy" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Loc Academy</Link>
              <Link href="/blog" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Blog</Link>
              <Link href="/barber-block" className="text-sm font-medium text-white/70 hover:text-red-400 transition-colors">Barber Block</Link>
              <a href="#contact" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Contact</a>
              <PublicAuthLinks />
              <Link
                href="/book"
                className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:scale-105"
              >
                Book Now
              </Link>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden relative">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/10 text-white/80 hover:text-amber-400 hover:border-amber-400/40 transition-colors"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              {mobileMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur shadow-xl overflow-hidden z-50">
                  <div className="py-2">
                    <Link
                      href="/services"
                      className="block px-4 py-2 text-sm text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Services
                    </Link>
                    <Link
                      href="/special-offers"
                      className="block px-4 py-2 text-sm text-amber-400 hover:text-yellow-300 hover:bg-white/5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      $75 Wednesday Special
                    </Link>
                    <Link
                      href="/gallery"
                      className="block px-4 py-2 text-sm text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Gallery
                    </Link>
                    <Link
                      href="/loc-academy"
                      className="block px-4 py-2 text-sm text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Loc Academy
                    </Link>
                    <Link
                      href="/blog"
                      className="block px-4 py-2 text-sm text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Blog
                    </Link>
                    <Link
                      href="/barber-block"
                      className="block px-4 py-2 text-sm text-white/80 hover:text-red-300 hover:bg-white/5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Barber Block
                    </Link>
                    <a
                      href="#contact"
                      className="block px-4 py-2 text-sm text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Contact
                    </a>
                  </div>
                  <div className="border-t border-white/10 py-2">
                    <div className="px-4 py-1 text-[10px] uppercase tracking-widest text-white/40">Book a Stylist</div>
                    {stylistMenu.map((stylist) => (
                      <Link
                        key={stylist.id}
                        href={`/book?stylist=${stylist.id}`}
                        className="block px-4 py-2 text-sm text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {stylist.first_name} {stylist.last_name}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-white/10 py-2">
                    <div className="px-4 py-1 text-[10px] uppercase tracking-widest text-white/40">Login</div>
                    <Link
                      href="/login?type=client&redirect=/account"
                      className="block px-4 py-2 text-sm text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Client Login
                    </Link>
                    <Link
                      href="/login?type=stylist&redirect=/stylist"
                      className="block px-4 py-2 text-sm text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Stylist Login
                    </Link>
                    <Link
                      href="/login?type=admin&redirect=/admin"
                      className="block px-4 py-2 text-sm text-white/80 hover:text-amber-300 hover:bg-white/5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Login
                    </Link>
                  </div>
                  <div className="border-t border-white/10 p-3">
                    <Link
                      href="/book"
                      className="block w-full text-center px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
            {/* Left - Hero Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-widest text-amber-400">
                Houston&apos;s Premier Loc Lounge
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mt-6">
                Your Crown Deserves
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
                  Expert Loc Care
                </span>
              </h1>
              <p className="text-lg text-white/60 mt-6 max-w-xl">
                From starter locs to precision retwists, Kelatic Hair Lounge delivers master-level loc artistry in Houston.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-8">
                <Link
                  href="/book"
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  Book Your Appointment
                </Link>
                <a
                  href="/gallery"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 rounded-full text-sm font-semibold text-white/80 hover:text-amber-400 hover:border-amber-400/40 transition-all"
                >
                  <Play className="w-4 h-4" />
                  Watch Our Work
                </a>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-8">
                <div className="text-center">
                  <div className="text-4xl font-black text-amber-400">15+</div>
                  <div className="text-sm text-white/50">Years</div>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div className="text-center">
                  <div className="text-4xl font-black text-amber-400">5K+</div>
                  <div className="text-sm text-white/50">Clients</div>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div className="text-center">
                  <div className="flex items-center gap-1 text-4xl font-black text-amber-400">
                    4.9 <Star className="w-7 h-7 fill-amber-400" />
                  </div>
                  <div className="text-sm text-white/50">Rating</div>
                </div>
              </div>
            </div>

            {/* Right - Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main image placeholder */}
                <div className="aspect-[3/4] rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-500/20 flex items-center justify-center backdrop-blur-sm border border-amber-400/30">
                      <span className="text-6xl font-black text-amber-400">K</span>
                    </div>
                  </div>
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Floating elements */}
                <div className="absolute -left-8 top-1/4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <div className="font-bold">Open Today</div>
                      <div className="text-sm text-white/50">9AM - 7PM</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-8 top-1/2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-[float_3s_ease-in-out_infinite_0.5s]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <div className="font-bold">Top Rated</div>
                      <div className="text-sm text-white/50">500+ Reviews</div>
                    </div>
                  </div>
                </div>

                {/* Wednesday special */}
                <div className="absolute -right-4 top-8 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full px-5 py-2.5 shadow-xl shadow-amber-500/30 animate-[float_3s_ease-in-out_infinite_1s]">
                  <div className="flex items-center gap-2 font-bold">
                    <Sparkles className="w-4 h-4" />
                    $75 Wednesdays!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Carousel Section */}
      <StylistCarousel />

      {/* Gallery Section */}
      <section id="gallery" className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-amber-400 font-medium tracking-wider uppercase text-sm">Our Work</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2">The Craft</h2>
            <p className="text-white/50 mt-4 max-w-2xl mx-auto">Every loc tells a story. Here's a glimpse of the artistry and care we put into every client's crown.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-amber-400/30 transition-all duration-300">
                <img
                  src={`/gallery/image${num}.jpg`}
                  alt={`Loc styling work ${num}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white font-medium">Loc Artistry</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href="https://instagram.com/kelatichairlounge_"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 backdrop-blur border border-white/20 rounded-full font-semibold hover:bg-white/10 hover:border-amber-400/30 transition-all"
            >
              <Instagram className="w-5 h-5" />
              See More on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <span className="text-amber-400 font-medium tracking-wider uppercase text-sm">What We Offer</span>
              <h2 className="text-4xl md:text-5xl font-black mt-2">Our Services</h2>
            </div>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 text-amber-400 font-semibold hover:gap-3 transition-all"
            >
              View All Services <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            [
              { icon: Award, title: 'Master Trained', desc: 'All locticians trained by a 16-year loc master' },
              { icon: Heart, title: 'Loc Scalp Treatment', desc: 'Healthy scalp care for lasting growth' },
              { icon: Sparkles, title: 'Loc Knowledge', desc: 'Education and guidance for every journey' },
              { icon: Shield, title: 'Growing Hands', desc: 'Techniques that protect and strengthen' },
              { icon: Calendar, title: 'Good Vibes', desc: 'Warm, welcoming, and uplifting energy' },
              { icon: Shield, title: 'Clean & Safe', desc: 'Sanitized tools and safe practices' },
            ].map((item, idx) => (
                <div className="relative">
                  <div className="w-14 h-14 bg-amber-400/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-amber-400/20 transition-colors">
                    <Sparkles className="w-7 h-7 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                  <p className="text-white/50 mb-5 line-clamp-2">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-amber-400">${service.base_price}</span>
                    <span className="text-sm text-white/40 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.floor(service.duration / 60)}h {service.duration % 60 > 0 ? `${service.duration % 60}m` : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:scale-105"
            >
              Book Your Service
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-zinc-950 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-amber-400 font-medium tracking-wider uppercase text-sm">Why Kelatic</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2">The Difference</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Award, title: 'Loc Experts', desc: '15+ years mastering the art of locs' },
              { icon: Heart, title: 'Healthy Hair', desc: 'Premium products that nourish your crown' },
              { icon: Shield, title: 'Clean & Safe', desc: 'Sanitized tools, welcoming environment' },
              { icon: Calendar, title: 'Easy Booking', desc: 'Book online 24/7, instant confirmation' },
            ].map((item, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400/10 to-transparent rounded-2xl flex items-center justify-center mb-6 group-hover:from-amber-400/20 transition-colors">
                  <item.icon className="w-10 h-10 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/20 rounded-full font-semibold text-white/80 hover:text-amber-400 hover:border-amber-400/40 transition-colors"
            >
              View Full Gallery
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="py-16 bg-black">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-r from-amber-400/10 to-yellow-500/10 p-10 text-center">
            <h3 className="text-2xl md:text-3xl font-black mb-3">Refer a Friend, Get $10 Off</h3>
            <p className="text-white/60 mb-6 max-w-2xl mx-auto">
              Bring a friend to Kelatic and you both save $10 on your next visit. Share the love and keep your locs thriving.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              Book & Refer
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-amber-400 font-medium tracking-wider uppercase text-sm">Reviews</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2">Client Love</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:border-amber-400/30 transition-colors">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/70 mb-5 line-clamp-4">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="font-bold text-amber-400">{testimonial.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-500" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAxOGMtMy4zMTQgMC02LTIuNjg2LTYtNnMyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNi0yLjY4NiA2LTYgNnoiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iLjAzIi8+PC9nPjwvc3ZnPg==')] opacity-30" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-black mb-6">Ready to Level Up?</h2>
          <p className="text-xl text-black/70 mb-10 max-w-2xl mx-auto">
            Book your appointment today and experience why Houston trusts Kelatic with their crown.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-3 px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:bg-zinc-900 transition-all hover:scale-105 shadow-2xl"
          >
            <Calendar className="w-6 h-6" />
            Book Your Appointment
          </Link>
        </div>
      </section>

      {/* Loc Academy Teaser */}
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-amber-400 font-medium tracking-wider uppercase text-sm">Loc Academy</span>
          <h2 className="text-4xl md:text-5xl font-black mt-3 mb-4">Train with The Loc Gawd</h2>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Learn starter to advanced loc techniques, business guidance, and hands-on training with real clients.
          </p>
          <Link
            href="/loc-academy"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
          >
            Explore Loc Academy
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <span className="text-amber-400 font-medium tracking-wider uppercase text-sm">Location</span>
              <h2 className="text-4xl md:text-5xl font-black mt-2 mb-10">Visit Us</h2>

              <div className="space-y-6">
                {[
                  { icon: MapPin, label: 'Address', value: '9430 Richmond Ave, Houston, TX 77063', href: 'https://maps.google.com/?q=9430+Richmond+Ave+Houston+TX+77063' },
                  { icon: Phone, label: 'Phone', value: '(713) 485-4000', href: 'tel:+17134854000' },
                  { icon: Mail, label: 'Email', value: 'kelatic@gmail.com', href: 'mailto:kelatic@gmail.com' },
                  { icon: Instagram, label: 'Instagram', value: '@kelatichairlounge_', href: 'https://instagram.com/kelatichairlounge_' },
                ].map((item, idx) => (
                  <a key={idx} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="flex items-center gap-4 group">
                    <div className="w-14 h-14 bg-amber-400/10 rounded-xl flex items-center justify-center group-hover:bg-amber-400/20 transition-colors">
                      <item.icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm text-white/40">{item.label}</div>
                      <div className="font-medium group-hover:text-amber-400 transition-colors">{item.value}</div>
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-10 pt-10 border-t border-white/10">
                <h3 className="font-bold mb-4">Hours</h3>
                <div className="space-y-2 text-white/60">
                  <div className="flex justify-between"><span>Monday - Friday</span><span className="text-white">9AM - 7PM</span></div>
                  <div className="flex justify-between"><span>Saturday</span><span className="text-white">8AM - 6PM</span></div>
                  <div className="flex justify-between"><span>Sunday</span><span className="text-white">10AM - 5PM</span></div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/10 h-96 lg:h-auto">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3464.4891234567!2d-95.5264!3d29.7294!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8640c3c0c0c0c0c0%3A0x0!2s9430%20Richmond%20Ave%2C%20Houston%2C%20TX%2077063!5e0!3m2!1sen!2sus!4v1704000000000"
                className="w-full h-full min-h-96 border-0 grayscale"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="KeLatic Hair Lounge Location"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
