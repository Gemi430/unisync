import React from 'react';
import { BookOpen, Users, BrainCircuit, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent-500/20 rounded-full blur-[100px]" />

      {/* Navbar */}
      <nav className="w-full glass z-10 sticky top-0 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-brand-600" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-900">
            UniSync
          </span>
        </div>
        <div className="space-x-4 flex items-center">
          <Link to="/login" className="text-slate-600 hover:text-brand-600 transition-colors font-medium">Log In</Link>
          <Link to="/register" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 shadow-md">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center -mt-10 p-6 z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm font-medium text-brand-700">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
          </span>
          Now accepting Freshman applications
        </div>
        
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mb-6 leading-tight">
          Master Your Freshman Year <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-accent-500">With Confidence</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          The ultimate resource sharing and quiz platform tailored specifically for Natural and Social streams. Collaborate, practice, and succeed.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/register" className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:translate-y-[-2px] hover:shadow-xl">
            Register as Student <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="glass flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-lg text-slate-800 hover:bg-white/80 transition-all transform hover:translate-y-[-2px]">
            View Courses
          </Link>
        </div>
      </main>

      {/* Features snippet */}
      <section className="py-20 z-10 px-6 mt-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="glass p-8 rounded-3xl hover:border-brand-300 transition-colors">
            <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="w-7 h-7 text-brand-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-800">Curated Resources</h3>
            <p className="text-slate-600">Access exactly what you need for both Natural and Social stream courses, approved by admins.</p>
          </div>
          <div className="glass p-8 rounded-3xl hover:border-accent-300 transition-colors">
            <div className="w-14 h-14 bg-accent-100 rounded-2xl flex items-center justify-center mb-6">
              <BrainCircuit className="w-7 h-7 text-accent-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-800">Smart Quizzes</h3>
            <p className="text-slate-600">Test your knowledge with immediate feedback and track your ongoing progress.</p>
          </div>
          <div className="glass p-8 rounded-3xl hover:border-social-300 transition-colors">
            <div className="w-14 h-14 bg-social-100 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-7 h-7 text-social-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-800">Secure Network</h3>
            <p className="text-slate-600">Verified student access ensures a high-quality, focused learning environment.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
