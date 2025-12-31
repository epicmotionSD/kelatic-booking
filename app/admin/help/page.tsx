'use client';

import { useState } from 'react';
import Link from 'next/link';

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  steps: {
    title: string;
    description: string;
    tip?: string;
  }[];
}

const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'pos',
    title: 'Point of Sale (Checkout)',
    icon: '💳',
    steps: [
      {
        title: '1. Go to POS',
        description: 'Click "POS" in the sidebar. You\'ll see today\'s appointments ready for checkout.',
        tip: 'The "Ready to Pay" tab shows clients who are done with their service',
      },
      {
        title: '2. Find the Client',
        description: 'Look for the client\'s name card. It shows their name, service, stylist, and price.',
      },
      {
        title: '3. Click "Checkout"',
        description: 'Click the gold "Checkout" button on their card.',
      },
      {
        title: '4. Adjust Price (if needed)',
        description: 'You can edit the final price if it\'s different from the quoted price. Add tip amount if the client wants to tip.',
        tip: 'The deposit amount (if paid) will be deducted automatically',
      },
      {
        title: '5. Choose Payment Method',
        description: 'Select how they\'re paying: Card (Stripe Terminal), Cash, or Other.',
      },
      {
        title: '6. Complete Payment',
        description: 'For card: The terminal will prompt the client to tap/insert card. For cash: Enter the amount received.',
        tip: 'If using the Stripe Terminal, make sure it shows "Connected" in the top right',
      },
      {
        title: '7. Done!',
        description: 'The appointment will move to "Completed" and a receipt can be sent to the client.',
      },
    ],
  },
  {
    id: 'walkin',
    title: 'Walk-in Clients',
    icon: '🚶',
    steps: [
      {
        title: '1. Click "Walk-in" Button',
        description: 'In the POS page, click the gold "Walk-in" button in the bottom right corner.',
      },
      {
        title: '2. Enter Client Info',
        description: 'Enter their name and phone number (phone is optional but helpful for reminders).',
      },
      {
        title: '3. Select Service & Stylist',
        description: 'Choose what service they want and which stylist will do it.',
      },
      {
        title: '4. Confirm',
        description: 'Click "Create Walk-in" and it will open the checkout screen automatically.',
      },
    ],
  },
  {
    id: 'appointments',
    title: 'Managing Appointments',
    icon: '📅',
    steps: [
      {
        title: 'View Appointments',
        description: 'Go to "Appointments" in the sidebar. Use the date picker to see different days.',
      },
      {
        title: 'Change Status',
        description: 'Click "Confirm" to confirm a pending appointment, "Start" when they arrive, then checkout from POS when done.',
        tip: 'You can also click the arrow (>) to see full appointment details',
      },
      {
        title: 'Create New Appointment',
        description: 'Click "New Appointment" and fill in the client, service, stylist, and time.',
      },
      {
        title: 'Edit Appointment',
        description: 'Click the arrow (>) on any appointment to view and edit details, add notes, or cancel.',
      },
    ],
  },
  {
    id: 'services',
    title: 'Managing Services',
    icon: '✂️',
    steps: [
      {
        title: 'View Services',
        description: 'Go to "Services" in the sidebar to see all your services.',
      },
      {
        title: 'Add New Service',
        description: 'Click "Add Service" button. Enter name, category, price, and duration.',
      },
      {
        title: 'Edit Service',
        description: 'Click the three dots (⋮) on any service card, then click "Edit" to change details.',
        tip: 'You can also toggle services on/off without deleting them',
      },
      {
        title: 'Reorder Services',
        description: 'Services appear in the order shown. Drag to reorder (coming soon) or edit sort order.',
      },
    ],
  },
  {
    id: 'stylists',
    title: 'Managing Stylists',
    icon: '👩‍🎨',
    steps: [
      {
        title: 'View Stylists',
        description: 'Go to "Stylists" in the sidebar to see your team.',
      },
      {
        title: 'Add New Stylist',
        description: 'Click "Add Stylist". Enter their name, email, phone, and set their role.',
        tip: 'They\'ll get an email to set their password and can login to the Stylist Portal',
      },
      {
        title: 'Edit Stylist',
        description: 'Click on a stylist card to edit their info, bio, specialties, and services they offer.',
      },
      {
        title: 'Set Schedule',
        description: 'Each stylist can have their own working hours set in their profile.',
      },
    ],
  },
  {
    id: 'clients',
    title: 'Managing Clients',
    icon: '👥',
    steps: [
      {
        title: 'View Clients',
        description: 'Go to "Clients" in the sidebar to see all clients.',
      },
      {
        title: 'Search Clients',
        description: 'Use the search bar to find clients by name, email, or phone.',
      },
      {
        title: 'View Client Details',
        description: 'Click on a client to see their appointment history, notes, and hair profile.',
      },
      {
        title: 'Add Notes',
        description: 'Add notes about a client\'s preferences, hair type, or anything important to remember.',
      },
    ],
  },
];

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('pos');

  const currentSection = HELP_SECTIONS.find((s) => s.id === activeSection) || HELP_SECTIONS[0];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Help & Guides</h1>
        <p className="text-white/50 mt-1">
          Quick guides for common tasks
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {HELP_SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
              activeSection === section.id
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
            }`}
          >
            <span>{section.icon}</span>
            <span className="hidden sm:inline">{section.title}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 overflow-hidden">
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="text-2xl">{currentSection.icon}</span>
            {currentSection.title}
          </h2>
        </div>

        {/* Steps */}
        <div className="p-6 space-y-6">
          {currentSection.steps.map((step, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0 text-amber-400 font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-white/70">{step.description}</p>
                {step.tip && (
                  <div className="mt-2 px-3 py-2 bg-amber-400/10 border border-amber-400/20 rounded-lg text-sm text-amber-200">
                    💡 <strong>Tip:</strong> {step.tip}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/admin/pos"
          className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-colors"
        >
          <div className="text-2xl mb-2">💳</div>
          <div className="text-sm font-medium text-white">Go to POS</div>
        </Link>
        <Link
          href="/admin/appointments"
          className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-colors"
        >
          <div className="text-2xl mb-2">📅</div>
          <div className="text-sm font-medium text-white">Appointments</div>
        </Link>
        <Link
          href="/admin/services"
          className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-colors"
        >
          <div className="text-2xl mb-2">✂️</div>
          <div className="text-sm font-medium text-white">Services</div>
        </Link>
        <Link
          href="/admin/clients"
          className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-colors"
        >
          <div className="text-2xl mb-2">👥</div>
          <div className="text-sm font-medium text-white">Clients</div>
        </Link>
      </div>

      {/* Need More Help */}
      <div className="mt-8 bg-gradient-to-r from-amber-400/10 to-yellow-500/10 border border-amber-400/30 rounded-xl p-6 text-center">
        <h3 className="font-bold text-amber-400 mb-2">Still need help?</h3>
        <p className="text-white/70 mb-4">
          Contact Shawn for technical support
        </p>
        <a
          href="tel:+17134854000"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 text-black rounded-xl font-medium hover:bg-amber-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Call
        </a>
      </div>
    </div>
  );
}
