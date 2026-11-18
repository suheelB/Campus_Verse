import { Link } from 'react-router-dom';
import { GeometricShapes } from './GeometricShapes';

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[calc(100vh-80px)] py-12 lg:py-0">
          {/* Left side — Copy */}
          <div className="max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
              Planning your{' '}
              <span className="text-primary-600">campus life</span>{' '}
              has never been so easy
            </h1>
            <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-md">
              It doesn't matter if you need a club meeting, a hackathon, or
              a cultural fest. CampusVerse has everything your campus needs,
              no matter how big it is.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-accent-500 text-white text-base font-semibold px-8 py-3.5 border-2 border-gray-900 hover:bg-accent-600 hover:shadow-xl hover:shadow-accent-500/20 transition-all duration-300"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border-2 border-gray-300 text-gray-700 text-base font-semibold px-8 py-3 hover:border-gray-900 hover:text-gray-900 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Right side — Geometric illustration */}
          <div className="relative hidden lg:block">
            <GeometricShapes />
          </div>
        </div>
      </div>
    </section>
  );
}
