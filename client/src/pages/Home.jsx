import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Zap, 
  Users, 
  TrendingUp,
  Star,
  Play,
  Gift
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const Home = () => {
  const { isConnected } = useWallet();

  const features = [
    {
      icon: Sparkles,
      title: 'Unique Anime NFTs',
      description: 'Collect rare and exclusive anime-themed NFTs with stunning artwork and unique traits.'
    },
    {
      icon: Shield,
      title: 'Secure on Flow',
      description: 'Built on the Flow blockchain for fast, secure, and scalable NFT transactions.'
    },
    {
      icon: Zap,
      title: 'Instant Trading',
      description: 'Trade NFTs instantly with other collectors in our decentralized marketplace.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Join a vibrant community of anime lovers and NFT collectors.'
    }
  ];

  // Fetch live collections to show as featured with images
  const { data: collectionsData } = useQuery({
    queryKey: ['home-featured-collections'],
    queryFn: () => api.get('/nfts/collections'),
    staleTime: 5 * 60 * 1000,
  });

  const featuredCollections = (collectionsData?.data?.collections || []).slice(0, 6);

  const stats = [
    { label: 'Total NFTs', value: '50K+', icon: Sparkles },
    { label: 'Collections', value: '25+', icon: Shield },
    { label: 'Active Users', value: '10K+', icon: Users },
    { label: 'Trading Volume', value: '100K FLOW', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images8.alphacoders.com/761/761504.jpg"
            alt="Aniverse hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-white/80 dark:to-gray-900/70" />
        </div>
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">
                Aniverse
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-white mb-8 max-w-3xl mx-auto">
              The next-generation NFT platform for anime lovers. Collect, trade, and showcase your favorite anime characters on the Flow blockchain.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isConnected ? (
                <Link
                  to="/marketplace"
                  className="inline-flex items-center px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
                >
                  Explore Marketplace
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              ) : (
                <Link
                  to="/wallet/dashboard"
                  className="inline-flex items-center px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              )}
              
              <Link
                to="/gamezone"
                className="inline-flex items-center px-8 py-4 border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-semibold rounded-lg transition-all duration-200 text-lg"
              >
                <Play className="mr-2 w-5 h-5" />
                Play Games
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
                    <Icon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Aniverse?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience the future of anime NFT collecting with cutting-edge technology and a passionate community.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-200"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
                    <Icon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Collections Section (live images) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Collections
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover the most popular anime NFT collections on our platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCollections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Link to={`/marketplace/${collection._id}/view`}>
                  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={collection.image?.startsWith('ipfs://') ? collection.image.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') : collection.image}
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-sm">
                        <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20">
                          {(collection.attributes?.rarity || 'common').toUpperCase()}
                        </span>
                        <span className="font-semibold">
                          {collection.statistics?.floorPrice ? `${collection.statistics.floorPrice} FLOW` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {collection.name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                        {collection.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/marketplace"
              className="inline-flex items-center px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
            >
              View All Collections
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Start Your Anime NFT Journey?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Connect your Flow wallet and start collecting your favorite anime characters today!
            </p>
            
            {!isConnected ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/marketplace"
                  className="inline-flex items-center px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/redeem"
                  className="inline-flex items-center px-8 py-4 border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-semibold rounded-lg transition-all duration-200 text-lg"
                >
                  <Gift className="mr-2 w-5 h-5" />
                  Claim Free NFTs
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="/wallet/dashboard"
                  className="inline-flex items-center px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
                >
                  View My Collection
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center px-8 py-4 border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-semibold rounded-lg transition-all duration-200 text-lg"
                >
                  Browse More NFTs
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
