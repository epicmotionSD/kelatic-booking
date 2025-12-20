'use client';

import { useState } from 'react';
import { ServiceSelection } from '@/components/booking/service-selection';
import { StylistSelection } from '@/components/booking/stylist-selection';
import { DateTimeSelection } from '@/components/booking/datetime-selection';
import { ClientInfo } from '@/components/booking/client-info';
import { PaymentStep } from '@/components/booking/payment-step';
import { Confirmation } from '@/components/booking/confirmation';
import type { Service, Profile, TimeSlot } from '@/types/database';

export type BookingStep = 'service' | 'stylist' | 'datetime' | 'info' | 'payment' | 'confirmation';

export interface BookingData {
  service: Service | null;
  addons: Service[];
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
  stylist: null,
  anyAvailableStylist: false,
  date: null,
  timeSlot: null,
  clientInfo: null,
  appointmentId: null,
  paymentIntentClientSecret: null,
};

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'service', label: 'Service' },
  { key: 'stylist', label: 'Stylist' },
  { key: 'datetime', label: 'Date & Time' },
  { key: 'info', label: 'Your Info' },
  { key: 'payment', label: 'Payment' },
  { key: 'confirmation', label: 'Confirmed' },
];

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [bookingData, setBookingData] = useState<BookingData>(initialBookingData);

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Book an Appointment</h1>
          <p className="text-gray-500 mt-1">KeLatic Hair Lounge</p>
        </div>
      </header>

      {/* Progress Bar */}
      {currentStep !== 'confirmation' && (
        <div className="bg-white border-b border-gray-200">
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
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-purple-600 text-white'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
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
                          isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </button>
                    {index < STEPS.length - 2 && (
                      <div
                        className={`w-8 sm:w-16 h-0.5 mx-2 ${
                          index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
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
        {currentStep === 'service' && (
          <ServiceSelection
            selectedService={bookingData.service}
            selectedAddons={bookingData.addons}
            onSelect={(service, addons) => {
              updateBookingData({ service, addons });
              goToStep('stylist');
            }}
          />
        )}

        {currentStep === 'stylist' && (
          <StylistSelection
            serviceId={bookingData.service?.id || ''}
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
            serviceId={bookingData.service?.id || ''}
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
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Questions? Call us at (555) 123-4567</p>
          <p className="mt-1">123 Main Street, Your City, ST 12345</p>
        </div>
      </footer>
    </div>
  );
}
