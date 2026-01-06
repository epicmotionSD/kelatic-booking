'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChatWidget } from '@/components/chat/chat-widget';
import { StylistCarousel } from '@/components/home/stylist-carousel';
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
    { id: '3', name: 'Loc Detox', category: 'locs', base_price: 150, duration: 120, description: 'Deep cleanse and rejuvenate your locs' },
    { id: '4', name: 'Loc Extensions', category: 'locs', base_price: 300, duration: 240, description: 'Add length and fullness to your locs' },
    { id: '5', name: 'Loc Repair', category: 'locs', base_price: 100, duration: 90, description: 'Fix thinning, breakage, or damaged locs' },
    { id: '6', name: 'Loc Styling', category: 'locs', base_price: 75, duration: 60, description: 'Updos, styles, and special occasion looks' },
  ];

  const featuredStylists = stylists.length > 0 ? stylists : [
    { id: '1', first_name: 'Kel', last_name: '', bio: 'Master loctician with 15+ years of experience. Known as "The Loc Gawd" for expert loc installation and maintenance.', specialties: ['Starter Locs', 'Retwists', 'Loc Repair'], instagram_handle: 'kelatic' },
    { id: '2', first_name: 'Destiny', last_name: '', bio: 'Skilled loctician specializing in loc styling and creative loc designs.', specialties: ['Loc Styling', 'Retwists', 'Color'], instagram_handle: '' },
    { id: '3', first_name: 'Shoop', last_name: '', bio: 'Loc specialist with a keen eye for detail and a passion for healthy locs.', specialties: ['Retwists', 'Loc Detox', 'Maintenance'], instagram_handle: '' },
  ];

  const testimonials = [
    { name: 'Aisha M.', text: 'Best loc retwist I\'ve ever had! Kel really knows his craft. My locs have never looked better.', rating: 5 },
    { name: 'Terrence W.', text: 'Started my loc journey here 2 years ago. The team is amazing and my locs are thriving!', rating: 5 },
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
              <Link href="/special-offers" className="text-sm font-medium text-amber-400 hover:text-yellow-400 transition-colors animate-pulse">$75 Tuesday Special</Link>
              <a href="#team" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Team</a>
              <Link href="/blog" className="text-sm font-medium text-white/70 hover:text-amber-400 transition-colors">Blog</Link>
              <Link href="/barber-block" className="text-sm font-medium text-white/70 hover:text-red-400 transition-colors">Barber Block</Link>
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
              <Link href="/services" onClick={() => setMobileMenuOpen(false)} className="text-white/70 py-2 text-lg">Services</Link>
              <Link href="/special-offers" onClick={() => setMobileMenuOpen(false)} className="text-amber-400 py-2 text-lg animate-pulse">$75 Tuesday Special</Link>
              <a href="#team" onClick={() => setMobileMenuOpen(false)} className="text-white/70 py-2 text-lg">Team</a>
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="text-white/70 py-2 text-lg">Blog</Link>
              <Link href="/barber-block" onClick={() => setMobileMenuOpen(false)} className="text-white/70 py-2 text-lg hover:text-red-400">Barber Block</Link>
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
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-black leading-tight text-white">
              Loc Retwist, Starter Locs, Loc Detox, Loc Extensions, and More.
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto">
              Houston’s leading locticians. Expert care for your natural hair journey.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-all"
            >
              <Calendar className="w-5 h-5" />
              Book Appointment
              <ChevronRight className="w-5 h-5" />
            </Link>
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

      {/* Team Section - Featured Near Top */}
      <section id="team" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-amber-400 font-medium tracking-wider uppercase text-sm">Our Stylists</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2">Meet The Team</h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
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
                  <p className="text-amber-400 text-sm mb-2">{stylist.specialties.join(', ')}</p>
                )}
                <p className="text-white/50 text-sm line-clamp-2 mb-4">{stylist.bio}</p>
                <Link
                  href={`/book?stylist=${stylist.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full text-sm font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  Book with {stylist.first_name}
                </Link>
              </div>
            ))}
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
              <div className="mb-6">
                <img
                  src="/logo.png"
                  alt="Kelatic Hair Lounge"
                  className="h-16 w-auto"
                />
              </div>
              <p className="text-white/50 max-w-sm">
                Houston&apos;s premier loc specialists. Expert loc installation, maintenance, and styling.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-6">Quick Links</h4>
              <div className="space-y-3">
                <Link href="/services" className="block text-white/50 hover:text-amber-400 transition-colors">Services</Link>
                <a href="#team" className="block text-white/50 hover:text-amber-400 transition-colors">Team</a>
                <Link href="/blog" className="block text-white/50 hover:text-amber-400 transition-colors">Blog</Link>
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
