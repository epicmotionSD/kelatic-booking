'use client';

// Force redeploy to clear cache - updated 2025-12-21

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

  // Mock data for display
  const featuredServices = services.length > 0 ? services : [
    { id: '1', name: 'Loc Retwist', category: 'locs', base_price: 150, duration: 120, description: 'Maintain your locs with our expert retwist service' },
    { id: '2', name: 'Knotless Braids', category: 'braids', base_price: 200, duration: 240, description: 'Beautiful, lightweight knotless braids' },
    { id: '3', name: 'Starter Locs', category: 'locs', base_price: 200, duration: 180, description: 'Begin your loc journey with us' },
    { id: '4', name: 'Silk Press', category: 'silk_press', base_price: 120, duration: 90, description: 'Silky smooth straightening without damage' },
    { id: '5', name: 'Loc Detox', category: 'treatments', base_price: 120, duration: 90, description: 'Deep cleanse and refresh your locs' },
    { id: '6', name: 'Natural Styling', category: 'natural', base_price: 85, duration: 60, description: 'Embrace your natural texture' },
  ];

  const featuredStylists = stylists.length > 0 ? stylists : [
    { id: '1', first_name: 'Rockal', last_name: 'Roberts', bio: 'Master loctician with 15+ years of experience specializing in all loc styles and natural hair care.', specialties: ['Locs', 'Natural Hair', 'Braids'], instagram_handle: 'kelatic_hair' },
    { id: '2', first_name: 'Maya', last_name: 'Johnson', bio: 'Creative stylist passionate about braids and protective styles that celebrate Black beauty.', specialties: ['Braids', 'Protective Styles', 'Extensions'], instagram_handle: 'maya_styles' },
    { id: '3', first_name: 'Jasmine', last_name: 'Lee', bio: 'Color specialist and silk press expert delivering flawless results every time.', specialties: ['Silk Press', 'Color', 'Treatments'], instagram_handle: 'jasmine_hair' },
  ];

  const testimonials = [
    { name: 'Aisha M.', text: 'Best loc retwist I\'ve ever had! Rockal really knows her craft. My locs have never looked better.', rating: 5 },
    { name: 'Destiny T.', text: 'The knotless braids are absolutely perfect. Light, beautiful, and lasted 8 weeks!', rating: 5 },
    { name: 'Marcus J.', text: 'Finally found a salon that understands men\'s locs. Professional service every time.', rating: 5 },
    { name: 'Keisha R.', text: 'The loc detox was amazing. My scalp feels so clean and my locs are thriving!', rating: 5 },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold text-gray-900">KeLatic</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-gray-600 hover:text-purple-600 transition-colors">Services</a>
              <a href="#stylists" className="text-gray-600 hover:text-purple-600 transition-colors">Our Team</a>
              <a href="#about" className="text-gray-600 hover:text-purple-600 transition-colors">About</a>
              <a href="#contact" className="text-gray-600 hover:text-purple-600 transition-colors">Contact</a>
              <Link
                href="/book"
                className="px-5 py-2 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors"
              >
                Book Now
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4">
            <div className="flex flex-col gap-4 px-4">
              <a href="#services" onClick={() => setMobileMenuOpen(false)} className="text-gray-600 py-2">Services</a>
              <a href="#stylists" onClick={() => setMobileMenuOpen(false)} className="text-gray-600 py-2">Our Team</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-gray-600 py-2">About</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-gray-600 py-2">Contact</a>
              <Link
                href="/book"
                className="px-5 py-3 bg-purple-600 text-white rounded-full font-medium text-center"
              >
                Book Now
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-br from-purple-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Houston's Premier Loc & Natural Hair Salon
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Your Hair,{' '}
                <span className="text-purple-600">Our Passion</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Experience expert loc care, stunning braids, and natural hair services 
                in a welcoming environment. Where every crown is celebrated.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-full font-semibold text-lg hover:bg-purple-700 transition-all hover:shadow-lg hover:shadow-purple-200"
                >
                  <Calendar className="w-5 h-5" />
                  Book Appointment
                </Link>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-full font-semibold text-lg hover:border-purple-200 hover:text-purple-600 transition-colors"
                >
                  View Services
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 mt-12 pt-8 border-t border-gray-200">
                <div>
                  <div className="text-3xl font-bold text-purple-600">15+</div>
                  <div className="text-sm text-gray-500">Years Experience</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">5000+</div>
                  <div className="text-sm text-gray-500">Happy Clients</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-3xl font-bold text-purple-600">
                    4.9 <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="text-sm text-gray-500">Average Rating</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-[4/5] bg-gradient-to-br from-purple-200 to-purple-400 rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <div className="w-32 h-32 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
                      <Sparkles className="w-16 h-16" />
                    </div>
                    <p className="text-xl font-medium opacity-90">Beautiful Hair Starts Here</p>
                  </div>
                </div>
              </div>
              {/* Floating Cards */}
              <div className="absolute -left-4 top-1/4 bg-white rounded-xl shadow-lg p-4 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Open Today</div>
                    <div className="text-xs text-gray-500">9:00 AM - 6:00 PM</div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 bottom-1/4 bg-white rounded-xl shadow-lg p-4 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Top Rated</div>
                    <div className="text-xs text-gray-500">500+ 5-star reviews</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From starter locs to intricate braids, we offer a full range of services 
              to keep your crown looking its best.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredServices.map((service) => (
              <div
                key={service.id}
                className="group bg-white border border-gray-200 rounded-2xl p-6 hover:border-purple-200 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
                  <Sparkles className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-purple-600 font-semibold">From ${service.base_price}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {Math.floor(service.duration / 60)}h {service.duration % 60 > 0 ? `${service.duration % 60}m` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors"
            >
              View All Services & Book
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-20 bg-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose KeLatic?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're not just a salon – we're a community dedicated to healthy hair and self-expression.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Stylists</h3>
              <p className="text-gray-600">Trained professionals with years of experience in natural hair care</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Healthy Hair First</h3>
              <p className="text-gray-600">We prioritize the health of your hair with quality products</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Clean & Safe</h3>
              <p className="text-gray-600">Sanitized tools and a comfortable, welcoming environment</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Booking</h3>
              <p className="text-gray-600">Book online 24/7 with instant confirmation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stylists Section */}
      <section id="stylists" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our talented stylists are passionate about helping you look and feel your best.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredStylists.map((stylist) => (
              <div key={stylist.id} className="group">
                <div className="aspect-[3/4] bg-gradient-to-br from-purple-200 to-purple-400 rounded-2xl mb-4 overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white/30 rounded-full flex items-center justify-center backdrop-blur text-white text-3xl font-bold">
                      {stylist.first_name.charAt(0)}{stylist.last_name.charAt(0)}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    {stylist.instagram_handle && (
                      <a
                        href={`https://instagram.com/${stylist.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-white hover:text-purple-200 transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                        @{stylist.instagram_handle}
                      </a>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {stylist.first_name} {stylist.last_name}
                </h3>
                {stylist.specialties && (
                  <p className="text-purple-600 text-sm mb-2">{stylist.specialties.join(' • ')}</p>
                )}
                <p className="text-gray-600 text-sm line-clamp-2">{stylist.bio}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/book"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-purple-600 text-purple-600 rounded-full font-medium hover:bg-purple-600 hover:text-white transition-colors"
            >
              Book With Your Favorite Stylist
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-lg text-gray-400">Join thousands of satisfied clients</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 line-clamp-4">"{testimonial.text}"</p>
                <div className="font-medium">{testimonial.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Look?</h2>
          <p className="text-lg text-purple-100 mb-8">
            Book your appointment today and experience the KeLatic difference.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-full font-semibold text-lg hover:bg-purple-50 transition-colors shadow-lg"
          >
            <Calendar className="w-5 h-5" />
            Book Your Appointment
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Visit Us</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Location</div>
                    <div className="text-gray-600">123 Main Street, Houston, TX 77001</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Phone</div>
                    <a href="tel:+17135551234" className="text-gray-600 hover:text-purple-600">(713) 555-1234</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Email</div>
                    <a href="mailto:hello@kelatic.com" className="text-gray-600 hover:text-purple-600">hello@kelatic.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Instagram className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Instagram</div>
                    <a href="https://instagram.com/kelatic_hair" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-purple-600">@kelatic_hair</a>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="mt-8">
                <h3 className="font-semibold text-gray-900 mb-4">Hours</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday - Friday</span>
                    <span className="text-gray-900">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday</span>
                    <span className="text-gray-900">9:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday</span>
                    <span className="text-gray-900">Closed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-gray-100 rounded-2xl h-80 md:h-auto flex items-center justify-center">
              <div className="text-center p-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Map integration available</p>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block"
                >
                  Get Directions →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <span className="text-xl font-bold">KeLatic</span>
              </div>
              <p className="text-gray-400 text-sm">
                Houston's premier destination for loc care, braids, and natural hair services.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <a href="#services" className="block text-gray-400 hover:text-white transition-colors">Services</a>
                <a href="#stylists" className="block text-gray-400 hover:text-white transition-colors">Our Team</a>
                <a href="#about" className="block text-gray-400 hover:text-white transition-colors">About Us</a>
                <Link href="/book" className="block text-gray-400 hover:text-white transition-colors">Book Now</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <div className="space-y-2 text-sm">
                <Link href="/book" className="block text-gray-400 hover:text-white transition-colors">Loc Services</Link>
                <Link href="/book" className="block text-gray-400 hover:text-white transition-colors">Braids</Link>
                <Link href="/book" className="block text-gray-400 hover:text-white transition-colors">Natural Hair</Link>
                <Link href="/book" className="block text-gray-400 hover:text-white transition-colors">Silk Press</Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex items-center gap-4">
                <a
                  href="https://instagram.com/kelatic_hair"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="tel:+17135551234"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </a>
                <a
                  href="mailto:hello@kelatic.com"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} KeLatic Hair Lounge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
