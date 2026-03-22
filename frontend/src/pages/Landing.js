import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, BarChart3, Users, Shield, Zap, PieChart } from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Smart Analytics', desc: 'Visual charts and spending trends to understand your finances.' },
  { icon: Users, title: 'Group Expenses', desc: 'Split bills with friends and family, track who owes whom.' },
  { icon: PieChart, title: 'Category Insights', desc: 'See exactly where your money goes with category breakdowns.' },
  { icon: Shield, title: 'Secure & Private', desc: 'JWT authentication and encrypted passwords keep your data safe.' },
  { icon: Zap, title: 'Real-time Updates', desc: 'Instant updates across all your devices and group members.' },
  { icon: TrendingUp, title: 'Budget Alerts', desc: 'Set budgets and get notified when you\'re close to the limit.' }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold">TrackWise</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link to="/register" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-xl text-sm font-medium transition-all">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-20 md:py-32 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-xs font-medium mb-6">
          <Zap size={12} /> Relational Expense Analytics Platform
        </div>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
          Take control of your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">
            finances
          </span>
        </h1>
        <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
          TrackWise helps you manage personal and shared expenses, analyze spending patterns, and gain insights through beautiful dashboards.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register"
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl font-medium transition-all shadow-lg shadow-primary-500/25">
            Start for free
          </Link>
          <Link to="/login"
            className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-xl font-medium text-gray-300 hover:text-white transition-all">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/8 transition-all">
              <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center mb-4">
                <Icon size={20} className="text-primary-400" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-6 pb-24">
        <div className="max-w-xl mx-auto p-10 bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/20 rounded-3xl">
          <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-gray-400 mb-6 text-sm">Join thousands of users managing their finances smarter.</p>
          <Link to="/register"
            className="inline-block px-8 py-3 bg-primary-500 hover:bg-primary-600 rounded-xl font-medium transition-all">
            Create free account
          </Link>
        </div>
      </section>
    </div>
  );
}
