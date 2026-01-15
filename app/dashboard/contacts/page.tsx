// =============================================================================
// CONTACTS PAGE
// /app/dashboard/contacts/page.tsx
// Contact management and lead database
// =============================================================================

'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Filter,
  Download,
  Upload,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  UserPlus,
  Tag,
  Clock,
  MessageSquare,
  ChevronDown,
  X,
} from 'lucide-react'

interface Contact {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  segment: 'ghost' | 'near-miss' | 'vip'
  lastContact: string
  totalBookings: number
  totalSpent: number
  tags: string[]
  source: string
  createdAt: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Mock data - will connect to API
    const mockContacts: Contact[] = [
      {
        id: '1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '(305) 555-0123',
        email: 'sarah.j@email.com',
        segment: 'vip',
        lastContact: '2025-01-10',
        totalBookings: 12,
        totalSpent: 1840,
        tags: ['regular', 'color-specialist'],
        source: 'Google LSA',
        createdAt: '2024-03-15',
      },
      {
        id: '2',
        firstName: 'Maria',
        lastName: 'Garcia',
        phone: '(305) 555-0456',
        email: 'maria.g@email.com',
        segment: 'near-miss',
        lastContact: '2024-11-20',
        totalBookings: 3,
        totalSpent: 450,
        tags: ['braids'],
        source: 'Instagram',
        createdAt: '2024-08-10',
      },
      {
        id: '3',
        firstName: 'Jennifer',
        lastName: 'Williams',
        phone: '(305) 555-0789',
        email: 'jen.w@email.com',
        segment: 'ghost',
        lastContact: '2024-06-05',
        totalBookings: 1,
        totalSpent: 120,
        tags: [],
        source: 'Walk-in',
        createdAt: '2024-06-05',
      },
      {
        id: '4',
        firstName: 'Ashley',
        lastName: 'Brown',
        phone: '(305) 555-0321',
        email: 'ashley.b@email.com',
        segment: 'vip',
        lastContact: '2025-01-08',
        totalBookings: 8,
        totalSpent: 1200,
        tags: ['regular', 'extensions'],
        source: 'Referral',
        createdAt: '2024-01-20',
      },
      {
        id: '5',
        firstName: 'Michelle',
        lastName: 'Davis',
        phone: '(305) 555-0654',
        email: 'michelle.d@email.com',
        segment: 'near-miss',
        lastContact: '2024-10-15',
        totalBookings: 2,
        totalSpent: 280,
        tags: ['wedding'],
        source: 'Google Ads',
        createdAt: '2024-07-22',
      },
    ]
    setContacts(mockContacts)
    setLoading(false)
  }, [])

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      searchQuery === '' ||
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSegment = segmentFilter === 'all' || contact.segment === segmentFilter

    return matchesSearch && matchesSegment
  })


  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const segmentColors: Record<string, { bg: string; text: string; label: string }> = {
    ghost: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', label: 'Ghost' },
    'near-miss': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', label: 'Near-Miss' },
    vip: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'VIP' },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-400">Loading contacts...</div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Contacts</h1>
          <p className="text-zinc-400">Manage your lead database and contact lists</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium transition">
            <UserPlus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <p className="text-zinc-500 text-sm">Total Contacts</p>
          <p className="text-2xl font-bold text-white">{contacts.length}</p>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <p className="text-zinc-500 text-sm">VIP Clients</p>
          <p className="text-2xl font-bold text-emerald-400">
            {contacts.filter((c) => c.segment === 'vip').length}
          </p>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <p className="text-zinc-500 text-sm">Near-Miss</p>
          <p className="text-2xl font-bold text-cyan-400">
            {contacts.filter((c) => c.segment === 'near-miss').length}
          </p>
        </div>
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <p className="text-zinc-500 text-sm">Ghost Leads</p>
          <p className="text-2xl font-bold text-zinc-400">
            {contacts.filter((c) => c.segment === 'ghost').length}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white"
          >
            <option value="all">All Segments</option>
            <option value="vip">VIP</option>
            <option value="near-miss">Near-Miss</option>
            <option value="ghost">Ghost</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:bg-zinc-800 transition"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <span className="text-emerald-400 text-sm font-medium">
            {selectedContacts.length} selected
          </span>
          <button className="text-sm text-zinc-300 hover:text-white">Add to Campaign</button>
          <button className="text-sm text-zinc-300 hover:text-white">Add Tags</button>
          <button className="text-sm text-zinc-300 hover:text-white">Export</button>
          <button
            onClick={() => setSelectedContacts([])}
            className="ml-auto text-sm text-zinc-500 hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {/* Contacts Table */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Contact</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Segment</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Last Contact</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Bookings</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Total Spent</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Source</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-zinc-800/50 transition">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-medium">
                        {contact.firstName[0]}{contact.lastName[0]}
                      </div>
                      <div>
                        <p className="text-white font-medium">{contact.firstName} {contact.lastName}</p>
                        <div className="flex items-center gap-3 text-sm text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {contact.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {contact.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${segmentColors[contact.segment].bg} ${segmentColors[contact.segment].text}`}>
                      {segmentColors[contact.segment].label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-zinc-400 text-sm">
                    {new Date(contact.lastContact).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-white">{contact.totalBookings}</td>
                  <td className="px-4 py-4 text-emerald-400 font-medium">${contact.totalSpent}</td>
                  <td className="px-4 py-4 text-zinc-400 text-sm">{contact.source}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
          <p className="text-sm text-zinc-500">
            Showing {filteredContacts.length} of {contacts.length} contacts
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition">
              Previous
            </button>
            <button className="px-3 py-1.5 text-sm bg-emerald-500/10 text-emerald-400 rounded">1</button>
            <button className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
