'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/footer';
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
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-black font-black">K</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">KELATIC</span>
                <span className="text-[9px] tracking-widest text-amber-400">SPECIAL OFFERS</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/book?special=wednesday75"
                className="px-6 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                Book $75 Special
              </Link>
              <Link href="/" className="text-sm text-white/50 hover:text-amber-400 transition-colors">
                ← Back to site
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-yellow-500/5 to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          {/* Limited Time Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 font-medium mb-6 animate-pulse">
            <Timer className="w-5 h-5" />
            <span>Limited Time Offer</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">
              $75
            </span>
            <br />
            WEDNESDAY SPECIAL
          </h1>
          
          <p className="text-2xl text-white/80 mb-4 max-w-3xl mx-auto">
            Shampoo & Retwist for just <span className="text-amber-400 font-bold">$75</span>
          </p>
          
          <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
            Every Wednesday, get professional loc maintenance at an unbeatable price. Limited slots available—our most popular deal!
          </p>

          {/* Countdown Timer */}
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-black/50 backdrop-blur border border-white/10 rounded-2xl mb-8">
            <Clock className="w-6 h-6 text-amber-400" />
            <div>
              <div className="text-sm text-white/50">Next Wednesday Special in:</div>
              <div className="text-2xl font-bold text-amber-400">{timeLeft}</div>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href="/book?special=wednesday75"
            className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-black text-xl hover:shadow-2xl hover:shadow-amber-500/40 transition-all hover:scale-105 mb-12"
          >
            <Calendar className="w-6 h-6" />
            Book Your $75 Special
            <ArrowRight className="w-6 h-6" />
          </Link>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-8 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Instant Confirmation</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>5000+ Happy Clients</span>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-black/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What's Included in Your $75 Special</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:border-amber-400/30 transition-colors">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400/20 to-transparent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Professional Shampoo</h3>
              <p className="text-white/60">
                Deep cleansing with premium products to remove buildup and refresh your scalp
              </p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:border-amber-400/30 transition-colors">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400/20 to-transparent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Expert Retwist</h3>
              <p className="text-white/60">
                Precision retwisting by our master locticians to maintain your loc health and appearance
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 font-medium">
              <Gift className="w-5 h-5" />
              <span>Regular Price: $85 - You Save $10!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Clients Love Our Wednesday Special</h2>
          
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
              <div key={idx} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/70 mb-4 italic">"{testimonial.text}"</p>
                <div className="font-semibold text-amber-400">{testimonial.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-y border-amber-500/20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Don't Miss Out - Book Your Wednesday Special</h2>
          <p className="text-xl text-white/70 mb-8">
            Limited slots available every Wednesday. Book now to secure your spot!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href="/book?special=wednesday75"
              className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-black text-lg hover:shadow-2xl hover:shadow-amber-500/40 transition-all hover:scale-105"
            >
              <Calendar className="w-6 h-6" />
              Book $75 Wednesday Special
              <ArrowRight className="w-6 h-6" />
            </Link>
            
            <a 
              href="tel:+17134854000"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/20 rounded-full font-semibold hover:bg-white/10 transition-colors"
            >
              <span>Or call (713) 485-4000</span>
            </a>
          </div>

          <div className="text-sm text-white/40">
            <p>✨ Available every Wednesday • ⏰ 9AM - 6PM • 📍 9430 Richmond Ave, Houston</p>
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="py-12 bg-black/30">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-lg font-semibold mb-4">Terms & Conditions</h3>
          <div className="text-sm text-white/50 space-y-2">
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