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

export default function KelaticLanding() {
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

  // Warm salon palette — refined gold on ivory/espresso, elegant serif headings.
  const btnGold = 'bg-[#b08344] text-white hover:bg-[#9a6f33] shadow-sm hover:shadow-md hover:shadow-[#b08344]/20';

  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-800">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#faf7f2]/85 backdrop-blur-xl border-b border-[#e7ddcd]">
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
              <Link href="/services" className="text-sm font-medium text-stone-600 hover:text-[#8a5a2b] transition-colors">Services</Link>
              <div className="relative group">
                <button
                  type="button"
                  className="text-sm font-medium text-stone-600 hover:text-[#8a5a2b] transition-colors inline-flex items-center gap-1"
                >
                  Book a Stylist
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </button>
                <div className="absolute left-0 mt-3 w-56 rounded-2xl border border-[#e7ddcd] bg-white/95 backdrop-blur shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {stylistMenu.map((stylist) => (
                    <Link
                      key={stylist.id}
                      href={`/book?stylist=${stylist.id}`}
                      className="block px-4 py-2 text-sm text-stone-600 hover:text-[#8a5a2b] hover:bg-[#f3ede3] transition-colors"
                    >
                      {stylist.first_name} {stylist.last_name}
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/special-offers" className="text-sm font-medium text-[#8a5a2b] hover:text-[#b08344] transition-colors">$75 Wednesday Special</Link>
              <Link href="/gallery" className="text-sm font-medium text-stone-600 hover:text-[#8a5a2b] transition-colors">Gallery</Link>
              <Link href="/loc-academy" className="text-sm font-medium text-stone-600 hover:text-[#8a5a2b] transition-colors">Loc Academy</Link>
              <Link href="/blog" className="text-sm font-medium text-stone-600 hover:text-[#8a5a2b] transition-colors">Blog</Link>
              <Link href="/barber-block" className="text-sm font-medium text-stone-600 hover:text-[#9a4b34] transition-colors">Barber Block</Link>
              <a href="#contact" className="text-sm font-medium text-stone-600 hover:text-[#8a5a2b] transition-colors">Contact</a>
              <PublicAuthLinks />
              <Link
                href="/book"
                className={`px-6 py-3 rounded-full font-semibold text-sm transition-all hover:scale-[1.03] ${btnGold}`}
              >
                Book Now
              </Link>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden relative">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#e7ddcd] text-stone-600 hover:text-[#8a5a2b] hover:border-[#b08344]/40 transition-colors"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              {mobileMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-[#e7ddcd] bg-white/97 backdrop-blur shadow-xl overflow-hidden z-50">
                  <div className="py-2">
                    <Link
                      href="/services"
                      className="block px-4 py-2 text-sm text-stone-600 hover:text-[#8a5a2b] hover:bg-[#f3ede3] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Services
                    </Link>
                    <Link
                      href="/special-offers"
                      className="block px-4 py-2 text-sm text-[#8a5a2b] hover:text-[#b08344] hover:bg-[#f3ede3] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      $75 Wednesday Special
                    </Link>
                    <Link
                      href="/gallery"
                      className="block px-4 py-2 text-sm text-stone-600 hover:text-[#8a5a2b] hover:bg-[#f3ede3] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Gallery
                    </Link>
                    <Link
                      href="/loc-academy"
                      className="block px-4 py-2 text-sm text-stone-600 hover:text-[#8a5a2b] hover:bg-[#f3ede3] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Loc Academy
                    </Link>
                    <Link
                      href="/blog"
                      className="block px-4 py-2 text-sm text-stone-600 hover:text-[#8a5a2b] hover:bg-[#f3ede3] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Blog
                    </Link>
                    <Link
                      href="/barber-block"
                      className="block px-4 py-2 text-sm text-stone-600 hover:text-[#9a4b34] hover:bg-[#f3ede3] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Barber Block
                    </Link>
                    <a
                      href="#contact"
                      className="block px-4 py-2 text-sm text-stone-600 hover:text-[#8a5a2b] hover:bg-[#f3ede3] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Contact
                    </a>
                  </div>
                  <div className="border-t border-[#e7ddcd] py-2">
                    <div className="px-4 py-1 text-[10px] uppercase tracking-widest text-stone-400">Book a Stylist</div>
                    {stylistMenu.map((stylist) => (
                      <Link
                        key={stylist.id}
                        href={`/book?stylist=${stylist.id}`}
                        className="block px-4 py-2 text-sm text-stone-600 hover:text-[#8a5a2b] hover:bg-[#f3ede3] transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {stylist.first_name} {stylist.last_name}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-[#e7ddcd] py-2">
                    <div className="px-4 py-1 text-[10px] uppercase tracking-widest text-stone-400">Login</div>
                    <Link
                      href="/login?type=client&redirect=/account"
                      className="block px-4 py-2 text-sm text-stone-600 hover:text-[#8a5a2b] hover:bg-[#f3ede3] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Client Login
                    </Link>
                    <Link
                      href="/login?type=stylist&redirect=/stylist"
                      className="block px-4 py-2 text-sm text-stone-600 hover:text-[#8a5a2b] hover:bg-[#f3ede3] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Stylist Login
                    </Link>
                    <Link
                      href="/login?type=admin&redirect=/admin"
                      className="block px-4 py-2 text-sm text-stone-600 hover:text-[#8a5a2b] hover:bg-[#f3ede3] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Login
                    </Link>
                  </div>
                  <div className="border-t border-[#e7ddcd] p-3">
                    <Link
                      href="/book"
                      className={`block w-full text-center px-4 py-2 rounded-full font-semibold text-sm transition-all ${btnGold}`}
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
      <section className="pt-32 pb-24 bg-gradient-to-b from-[#faf7f2] to-[#f3ede3] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#e9d7bd]/40 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
            {/* Left - Hero Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e7ddcd] text-xs uppercase tracking-widest text-[#8a5a2b]">
                Houston&apos;s Premier Loc Lounge
              </div>
              <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-medium leading-[1.05] tracking-tight mt-6 text-stone-900">
                Your Crown Deserves
                <span className="block italic text-[#b08344]">
                  Expert Loc Care
                </span>
              </h1>
              <p className="text-lg text-stone-600 mt-6 max-w-xl leading-relaxed">
                From starter locs to precision retwists, Kelatic Hair Lounge delivers master-level loc artistry in Houston.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-8">
                <Link
                  href="/book"
                  className={`px-7 py-3.5 rounded-full font-semibold text-sm transition-all hover:scale-[1.03] ${btnGold}`}
                >
                  Book Your Appointment
                </Link>
                <a
                  href="/gallery"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-[#d8cbb6] rounded-full text-sm font-semibold text-stone-700 hover:text-[#8a5a2b] hover:border-[#b08344]/50 hover:bg-white transition-all"
                >
                  <Play className="w-4 h-4" />
                  Watch Our Work
                </a>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-10">
                <div>
                  <div className="font-playfair text-4xl font-medium text-stone-900">15+</div>
                  <div className="text-sm text-stone-500 mt-1">Years</div>
                </div>
                <div className="w-px h-12 bg-[#e0d4c0]" />
                <div>
                  <div className="font-playfair text-4xl font-medium text-stone-900">5K+</div>
                  <div className="text-sm text-stone-500 mt-1">Clients</div>
                </div>
                <div className="w-px h-12 bg-[#e0d4c0]" />
                <div>
                  <div className="flex items-center gap-1 font-playfair text-4xl font-medium text-stone-900">
                    4.9 <Star className="w-6 h-6 fill-[#b08344] text-[#b08344]" />
                  </div>
                  <div className="text-sm text-stone-500 mt-1">Rating</div>
                </div>
              </div>
            </div>

            {/* Right - Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main image placeholder */}
                <div className="aspect-[3/4] rounded-[2rem] bg-gradient-to-br from-[#efe1cc] to-[#e3cda8] border border-[#e7ddcd] overflow-hidden relative shadow-xl shadow-stone-900/5">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full bg-white/40 flex items-center justify-center backdrop-blur-sm border border-white/60">
                      <span className="font-playfair text-6xl font-medium text-[#8a5a2b]">K</span>
                    </div>
                  </div>
                  {/* Soft warm overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#8a5a2b]/15 via-transparent to-transparent" />
                </div>

                {/* Floating elements */}
                <div className="absolute -left-8 top-1/4 bg-white/90 backdrop-blur-xl border border-[#e7ddcd] rounded-2xl p-4 shadow-xl shadow-stone-900/10 animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#e6efe2] rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-[#5b7a52]" />
                    </div>
                    <div>
                      <div className="font-semibold text-stone-800">Open Today</div>
                      <div className="text-sm text-stone-500">9AM - 7PM</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-8 top-1/2 bg-white/90 backdrop-blur-xl border border-[#e7ddcd] rounded-2xl p-4 shadow-xl shadow-stone-900/10 animate-[float_3s_ease-in-out_infinite_0.5s]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#f4e9d6] rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-[#b08344]" />
                    </div>
                    <div>
                      <div className="font-semibold text-stone-800">Top Rated</div>
                      <div className="text-sm text-stone-500">500+ Reviews</div>
                    </div>
                  </div>
                </div>

                {/* Wednesday special */}
                <div className="absolute -right-4 top-8 bg-[#b08344] text-white rounded-full px-5 py-2.5 shadow-lg shadow-[#b08344]/30 animate-[float_3s_ease-in-out_infinite_1s]">
                  <div className="flex items-center gap-2 font-semibold">
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
      <section id="gallery" className="py-24 bg-[#f3ede3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#8a5a2b] font-medium tracking-[0.2em] uppercase text-xs">Our Work</span>
            <h2 className="font-playfair text-4xl md:text-5xl font-medium mt-3 text-stone-900">The Craft</h2>
            <p className="text-stone-500 mt-4 max-w-2xl mx-auto leading-relaxed">Every loc tells a story. Here&apos;s a glimpse of the artistry and care we put into every client&apos;s crown.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="group relative aspect-square rounded-2xl overflow-hidden bg-[#e7ddcd] border border-[#e0d4c0] hover:border-[#b08344]/40 transition-all duration-300 shadow-sm">
                <img
                  src={`/gallery/image${num}.jpg`}
                  alt={`Loc styling work ${num}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
              className="inline-flex items-center gap-3 px-8 py-4 bg-white border border-[#e0d4c0] rounded-full font-semibold text-stone-700 hover:border-[#b08344]/40 hover:text-[#8a5a2b] transition-all shadow-sm"
            >
              <Instagram className="w-5 h-5" />
              See More on Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-[#faf7f2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <span className="text-[#8a5a2b] font-medium tracking-[0.2em] uppercase text-xs">What We Offer</span>
              <h2 className="font-playfair text-4xl md:text-5xl font-medium mt-3 text-stone-900">Our Services</h2>
            </div>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 text-[#8a5a2b] font-semibold hover:gap-3 transition-all"
            >
              View All Services <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredServices.map((service) => (
              <div key={service.id} className="group bg-white border border-[#e7ddcd] rounded-2xl p-7 hover:border-[#b08344]/40 hover:shadow-lg hover:shadow-stone-900/5 transition-all">
                <div className="w-14 h-14 bg-[#f4e9d6] rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#eaddc3] transition-colors">
                  <Sparkles className="w-7 h-7 text-[#b08344]" />
                </div>
                <h3 className="font-playfair text-xl font-medium mb-2 text-stone-900">{service.name}</h3>
                <p className="text-stone-500 mb-5 line-clamp-2 leading-relaxed">{service.description}</p>
                <div className="flex items-center justify-between pt-1 border-t border-[#f0e8da]">
                  <span className="font-playfair text-2xl font-medium text-[#8a5a2b] mt-3">${service.base_price}</span>
                  <span className="text-sm text-stone-400 flex items-center gap-1 mt-3">
                    <Clock className="w-4 h-4" />
                    {Math.floor(service.duration / 60)}h {service.duration % 60 > 0 ? `${service.duration % 60}m` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/book"
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold transition-all hover:scale-[1.03] ${btnGold}`}
            >
              Book Your Service
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-[#f3ede3] border-y border-[#e7ddcd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#8a5a2b] font-medium tracking-[0.2em] uppercase text-xs">Why Kelatic</span>
            <h2 className="font-playfair text-4xl md:text-5xl font-medium mt-3 text-stone-900">The Difference</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Award, title: 'Loc Experts', desc: '15+ years mastering the art of locs' },
              { icon: Heart, title: 'Healthy Hair', desc: 'Premium products that nourish your crown' },
              { icon: Shield, title: 'Clean & Safe', desc: 'Sanitized tools, welcoming environment' },
              { icon: Calendar, title: 'Easy Booking', desc: 'Book online 24/7, instant confirmation' },
            ].map((item, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-20 h-20 mx-auto bg-white border border-[#e7ddcd] rounded-2xl flex items-center justify-center mb-6 group-hover:border-[#b08344]/40 group-hover:shadow-md group-hover:shadow-stone-900/5 transition-all">
                  <item.icon className="w-9 h-9 text-[#b08344]" />
                </div>
                <h3 className="font-playfair text-xl font-medium mb-2 text-stone-900">{item.title}</h3>
                <p className="text-stone-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-[#e0d4c0] rounded-full font-semibold text-stone-700 hover:text-[#8a5a2b] hover:border-[#b08344]/40 transition-colors shadow-sm"
            >
              View Full Gallery
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="py-16 bg-[#faf7f2]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-[#e3cda8] bg-gradient-to-br from-[#f7edda] to-[#f1e2c6] p-10 text-center">
            <h3 className="font-playfair text-3xl md:text-4xl font-medium mb-3 text-stone-900">Refer a Friend, Get $10 Off</h3>
            <p className="text-stone-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              Bring a friend to Kelatic and you both save $10 on your next visit. Share the love and keep your locs thriving.
            </p>
            <Link
              href="/book"
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold transition-all hover:scale-[1.03] ${btnGold}`}
            >
              Book &amp; Refer
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-[#faf7f2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[#8a5a2b] font-medium tracking-[0.2em] uppercase text-xs">Reviews</span>
            <h2 className="font-playfair text-4xl md:text-5xl font-medium mt-3 text-stone-900">Client Love</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white border border-[#e7ddcd] rounded-2xl p-7 hover:border-[#b08344]/40 hover:shadow-lg hover:shadow-stone-900/5 transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-[#b08344] text-[#b08344]" />
                  ))}
                </div>
                <p className="text-stone-600 mb-5 line-clamp-4 leading-relaxed italic">&ldquo;{testimonial.text}&rdquo;</p>
                <div className="font-semibold text-[#8a5a2b]">{testimonial.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#c79a5b] to-[#b08344]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAxOGMtMy4zMTQgMC02LTIuNjg2LTYtNnMyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNi0yLjY4NiA2LTYgNnoiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iLjAzIi8+PC9nPjwvc3ZnPg==')] opacity-30" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-playfair text-4xl md:text-6xl font-medium text-white mb-6">Ready for Your Best Locs Yet?</h2>
          <p className="text-xl text-white/85 mb-10 max-w-2xl mx-auto leading-relaxed">
            Book your appointment today and experience why Houston trusts Kelatic with their crown.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#2a211c] text-white rounded-full font-semibold text-lg hover:bg-[#1c1612] transition-all hover:scale-[1.03] shadow-xl"
          >
            <Calendar className="w-6 h-6" />
            Book Your Appointment
          </Link>
        </div>
      </section>

      {/* Loc Academy Teaser */}
      <section className="py-24 bg-[#211a16] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#b08344]/10 via-transparent to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-[#d6a85f] font-medium tracking-[0.2em] uppercase text-xs">Loc Academy</span>
          <h2 className="font-playfair text-4xl md:text-5xl font-medium mt-3 mb-4 text-[#f7efe2]">Train with The Loc Gawd</h2>
          <p className="text-xl text-[#d8cbb6] mb-8 max-w-2xl mx-auto leading-relaxed">
            Learn starter to advanced loc techniques, business guidance, and hands-on training with real clients.
          </p>
          <Link
            href="/loc-academy"
            className={`inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold transition-all hover:scale-[1.03] ${btnGold}`}
          >
            Explore Loc Academy
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-[#f3ede3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <span className="text-[#8a5a2b] font-medium tracking-[0.2em] uppercase text-xs">Location</span>
              <h2 className="font-playfair text-4xl md:text-5xl font-medium mt-3 mb-10 text-stone-900">Visit Us</h2>

              <div className="space-y-6">
                {[
                  { icon: MapPin, label: 'Address', value: '9430 Richmond Ave, Houston, TX 77063', href: 'https://maps.google.com/?q=9430+Richmond+Ave+Houston+TX+77063' },
                  { icon: Phone, label: 'Phone', value: '(713) 485-4000', href: 'tel:+17134854000' },
                  { icon: Mail, label: 'Email', value: 'info@kelatic.com', href: 'mailto:info@kelatic.com' },
                  { icon: Instagram, label: 'Instagram', value: '@kelatichairlounge_', href: 'https://instagram.com/kelatichairlounge_' },
                ].map((item, idx) => (
                  <a key={idx} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="flex items-center gap-4 group">
                    <div className="w-14 h-14 bg-white border border-[#e7ddcd] rounded-xl flex items-center justify-center group-hover:border-[#b08344]/40 transition-colors">
                      <item.icon className="w-6 h-6 text-[#b08344]" />
                    </div>
                    <div>
                      <div className="text-sm text-stone-400">{item.label}</div>
                      <div className="font-medium text-stone-700 group-hover:text-[#8a5a2b] transition-colors">{item.value}</div>
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-10 pt-10 border-t border-[#e0d4c0]">
                <h3 className="font-playfair text-lg font-medium mb-4 text-stone-900">Hours</h3>
                <div className="space-y-2 text-stone-500">
                  <div className="flex justify-between"><span>Monday - Friday</span><span className="text-stone-800">9AM - 7PM</span></div>
                  <div className="flex justify-between"><span>Saturday</span><span className="text-stone-800">8AM - 6PM</span></div>
                  <div className="flex justify-between"><span>Sunday</span><span className="text-stone-800">10AM - 5PM</span></div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#e0d4c0] h-96 lg:h-auto shadow-sm">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3464.4891234567!2d-95.5264!3d29.7294!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8640c3c0c0c0c0c0%3A0x0!2s9430%20Richmond%20Ave%2C%20Houston%2C%20TX%2077063!5e0!3m2!1sen!2sus!4v1704000000000"
                className="w-full h-full min-h-96 border-0"
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
