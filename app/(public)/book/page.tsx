'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PriceTierSelection } from '@/components/booking/price-tier-selection';
import { StylistSelection } from '@/components/booking/stylist-selection';
import { DateTimeSelection } from '@/components/booking/datetime-selection';
import { ClientInfo } from '@/components/booking/client-info';
import { PaymentStep } from '@/components/booking/payment-step';
import { Confirmation } from '@/components/booking/confirmation';
import type { Service, Profile, TimeSlot, ServiceCategory } from '@/types/database';

export type BookingStep = 'browse' | 'stylist' | 'datetime' | 'info' | 'payment' | 'confirmation';

interface PriceTier {
  id: string;
  name: string;
  priceRange: string;
  minPrice: number;
  maxPrice: number;
}

export interface BookingData {
  service: Service | null;
  addons: Service[];
  priceTier: PriceTier | null;
  availableServices: Service[];
  stylist: Profile | null;
  anyAvailableStylist: boolean;
  date: string | null;
  timeSlot: TimeSlot | null;
  clientInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    notes: string;
    isNewClient: boolean;
  } | null;
  appointmentId: string | null;
  paymentIntentClientSecret: string | null;
}

const initialBookingData: BookingData = {
  service: null,
  addons: [],
  priceTier: null,
  availableServices: [],
  stylist: null,
  anyAvailableStylist: false,
  date: null,
  timeSlot: null,
  clientInfo: null,
  appointmentId: null,
  paymentIntentClientSecret: null,
};

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'browse', label: 'Browse' },
  { key: 'stylist', label: 'Stylist' },
  { key: 'datetime', label: 'Date & Time' },
  { key: 'info', label: 'Your Info' },
  { key: 'payment', label: 'Payment' },
  { key: 'confirmation', label: 'Confirmed' },
];

function BookingContent() {
  const searchParams = useSearchParams();
  const preselectedStylistId = searchParams.get('stylist');
  const preselectedServiceId = searchParams.get('service');
  const specialOffer = searchParams.get('special'); // For special offers like "wednesday75"

  const [currentStep, setCurrentStep] = useState<BookingStep>('browse');
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);
  const [initialized, setInitialized] = useState(false);

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  // Initialize with URL params
  useEffect(() => {
    if (initialized) return;

    const initFromParams = async () => {
      let startStep: BookingStep = 'browse';
      const updates: Partial<BookingData> = {};

      try {
        // Pre-fetch services for service pre-selection
        const servicesRes = await fetch('/api/services');
        const servicesData = await servicesRes.json();
        const allServices = servicesData.services || [];

        // Handle special offers (e.g., ?special=wednesday75)
        if (specialOffer === 'wednesday75') {
          // Find the retwist service or create a special offer service
          const retwistService = allServices.find((s: Service) =>
            s.name.toLowerCase().includes('retwist') ||
            s.name.toLowerCase().includes('maintenance')
          );
          
          if (retwistService) {
            // Create a special version with the offer price
            const specialService = {
              ...retwistService,
              name: 'Tuesday Special - Shampoo & Retwist',
              base_price: 75,
              description: 'Tuesday Special: Professional shampoo and expert retwist for just $75 (Regular $85)',
              id: `special-${retwistService.id}`
            };
            updates.service = specialService;
            updates.availableServices = [specialService];
            startStep = 'stylist'; // Skip to stylist selection
          }
        }
        // Handle direct service pre-selection (e.g., ?service=service-id)
        else if (preselectedServiceId) {
          const service = allServices.find((s: Service) => s.id === preselectedServiceId);
          if (service) {
            updates.service = service;
            updates.availableServices = allServices;
            startStep = 'stylist'; // Skip to stylist selection
          }
        }

        // Pre-fetch stylist if specified (from landing page "Book with X" buttons)
        if (preselectedStylistId) {
          const stylistsRes = await fetch('/api/stylists');
          const stylistsData = await stylistsRes.json();
          const stylist = stylistsData.stylists?.find((s: Profile) => s.id === preselectedStylistId);
          if (stylist) {
            updates.stylist = stylist;
            updates.anyAvailableStylist = false;
            // If we also have a service selected, go to datetime
            startStep = updates.service ? 'datetime' : 'browse';
          }
        }

      } catch (e) {
        console.error('Failed to fetch initialization data:', e);
      }

      if (Object.keys(updates).length > 0) {
        setBookingData((prev) => ({ ...prev, ...updates }));
        setCurrentStep(startStep);
      }
      setInitialized(true);
    };

    initFromParams();
  }, [preselectedStylistId, preselectedServiceId, specialOffer, initialized]);

  function updateBookingData(updates: Partial<BookingData>) {
    setBookingData((prev) => ({ ...prev, ...updates }));
  }

  function goToStep(step: BookingStep) {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key);
    }
  }

  // Skip payment step if no deposit required
  function getNextStep(current: BookingStep): BookingStep {
    if (current === 'info') {
      const requiresDeposit = bookingData.service?.deposit_required;
      return requiresDeposit ? 'payment' : 'confirmation';
    }
    const nextIndex = currentStepIndex + 1;
    return STEPS[nextIndex]?.key || 'confirmation';
  }

  return (
    <div className="min-h-screen bg-amber-50 text-stone-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-amber-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-black font-black">K</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-stone-900">KELATIC</span>
                <span className="text-[9px] tracking-widest text-amber-600">BOOKING</span>
              </div>
            </Link>
            <Link href="/" className="text-sm text-stone-600 hover:text-amber-600 transition-colors">
              ← Back to site
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {currentStep !== 'confirmation' && (
        <div className="bg-white/80 border-b border-amber-200 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {STEPS.slice(0, -1).map((step, index) => {
                const isActive = step.key === currentStep;
                const isCompleted = index < currentStepIndex;
                const isClickable = isCompleted;

                return (
                  <div key={step.key} className="flex items-center">
                    <button
                      onClick={() => isClickable && goToStep(step.key)}
                      disabled={!isClickable}
                      className={`flex items-center gap-2 ${
                        isClickable ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/30'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-stone-200 text-stone-400'
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={`hidden sm:block text-sm font-medium ${
                          isActive ? 'text-amber-600' : isCompleted ? 'text-green-600' : 'text-stone-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </button>
                    {index < STEPS.length - 2 && (
                      <div
                        className={`w-8 sm:w-16 h-0.5 mx-2 rounded-full ${
                          index < currentStepIndex ? 'bg-green-500' : 'bg-stone-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {currentStep === 'browse' && (
          <PriceTierSelection
            onSelectTier={(tier, services) => {
              updateBookingData({
                priceTier: tier,
                availableServices: services,
                // Select the first service from the tier as default
                service: services.length > 0 ? services[0] : null
              });
              goToStep('stylist');
            }}
            onSelectStylist={async (stylist) => {
              try {
                // Fetch all services to set a default when booking by stylist
                const res = await fetch('/api/services');
                const data = await res.json();
                const allServices = data.services || [];
                
                if (stylist.id === 'any') {
                  updateBookingData({
                    stylist: null,
                    anyAvailableStylist: true,
                    // Set default service and available services for "any stylist" bookings
                    service: allServices.length > 0 ? allServices[0] : null,
                    availableServices: allServices
                  });
                } else {
                  updateBookingData({
                    stylist,
                    anyAvailableStylist: false,
                    // Set default service and available services for specific stylist bookings
                    service: allServices.length > 0 ? allServices[0] : null,
                    availableServices: allServices
                  });
                }
                goToStep('datetime');
              } catch (error) {
                console.error('Failed to fetch services:', error);
                // Fallback: still allow progression but without services
                if (stylist.id === 'any') {
                  updateBookingData({ stylist: null, anyAvailableStylist: true });
                } else {
                  updateBookingData({ stylist, anyAvailableStylist: false });
                }
                goToStep('datetime');
              }
            }}
          />
        )}

        {currentStep === 'stylist' && (
          <StylistSelection
            serviceId={bookingData.service?.id || bookingData.availableServices[0]?.id || ''}
            selectedStylist={bookingData.stylist}
            anyAvailable={bookingData.anyAvailableStylist}
            onSelect={(stylist, anyAvailable) => {
              updateBookingData({ stylist, anyAvailableStylist: anyAvailable });
              goToStep('datetime');
            }}
            onBack={goBack}
          />
        )}

        {currentStep === 'datetime' && (
          <DateTimeSelection
            serviceId={bookingData.service?.id || bookingData.availableServices[0]?.id || ''}
            stylistId={bookingData.anyAvailableStylist ? undefined : bookingData.stylist?.id}
            selectedDate={bookingData.date}
            selectedSlot={bookingData.timeSlot}
            onSelect={(date, slot) => {
              updateBookingData({
                date,
                timeSlot: slot,
                // If "any available" was selected, now we know the actual stylist
                stylist: bookingData.anyAvailableStylist ? null : bookingData.stylist,
              });
              goToStep('info');
            }}
            onBack={goBack}
          />
        )}

        {currentStep === 'info' && (
          <ClientInfo
            bookingData={bookingData}
            onSubmit={async (clientInfo, result) => {
              updateBookingData({
                clientInfo,
                appointmentId: result.appointmentId,
                paymentIntentClientSecret: result.paymentIntentClientSecret,
              });
              goToStep(getNextStep('info'));
            }}
            onBack={goBack}
          />
        )}

        {currentStep === 'payment' && (
          <PaymentStep
            bookingData={bookingData}
            onComplete={() => goToStep('confirmation')}
            onBack={goBack}
          />
        )}

        {currentStep === 'confirmation' && (
          <Confirmation bookingData={bookingData} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/30 border-t border-white/5 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-white/40">
          <p>Questions? Call us at <a href="tel:+17134854000" className="text-amber-400 hover:text-amber-300">(713) 485-4000</a></p>
          <p className="mt-1">9430 Richmond Ave, Houston, TX 77063</p>
        </div>
      </footer>
    </div>
  );
}

function BookingLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 animate-pulse">
          <span className="text-black font-black">K</span>
        </div>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400" />
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<BookingLoading />}>
      <BookingContent />
    </Suspense>
  );
}
