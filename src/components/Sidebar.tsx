'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, Users, Inbox, FileText, Briefcase, Receipt, Plus, Settings, Bell, Search, X, RotateCcw, Package, ClipboardList, UserCog } from 'lucide-react';
import { useApp } from '@/lib/app-context';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/users', label: 'Users', icon: UserCog },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
];

const createMenuItems = [
  { label: 'New Client', href: '/clients', icon: Users },
  { label: 'New Quote', href: '/quotes', icon: FileText },
  { label: 'New Invoice', href: '/invoices', icon: Receipt },
];

interface SearchResult {
  type: 'client' | 'job' | 'quote' | 'invoice';
  label: string;
  sublabel: string;
  href: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { clients, jobs, quotes, invoices, getClientName, resetData } = useApp();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close create menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setShowCreateMenu(false);
      }
    };
    if (showCreateMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showCreateMenu]);

  // Close search results on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    if (searchResults.length > 0) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [searchResults.length]);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search clients
    for (const c of clients) {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      if (name.includes(q) || c.email.toLowerCase().includes(q) || (c.companyName && c.companyName.toLowerCase().includes(q))) {
        results.push({ type: 'client', label: `${c.firstName} ${c.lastName}`, sublabel: c.email, href: `/clients/${c.id}` });
      }
      if (results.length >= 10) break;
    }

    // Search jobs
    for (const j of jobs) {
      if (results.length >= 10) break;
      const clientName = getClientName(j.clientId).toLowerCase();
      if (j.title.toLowerCase().includes(q) || j.jobNumber.toString().includes(q) || clientName.includes(q)) {
        results.push({ type: 'job', label: `Job #${j.jobNumber}`, sublabel: j.title, href: `/jobs/${j.id}` });
      }
    }

    // Search quotes
    for (const qt of quotes) {
      if (results.length >= 10) break;
      const clientName = getClientName(qt.clientId).toLowerCase();
      if (qt.title.toLowerCase().includes(q) || qt.quoteNumber.toString().includes(q) || clientName.includes(q)) {
        results.push({ type: 'quote', label: `Quote #${qt.quoteNumber}`, sublabel: qt.title, href: `/quotes/${qt.id}` });
      }
    }

    // Search invoices
    for (const inv of invoices) {
      if (results.length >= 10) break;
      const clientName = getClientName(inv.clientId).toLowerCase();
      if (inv.invoiceNumber.toString().includes(q) || clientName.includes(q)) {
        results.push({ type: 'invoice', label: `Invoice #${inv.invoiceNumber}`, sublabel: clientName, href: `/invoices/${inv.id}` });
      }
    }

    setSearchResults(results);
  }, [searchQuery, clients, jobs, quotes, invoices, getClientName]);

  const handleSearchResultClick = (href: string) => {
    setSearchQuery('');
    setSearchResults([]);
    router.push(href);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'client': return <Users size={14} className="text-gray-400" />;
      case 'job': return <Briefcase size={14} className="text-gray-400" />;
      case 'quote': return <FileText size={14} className="text-gray-400" />;
      case 'invoice': return <Receipt size={14} className="text-gray-400" />;
      default: return null;
    }
  };

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#1a1a2e] text-white flex flex-col z-50">
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center font-bold text-sm">SP</div>
            <span className="font-semibold text-sm">Service Provider</span>
          </div>
        </div>
        <div className="px-4 py-3 relative" ref={createMenuRef}>
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2.5 px-4 text-sm font-medium transition-colors"
          >
            <Plus size={16} />Create
          </button>
          {showCreateMenu && (
            <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {createMenuItems.map(item => (
                <button
                  key={item.label}
                  onClick={() => {
                    setShowCreateMenu(false);
                    router.push(item.href);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <item.icon size={15} className="text-gray-400" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <nav className="flex-1 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (<Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-colors ${isActive ? 'bg-white/15 text-white font-medium' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
              <item.icon size={18} />{item.label}
            </Link>);
          })}
        </nav>
        <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1">
          <button
            onClick={() => { if (confirm('Reset all data to initial demo state?')) { resetData(); router.push('/'); } }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors w-full text-left"
          >
            <RotateCcw size={18} />Reset Demo
          </button>
          <button
            onClick={() => alert('Settings coming soon')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors w-full text-left"
          >
            <Settings size={18} />Settings
          </button>
        </div>
      </aside>
      <header className="fixed top-0 left-[220px] right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md" ref={searchRef}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-80 overflow-y-auto z-50">
                {searchResults.map((result, idx) => (
                  <button
                    key={`${result.type}-${idx}`}
                    onClick={() => handleSearchResultClick(result.href)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    {typeIcon(result.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{result.label}</p>
                      <p className="text-xs text-gray-500 truncate">{result.sublabel}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase font-medium">{result.type}</span>
                  </button>
                ))}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-4 px-3 z-50">
                <p className="text-sm text-gray-400 text-center">No results found</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={18} /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-medium">MS</div>
        </div>
      </header>
    </>
  );
}
