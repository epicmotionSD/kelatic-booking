'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/footer';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';
import {
  Calendar,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Timer,
  Users,
  Heart,
  Gift
} from 'lucide-react';

export default function SpecialOffersPage() {
  const [timeLeft, setTimeLeft] = useState('');

  // Calculate time until next Wednesday
  useEffect(() => {
    function updateTimer() {
      const now = new Date();
      const nextWednesday = new Date();

      // Find next Wednesday
      const daysUntilWednesday = (3 - now.getDay() + 7) % 7;
      if (daysUntilWednesday === 0 && now.getHours() >= 18) {
        // If it's Wednesday after 6PM, get next Wednesday
        nextWednesday.setDate(now.getDate() + 7);
      } else {
        nextWednesday.setDate(now.getDate() + daysUntilWednesday);
      }
      nextWednesday.setHours(9, 0, 0, 0); // 9 AM Wednesday

      const diff = nextWednesday.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    }

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-800">
      {/* Header */}
      <header className="bg-[#faf7f2]/85 backdrop-blur-xl border-b border-[#e7ddcd] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#b08344] rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-playfair font-medium">K</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-stone-800">KELATIC</span>
                <span className="text-[9px] tracking-widest text-[#8a5a2b]">SPECIAL OFFERS</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <PublicAuthLinks />
              <Link
                href="/book?special=wednesday75"
                className="px-6 py-2 bg-[#b08344] text-white rounded-full font-semibold hover:bg-[#9a6f33] shadow-sm hover:shadow-md transition-all hover:scale-[1.03]"
              >
                Book $75 Special
              </Link>
              <Link href="/" className="text-sm text-stone-500 hover:text-[#8a5a2b] transition-colors">
                ← Back to site
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-b from-[#faf7f2] to-[#f3ede3]">
        {/* Background elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#e9d7bd]/40 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 text-center">
          {/* Limited Time Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#e7ddcd] rounded-full text-[#9a4b34] font-medium mb-6 shadow-sm">
            <Timer className="w-5 h-5" />
            <span>Limited Time Offer</span>
          </div>

          <h1 className="font-playfair text-5xl md:text-7xl font-medium mb-6 leading-tight text-stone-900">
            <span className="italic text-[#b08344]">
              $75
            </span>
            <br />
            WEDNESDAY SPECIAL
          </h1>

          <p className="text-2xl text-stone-600 mb-4 max-w-3xl mx-auto">
            Shampoo & Retwist for just <span className="text-[#8a5a2b] font-bold">$75</span>
          </p>

          <p className="text-lg text-stone-500 mb-8 max-w-2xl mx-auto">
            Every Wednesday, get professional loc maintenance at an unbeatable price. Limited slots available—our most popular deal!
          </p>

          {/* Countdown Timer */}
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-white border border-[#e7ddcd] rounded-2xl mb-8 shadow-sm">
            <Clock className="w-6 h-6 text-[#b08344]" />
            <div>
              <div className="text-sm text-stone-500">Next Wednesday Special in:</div>
              <div className="text-2xl font-bold text-[#8a5a2b]">{timeLeft}</div>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href="/book?special=wednesday75"
            className="inline-flex items-center gap-3 px-12 py-5 bg-[#b08344] text-white rounded-full font-semibold text-xl hover:bg-[#9a6f33] shadow-sm hover:shadow-md transition-all hover:scale-[1.03] mb-12"
          >
            <Calendar className="w-6 h-6" />
            Book Your $75 Special
            <ArrowRight className="w-6 h-6" />
          </Link>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-8 text-sm text-stone-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#5b7a52]" />
              <span>Instant Confirmation</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#b08344]" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8a5a2b]" />
              <span>5000+ Happy Clients</span>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-[#f3ede3]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-playfair text-3xl font-medium text-center mb-12 text-stone-900">What's Included in Your $75 Special</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white border border-[#e7ddcd] rounded-2xl p-8 text-center hover:border-[#b08344]/40 hover:shadow-lg hover:shadow-stone-900/5 transition-all shadow-sm">
              <div className="w-16 h-16 bg-[#f4e9d6] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-[#b08344]" />
              </div>
              <h3 className="font-playfair text-xl font-medium mb-3 text-stone-900">Professional Shampoo</h3>
              <p className="text-stone-500">
                Deep cleansing with premium products to remove buildup and refresh your scalp
              </p>
            </div>

            <div className="bg-white border border-[#e7ddcd] rounded-2xl p-8 text-center hover:border-[#b08344]/40 hover:shadow-lg hover:shadow-stone-900/5 transition-all shadow-sm">
              <div className="w-16 h-16 bg-[#f4e9d6] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-[#b08344]" />
              </div>
              <h3 className="font-playfair text-xl font-medium mb-3 text-stone-900">Expert Retwist</h3>
              <p className="text-stone-500">
                Precision retwisting by our master locticians to maintain your loc health and appearance
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#e7ddcd] rounded-full text-[#5b7a52] font-medium shadow-sm">
              <Gift className="w-5 h-5" />
              <span>Regular Price: $85 - You Save $10!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-[#faf7f2]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-playfair text-3xl font-medium text-center mb-12 text-stone-900">Why Clients Love Our Wednesday Special</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Marcus J.",
                text: "Been getting the Wednesday special for 6 months. Best value in Houston and Kel's work is always on point!",
                rating: 5
              },
              {
                name: "Aisha M.",
                text: "The Wednesday special is perfect for my maintenance routine. Professional service at an amazing price.",
                rating: 5
              },
              {
                name: "Terrence W.",
                text: "Book early because these slots fill up fast! Worth every penny and more.",
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-white border border-[#e7ddcd] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#b08344] text-[#b08344]" />
                  ))}
                </div>
                <p className="text-stone-600 mb-4 italic">"{testimonial.text}"</p>
                <div className="font-semibold text-[#8a5a2b]">{testimonial.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-[#f7edda] to-[#f1e2c6] border-y border-[#e3cda8]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-playfair text-4xl font-medium mb-6 text-stone-900">Don't Miss Out - Book Your Wednesday Special</h2>
          <p className="text-xl text-stone-600 mb-8">
            Limited slots available every Wednesday. Book now to secure your spot!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href="/book?special=wednesday75"
              className="inline-flex items-center gap-3 px-10 py-4 bg-[#b08344] text-white rounded-full font-semibold text-lg hover:bg-[#9a6f33] shadow-sm hover:shadow-md transition-all hover:scale-[1.03]"
            >
              <Calendar className="w-6 h-6" />
              Book $75 Wednesday Special
              <ArrowRight className="w-6 h-6" />
            </Link>

            <a
              href="tel:+17134854000"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white border border-[#e0d4c0] rounded-full font-semibold text-stone-700 hover:text-[#8a5a2b] hover:border-[#b08344]/40 transition-colors shadow-sm"
            >
              <span>Or call (713) 485-4000</span>
            </a>
          </div>

          <div className="text-sm text-stone-500">
            <p>✨ Available every Wednesday • ⏰ 9AM - 6PM • 📍 9430 Richmond Ave, Houston</p>
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="py-12 bg-[#f3ede3]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="font-playfair text-lg font-medium mb-4 text-stone-900">Terms & Conditions</h3>
          <div className="text-sm text-stone-500 space-y-2">
            <p>• $75 Wednesday Special valid every Wednesday only</p>
            <p>• Includes shampoo and standard retwist service</p>
            <p>• Limited slots available - advance booking required</p>
            <p>• Cannot be combined with other offers</p>
            <p>• 24-hour cancellation policy applies</p>
          </div>
        </div>
      </section>

      {/* Footer with AI Chatbot */}
      <Footer />
    </div>
  );
}