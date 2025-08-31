import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Github, Mail, Gamepad2, Store, Trophy } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center space-x-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700" />
                <svg viewBox="0 0 48 48" className="absolute inset-0"> 
                  <defs>
                    <linearGradient id="aniG" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <path d="M12 34 L24 8 L36 34 L30 34 L24 20 L18 34 Z" fill="white" opacity="0.95" />
                </svg>
              </div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Aniverse</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-sm">
              Anime-first digital collectibles marketplace, games, and community—built on Flow.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Marketplace</div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link to="/marketplace" className="hover:text-emerald-600 dark:hover:text-emerald-400">Explore</Link></li>
              <li><Link to="/marketplace" className="hover:text-emerald-600 dark:hover:text-emerald-400">Collections</Link></li>
              <li><Link to="/redeem" className="hover:text-emerald-600 dark:hover:text-emerald-400">Redeem</Link></li>
            </ul>
          </div>

          {/* Play */}
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Play</div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link to="/gamezone" className="hover:text-emerald-600 dark:hover:text-emerald-400">Game Zone</Link></li>
              <li><Link to="/betting" className="hover:text-emerald-600 dark:hover:text-emerald-400">Betting</Link></li>
            </ul>
          </div>

          {/* Newsletter / Social */}
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Stay in the loop</div>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 mb-4">
              <input type="email" placeholder="Email address" className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm" />
              <button className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm">Subscribe</button>
            </form>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400" aria-label="Twitter"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400" aria-label="Github"><Github className="w-5 h-5" /></a>
              <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400" aria-label="Contact"><Mail className="w-5 h-5" /></a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1"><Store className="w-4 h-4" /> Marketplace</span>
            <span className="inline-flex items-center gap-1"><Gamepad2 className="w-4 h-4" /> Games</span>
            <span className="inline-flex items-center gap-1"><Trophy className="w-4 h-4" /> Betting</span>
          </div>
          <div>© {new Date().getFullYear()} Aniverse. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


