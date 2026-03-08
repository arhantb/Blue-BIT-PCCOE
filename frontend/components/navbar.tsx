import { motion } from "framer-motion";
import Link from "next/link";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center">
              <span
                className="text-2xl font-bold text-green-600"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Tram
              </span>
              <span
                className="text-2xl font-bold text-gray-900"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                AI
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/about"
              className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              About Us
            </Link>
            <Link
              href="/forecast"
              className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Forecast
            </Link>
            <Link
              href="/rerouting"
              className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Redistribution
            </Link>
            <Link
              href="/usp"
              className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              USP
            </Link>
            <Link
              href="/contact"
              className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Contact Us
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-gray-700 hover:text-green-600">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
