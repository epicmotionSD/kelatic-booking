import Link from 'next/link';
import { Instagram, Phone, Mail } from 'lucide-react';
import { ChatWidget } from '@/components/chat/chat-widget';

export function Footer() {
  return (
    <>
      {/* AI Chat Widget - powered by x3o.ai */}
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
              <p className="text-white/50 max-w-sm mb-6">
                Houston&apos;s premier loc specialists. Expert loc installation, maintenance, and styling.
              </p>
              <div className="text-xs text-white/30">
                Powered by{' '}
                <a 
                  href="https://x3o.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-amber-400/60 hover:text-amber-400 transition-colors"
                >
                  x3o.ai
                </a>{' '}
                - AI-powered booking and customer experience
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6">Quick Links</h4>
              <div className="space-y-3">
                <Link href="/services" className="block text-white/50 hover:text-amber-400 transition-colors">Services</Link>
                <Link href="/special-offers" className="block text-amber-400 hover:text-yellow-400 transition-colors">$75 Wednesday Special</Link>
                <Link href="/blog" className="block text-white/50 hover:text-amber-400 transition-colors">Blog</Link>
                <Link href="/barber-block" className="block text-white/50 hover:text-red-400 transition-colors">Barber Block</Link>
                <Link href="/book" className="block text-white/50 hover:text-amber-400 transition-colors">Book Now</Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6">Connect</h4>
              <div className="space-y-4 mb-6">
                <div className="text-white/50 text-sm">
                  <div>9430 Richmond Ave</div>
                  <div>Houston, TX 77063</div>
                </div>
                <div className="text-white/50 text-sm">
                  <div>(713) 485-4000</div>
                  <div>kelatic@gmail.com</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a 
                  href="https://instagram.com/kelatichairlounge_" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label="Follow us on Instagram" 
                  className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-amber-400 hover:text-black transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="tel:+17134854000" 
                  aria-label="Call us" 
                  className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-amber-400 hover:text-black transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </a>
                <a 
                  href="mailto:kelatic@gmail.com" 
                  aria-label="Email us" 
                  className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-amber-400 hover:text-black transition-colors"
                >
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
    </>
  );
}