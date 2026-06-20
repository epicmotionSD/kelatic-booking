'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import {
  Leaf,
  Coffee,
  CupSoda,
  GlassWater,
  Citrus,
  Salad,
  Sprout,
  Heart,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Menu,
  X,
} from 'lucide-react';

interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  tags: string[];
  is_featured: boolean;
}

const OFFERINGS = [
  { icon: CupSoda, title: 'Hot & Cold Herbal Teas', desc: 'Handcrafted blends inspired by herbal traditions.' },
  { icon: Citrus, title: 'Herbal Detox Lemonades', desc: 'Bright, cleansing, and naturally sweetened.' },
  { icon: GlassWater, title: 'Sea Moss Drinks & Smoothies', desc: 'Mineral-rich sea moss blended fresh.' },
  { icon: Coffee, title: 'Mushroom Coffee & Matcha', desc: 'Smooth energy without the crash.' },
  { icon: Sprout, title: 'Organic Fruit Smoothies', desc: 'Whole-fruit blends, nothing artificial.' },
  { icon: Salad, title: 'Breakfast Cups & Overnight Oats', desc: 'Nourishing organic morning options.' },
];

export default function VitalityLanding() {
  const [featured, setFeatured] = useState<ShopProduct[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/shop/products');
        const data = await res.json();
        const products: ShopProduct[] = data.products || [];
        const f = products.filter((p) => p.is_featured);
        setFeatured((f.length > 0 ? f : products).slice(0, 4));
      } catch (e) {
        console.error('Failed to load featured products', e);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1f3d2b]">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#f7f4ec]/85 backdrop-blur border-b border-[#1f3d2b]/10">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="w-8 h-8 rounded-full bg-[#3f7d4f] text-white flex items-center justify-center">
                <Leaf className="w-4 h-4" />
              </span>
              Kelatic Vitality House
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm">
              <a href="#offer" className="hover:text-[#3f7d4f]">Menu</a>
              <a href="#philosophy" className="hover:text-[#3f7d4f]">Philosophy</a>
              <a href="#visit" className="hover:text-[#3f7d4f]">Visit</a>
              <Link href="/shop" className="bg-[#3f7d4f] hover:bg-[#356b44] text-white px-5 py-2 rounded-full font-semibold">
                Order Online
              </Link>
            </div>
            <button className="md:hidden p-2" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          {menuOpen && (
            <div className="md:hidden pb-4 flex flex-col gap-3 text-sm">
              <a href="#offer" onClick={() => setMenuOpen(false)}>Menu</a>
              <a href="#philosophy" onClick={() => setMenuOpen(false)}>Philosophy</a>
              <a href="#visit" onClick={() => setMenuOpen(false)}>Visit</a>
              <Link href="/shop" className="bg-[#3f7d4f] text-white px-5 py-2 rounded-full font-semibold text-center">
                Order Online
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="pt-28 pb-20 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#a3c585]/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-[#3f7d4f]/10 blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-5 text-center">
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#3f7d4f] bg-white px-4 py-2 rounded-full border border-[#3f7d4f]/20">
            <Leaf className="w-4 h-4" /> Plant-Based Wellness Café
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mt-6">
            Welcome to Kelatic Vitality House
          </h1>
          <p className="text-lg sm:text-xl text-[#1f3d2b]/70 mt-5">
            Nourish Your Body. Feed Your Spirit. Heal From the Inside Out.
          </p>
          <p className="text-[#1f3d2b]/60 mt-5 max-w-2xl mx-auto">
            True wellness begins from the inside out. We help our community embrace a healthier lifestyle
            through natural, plant-based options inspired by herbal traditions and holistic wellness —
            crafted without dairy and without refined white sugar.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link href="/shop" className="inline-flex items-center gap-2 bg-[#3f7d4f] hover:bg-[#356b44] text-white px-7 py-3.5 rounded-full font-semibold">
              <ShoppingBag className="w-5 h-5" /> Order Online
            </Link>
            <a href="#offer" className="inline-flex items-center gap-2 border border-[#1f3d2b]/20 px-7 py-3.5 rounded-full font-semibold hover:border-[#3f7d4f]">
              View Menu <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-[#1f3d2b]/60">
            <span className="inline-flex items-center gap-1"><Leaf className="w-4 h-4 text-[#3f7d4f]" /> Dairy-Free</span>
            <span className="inline-flex items-center gap-1"><Leaf className="w-4 h-4 text-[#3f7d4f]" /> No Refined White Sugar</span>
            <span className="inline-flex items-center gap-1"><Leaf className="w-4 h-4 text-[#3f7d4f]" /> Organic Ingredients</span>
          </div>
        </div>
      </header>

      {/* What We Offer */}
      <section id="offer" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <span className="text-[#3f7d4f] font-semibold uppercase tracking-wider text-sm">What We Offer</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-2">Made With Intention</h2>
            <p className="text-[#1f3d2b]/60 mt-3 max-w-2xl mx-auto">
              Every drink and every meal is crafted with ingredients chosen to nourish, support, and inspire healthier habits.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {OFFERINGS.map((o) => (
              <div key={o.title} className="bg-[#f7f4ec] rounded-2xl p-6 border border-[#1f3d2b]/5">
                <div className="w-12 h-12 rounded-xl bg-[#eef4ec] text-[#3f7d4f] flex items-center justify-center mb-4">
                  <o.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg">{o.title}</h3>
                <p className="text-[#1f3d2b]/60 text-sm mt-1">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured menu */}
      {featured.length > 0 && (
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-5">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-[#3f7d4f] font-semibold uppercase tracking-wider text-sm">From the Menu</span>
                <h2 className="text-3xl sm:text-4xl font-black mt-2">Customer Favorites</h2>
              </div>
              <Link href="/shop" className="hidden sm:inline-flex items-center gap-1 text-[#3f7d4f] font-semibold">
                See full menu <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
                  <div className="flex-1">
                    <h3 className="font-bold">{p.name}</h3>
                    {p.description && <p className="text-sm text-[#1f3d2b]/60 mt-1 line-clamp-2">{p.description}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-bold">{formatCurrency(p.price_cents)}</span>
                    <Link href="/shop" className="text-sm bg-[#3f7d4f] hover:bg-[#356b44] text-white px-3 py-1.5 rounded-full">
                      Order
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Philosophy */}
      <section id="philosophy" className="py-20 bg-[#3f7d4f] text-white">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <Heart className="w-10 h-10 mx-auto mb-4 text-[#cfe3c4]" />
          <span className="uppercase tracking-widest text-sm text-[#cfe3c4]">Our Philosophy</span>
          <h2 className="text-3xl sm:text-4xl font-black mt-2">Healing Together</h2>
          <p className="text-white/85 mt-5 text-lg">
            We believe that what we put into our bodies matters. While we do not diagnose, treat, or cure
            disease, we are passionate about educating our community on natural wellness and helping people
            take small steps toward feeling their best.
          </p>
          <p className="text-[#cfe3c4] mt-6 font-semibold text-xl">
            Healing Together — one sip, one meal, and one healthy choice at a time.
          </p>
          <Link href="/shop" className="inline-flex items-center gap-2 bg-white text-[#1f3d2b] px-7 py-3.5 rounded-full font-semibold mt-8">
            <ShoppingBag className="w-5 h-5" /> Start Your Order
          </Link>
        </div>
      </section>

      {/* Visit / Footer */}
      <footer id="visit" className="py-16 bg-[#1f3d2b] text-white/80">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <div className="flex items-center gap-2 font-bold text-white text-lg">
                <Leaf className="w-5 h-5 text-[#a3c585]" /> Kelatic Vitality House
              </div>
              <p className="mt-3 max-w-md text-white/60">
                A welcoming space to explore the power of herbs, natural ingredients, and mindful living.
              </p>
              <Link href="/shop" className="inline-flex items-center gap-2 bg-[#3f7d4f] hover:bg-[#356b44] text-white px-6 py-3 rounded-full font-semibold mt-5">
                <ShoppingBag className="w-5 h-5" /> Order Online
              </Link>
            </div>
            <div className="md:text-right space-y-3">
              <a href="mailto:info@kelaticvitalityhouse.com" className="flex md:justify-end items-center gap-2 hover:text-white">
                <Mail className="w-4 h-4" /> info@kelaticvitalityhouse.com
              </a>
              <span className="flex md:justify-end items-center gap-2 text-white/50">
                <MapPin className="w-4 h-4" /> Houston, TX
              </span>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 text-xs text-white/40">
            © {new Date().getFullYear()} Kelatic Vitality House. These statements have not been evaluated by the FDA.
            Our products are not intended to diagnose, treat, cure, or prevent any disease.
          </div>
        </div>
      </footer>
    </div>
  );
}
