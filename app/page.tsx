'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChatWidget } from '@/components/chat/chat-widget';
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
        setStylists(data.stylists?.slice(0, 3) || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const featuredServices = services.length > 0 ? services : [
    { id: '1', name: 'Loc Retwist', category: 'locs', base_price: 85, duration: 90, description: 'Maintain your locs with our expert retwist service' },
    { id: '2', name: 'Knotless Braids', category: 'braids', base_price: 220, duration: 300, description: 'Beautiful, lightweight knotless braids' },
    { id: '3', name: 'Starter Locs', category: 'locs', base_price: 200, duration: 180, description: 'Begin your loc journey with us' },
    { id: '4', name: 'Silk Press', category: 'silk_press', base_price: 95, duration: 120, description: 'Silky smooth straightening without damage' },
    { id: '5', name: 'Box Braids', category: 'braids', base_price: 180, duration: 240, description: 'Classic box braids, includes hair' },
    { id: '6', name: 'Wash & Style', category: 'natural', base_price: 65, duration: 75, description: 'Shampoo, condition, and style for natural hair' },
  ];

  const featuredStylists = stylists.length > 0 ? stylists : [
    { id: '1', first_name: 'Kel', last_name: '', bio: 'Master loctician with 15+ years of experience. Known as "The Loc Gawd" for expert loc work and natural hair care.', specialties: ['Locs', 'Natural Hair', 'Braids'], instagram_handle: 'kelatic' },
    { id: '2', first_name: 'Destiny', last_name: '', bio: 'Creative stylist passionate about braids and protective styles that celebrate natural beauty.', specialties: ['Braids', 'Protective Styles', 'Extensions'], instagram_handle: '' },
    { id: '3', first_name: 'Shoop', last_name: '', bio: 'Loc specialist with a keen eye for detail and a passion for healthy hair.', specialties: ['Locs', 'Retwists', 'Styling'], instagram_handle: '' },
  ];

  const testimonials = [
    { name: 'Aisha M.', text: 'Best loc retwist I\'ve ever had! Kel really knows his craft. My locs have never looked better.', rating: 5 },
    { name: 'Destiny T.', text: 'The knotless braids are absolutely perfect. Light, beautiful, and lasted 8 weeks!', rating: 5 },
    { name: 'Marcus J.', text: 'Finally found a salon that understands men\'s locs. Professional service every time.', rating: 5 },
    { name: 'Keisha R.', text: 'The loc detox was amazing. My scalp feels so clean and my locs are thriving!', rating: 5 },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-black font-black text-xl">K</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight">KELATIC</span>
                <span className="text-[10px] tracking-[0.3em] text-amber-400 font-medium">THE LOC GAWD</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-10">
              <a href="#services" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Services</a>
              <a href="#team" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Team</a>
              <a href="#academy" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Academy</a>
              <a href="#contact" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Contact</a>
              <Link
                href="/book"
                className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold text-sm hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:scale-105"
              >
                Book Now
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 py-6">
            <div className="flex flex-col gap-4 px-6">
              <a href="#services" onClick={() => setMobileMenuOpen(false)} className="text-white/70 py-2 text-lg">Services</a>
              <a href="#team" onClick={() => setMobileMenuOpen(false)} className="text-white/70 py-2 text-lg">Team</a>
              <a href="#academy" onClick={() => setMobileMenuOpen(false)} className="text-white/70 py-2 text-lg">Academy</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-white/70 py-2 text-lg">Contact</a>
              <Link
                href="/book"
                className="mt-4 px-6 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold text-center"
              >
                Book Now
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen pt-20 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur border border-white/10 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-white/80">Now Booking in Houston</span>
              </div>

              {/* Heading */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tight">
                  LOC IN
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">
                    WITH THE
                  </span>
                  <br />
                  LOC GAWD
                </h1>
                <p className="text-xl text-white/60 max-w-md leading-relaxed">
                  Houston&apos;s premier destination for locs, braids, and natural hair. Where every crown gets the royal treatment.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/book"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-amber-500/30 transition-all hover:scale-105"
                >
                  <Calendar className="w-5 h-5" />
                  Book Appointment
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#video"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/5 backdrop-blur border border-white/20 rounded-full font-semibold text-lg hover:bg-white/10 transition-all"
                >
                  <Play className="w-5 h-5" />
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
                      <div className="text-sm text-white/50">9AM - 6PM</div>
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

      {/* Video Section */}
      <section id="video" className="py-24 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">See The Work</h2>
            <p className="text-white/50 text-lg">Watch the transformation</p>
          </div>
          <div className="aspect-[9/16] max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/10 border border-white/10">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/b9kadh1jTD4"
              title="KeLatic Hair Lounge"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-black">
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredServices.map((service) => (
              <div
                key={service.id}
                className="group relative bg-zinc-900/50 backdrop-blur border border-white/5 rounded-2xl p-6 hover:border-amber-400/50 hover:bg-zinc-900 transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
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
              { icon: Award, title: 'Expert Stylists', desc: '15+ years mastering locs and natural hair' },
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
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-amber-400 font-medium tracking-wider uppercase text-sm">The Squad</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2">Meet The Team</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredStylists.map((stylist) => (
              <div key={stylist.id} className="group">
                <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 overflow-hidden relative mb-5 group-hover:border-amber-400/30 transition-colors">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400/20 to-transparent flex items-center justify-center backdrop-blur-sm border border-white/10">
                      <span className="text-4xl font-black text-white/80">
                        {stylist.first_name.charAt(0)}{stylist.last_name ? stylist.last_name.charAt(0) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    {stylist.instagram_handle && (
                      <a
                        href={`https://instagram.com/${stylist.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-white hover:text-amber-400 transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                        @{stylist.instagram_handle}
                      </a>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">
                  {stylist.first_name} {stylist.last_name}
                </h3>
                {stylist.specialties && (
                  <p className="text-amber-400 text-sm mb-2">{stylist.specialties.join(' • ')}</p>
                )}
                <p className="text-white/50 text-sm line-clamp-2">{stylist.bio}</p>
              </div>
            ))}
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

      {/* Academy Section */}
      <section id="academy" className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/10 border border-amber-400/30 rounded-full text-amber-400 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Coming January 5th, 2025
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Loc Academy
              </h2>
              <p className="text-xl text-white/60 mb-8 leading-relaxed">
                Learn from The Loc Gawd. Master the art of locs from starter to advanced techniques.
              </p>
              <ul className="space-y-4 mb-10">
                {['Hands-on training with real clients', 'Certificate upon completion', 'Business & marketing guidance', 'Small class sizes'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-white/70">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:kelatic@gmail.com?subject=Loc Academy Interest"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  <Mail className="w-5 h-5" />
                  Get Notified
                </a>
                <a
                  href="https://www.instagram.com/kelatic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/20 rounded-full font-semibold hover:bg-white/10 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                  Follow Updates
                </a>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-28 h-28 mx-auto bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-amber-500/30">
                    <Award className="w-14 h-14 text-black" />
                  </div>
                  <h3 className="text-2xl font-black mb-2">Get Certified</h3>
                  <p className="text-white/50">Start your loc career</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full px-5 py-2 font-bold shadow-xl animate-float">
                Limited Spots!
              </div>
            </div>
          </div>
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
                  { icon: Instagram, label: 'Instagram', value: '@kelatic', href: 'https://instagram.com/kelatic' },
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
                  <div className="flex justify-between"><span>Monday - Friday</span><span className="text-white">9AM - 6PM</span></div>
                  <div className="flex justify-between"><span>Saturday</span><span className="text-white">9AM - 5PM</span></div>
                  <div className="flex justify-between"><span>Sunday</span><span className="text-white/40">Closed</span></div>
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

      {/* AI Chat Widget */}
      <ChatWidget />

      {/* Footer */}
      <footer className="py-16 bg-black border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center">
                  <span className="text-black font-black text-xl">K</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black">KELATIC</span>
                  <span className="text-[10px] tracking-[0.3em] text-amber-400">THE LOC GAWD</span>
                </div>
              </div>
              <p className="text-white/50 max-w-sm">
                Houston&apos;s premier destination for locs, braids, and natural hair. Where every crown gets the royal treatment.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-6">Quick Links</h4>
              <div className="space-y-3">
                <a href="#services" className="block text-white/50 hover:text-amber-400 transition-colors">Services</a>
                <a href="#team" className="block text-white/50 hover:text-amber-400 transition-colors">Team</a>
                <a href="#academy" className="block text-white/50 hover:text-amber-400 transition-colors">Academy</a>
                <Link href="/book" className="block text-white/50 hover:text-amber-400 transition-colors">Book Now</Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6">Connect</h4>
              <div className="flex items-center gap-3">
                <a href="https://instagram.com/kelatic" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-amber-400 hover:text-black transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="tel:+17134854000" aria-label="Call us" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-amber-400 hover:text-black transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
                <a href="mailto:kelatic@gmail.com" aria-label="Email us" className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-amber-400 hover:text-black transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 mt-12 pt-8 text-center text-white/30 text-sm">
            <p>© {new Date().getFullYear()} Kelatic Hair Lounge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
