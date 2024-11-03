import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Phone, Shield, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Global Coverage',
    description: 'Virtual numbers available from USA, UK, Japan, Australia, Singapore, and more.'
  },
  {
    icon: <Phone className="h-6 w-6" />,
    title: 'VOIP Calling',
    description: 'Crystal clear voice quality with our advanced VOIP technology.'
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Secure Communications',
    description: 'End-to-end encrypted calls for your privacy and security.'
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: 'Flexible Duration',
    description: 'Choose your subscription period: 1, 3, 6, or 12 months.'
  }
];

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Virtual Phone Numbers for Global Communication
            </h1>
            <p className="text-xl mb-8 text-indigo-100">
              Get instant access to international phone numbers and start receiving calls within minutes.
            </p>
            {!user && (
              <Link
                to="/register"
                className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Get Started Now
              </Link>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Globo?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="text-indigo-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of satisfied customers using Globo virtual numbers.
            </p>
            <Link
              to="/register"
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Create Your Account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;