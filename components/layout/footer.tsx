import Link from 'next/link';
import { Instagram, Phone, Mail } from 'lucide-react';
import { ChatWidget } from '@/components/chat/chat-widget';

export function Footer() {
  return (
    <>
      {/* AI Chat Widget - powered by x3o.ai */}
      <ChatWidget />

      {/* Footer */}
      <footer className="py-16 bg-[#211a16] border-t border-[#3a2f27]">
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
              <p className="text-[#d8cbb6] max-w-sm mb-6">
                Houston&apos;s premier loc specialists. Expert loc installation, maintenance, and styling.
              </p>
              <div className="text-xs text-[#d8cbb6]/60">
                Powered by{' '}
                <a
                  href="https://x3o.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d6a85f]/80 hover:text-[#d6a85f] transition-colors"
                >
                  x3o.ai
                </a>{' '}
                - AI-powered booking and customer experience
              </div>
            </div>

            <div>
              <h4 className="font-playfair font-medium mb-6 text-[#f7efe2]">Quick Links</h4>
              <div className="space-y-3">
                <Link href="/services" className="block text-[#d8cbb6] hover:text-[#d6a85f] transition-colors">Services</Link>
                <Link href="/special-offers" className="block text-[#d6a85f] hover:text-[#e6c188] transition-colors">$75 Wednesday Special</Link>
                <Link href="/gallery" className="block text-[#d8cbb6] hover:text-[#d6a85f] transition-colors">Gallery</Link>
                <Link href="/blog" className="block text-[#d8cbb6] hover:text-[#d6a85f] transition-colors">Blog</Link>
                <Link href="/barber-block" className="block text-[#d8cbb6] hover:text-[#c2785f] transition-colors">Barber Block</Link>
                <Link href="/loc-academy" className="block text-[#d8cbb6] hover:text-[#d6a85f] transition-colors">Loc Academy</Link>
                <Link href="/book" className="block text-[#d8cbb6] hover:text-[#d6a85f] transition-colors">Book Now</Link>
                <Link href="/privacy-policy" className="block text-[#d8cbb6] hover:text-[#d6a85f] transition-colors">Privacy Policy</Link>
              </div>
            </div>

            <div>
              <h4 className="font-playfair font-medium mb-6 text-[#f7efe2]">Connect</h4>
              <div className="space-y-4 mb-6">
                <div className="text-[#d8cbb6] text-sm">
                  <div>9430 Richmond Ave</div>
                  <div>Houston, TX 77063</div>
                </div>
                <div className="text-[#d8cbb6] text-sm">
                  <div>(713) 485-4000</div>
                  <div>info@kelatic.com</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com/kelatichairlounge_"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow us on Instagram"
                  className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-[#f7efe2] hover:bg-[#b08344] hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="tel:+17134854000"
                  aria-label="Call us"
                  className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-[#f7efe2] hover:bg-[#b08344] hover:text-white transition-colors"
                >
                  <Phone className="w-5 h-5" />
                </a>
                <a
                  href="mailto:info@kelatic.com"
                  aria-label="Email us"
                  className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-[#f7efe2] hover:bg-[#b08344] hover:text-white transition-colors"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-[#3a2f27] mt-12 pt-8 text-center text-[#d8cbb6]/60 text-sm">
            <p>© {new Date().getFullYear()} Kelatic Hair Lounge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}