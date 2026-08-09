// app/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { 
  Shield, Award, Users, CheckCircle, ArrowRight, 
  ChevronRight, Star, Heart, Clock, Globe, Lock, 
  Sparkles, TrendingUp, Phone, Mail, MapPin, 
  Menu, X, ChevronDown
} from "lucide-react";

// Import social icons from react-icons
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

const DEFAULT_CONTENT: Record<string, string> = {
  site_name: "MTIS VOTE",
  site_tagline: "Official Voting System",
  event_year: "2026",
  hero_title: "Vote for the next Mr. & Miss, Prince & Princess of MTIS",
  hero_subtitle: "The official voting platform for the MTIS Pageant. Secure, transparent, and easy to use — for our Senior and Junior royalty alike.",
  about_title: "About the Pageant",
  about_text: "The MTIS Pageant celebrates confidence, talent, and school spirit across two divisions: our Senior royalty, competing for Mr. & Miss MTIS, and our Junior royalty, competing for Prince & Princess MTIS. Every vote across our five categories helps decide all four titles.",
  contact_email: "macdonaldtrevanschools@gmail.com",
  contact_phone: "+2348072201640, +2348065938082, +2348108098018, +2348038805158",
  contact_address: "5, Joy Ogunbanwo Street, Off Adeba Rd, Lakowe Town, Ibeju Lekki, Lagos",
  social_facebook: "",
  social_twitter: "",
  social_instagram: "",
  social_linkedin: "",
  footer_copyright: "© 2026 MTIS Voting System. All rights reserved. | Mr. & Miss, Prince & Princess MTIS 2026",
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [content, setContent] = useState<Record<string, string>>(DEFAULT_CONTENT);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load editable site copy (hero, about, contact, social, footer) from
  // the CMS. Falls back to the defaults above if the fetch fails or a
  // field hasn't been set yet, so the page never shows blank text.
  useEffect(() => {
    fetch('/api/site-content')
      .then((res) => res.json())
      .then((data) => {
        if (data?.content) {
          setContent((prev) => ({ ...prev, ...data.content }));
        }
      })
      .catch(() => {
        // Keep defaults on failure — this is non-critical, non-blocking content.
      });
  }, []);

  const features = [
    { icon: Shield, title: "Secure Voting", description: "Military-grade encryption ensures your vote remains confidential and tamper-proof." },
    { icon: Award, title: "Fair & Transparent", description: "Real-time auditing and blockchain verification for complete transparency." },
    { icon: Users, title: "User-Friendly", description: "Intuitive interface makes voting quick and accessible for everyone." },
    { icon: Clock, title: "24/7 Accessibility", description: "Vote anytime, anywhere from any device with internet connection." },
  ];

  const stats = [
    { value: "500+", label: "Active Voters", icon: Users },
    { value: "98%", label: "Satisfaction Rate", icon: Star },
    { value: "24/7", label: "Support Available", icon: Clock },
    { value: "100%", label: "Secure Transactions", icon: Lock },
  ];

  const testimonials = [
    { name: "Maria Santos", role: "Voter", content: "The voting process was seamless and secure. I felt confident that my vote counted!", avatar: "MS", rating: 5 },
    { name: "John Reyes", role: "Contestant", content: "A fair and transparent system that gave every contestant an equal opportunity.", avatar: "JR", rating: 5 },
    { name: "Dr. Anna Cruz", role: "Event Organizer", content: "MTIS Voting System revolutionized how we conduct our pageant voting.", avatar: "AC", rating: 5 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-mtis-blue via-mtis-blue to-mtis-wine">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white/10 backdrop-blur-sm"}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10">
                <Image
                  src="/img/mtislogo.png"
                  alt="MTIS Logo"
                  width={40}
                  height={40}
                  className="object-contain "
                />
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight text-white">
                  {content.site_name?.split(' ')[0] || 'MTIS'} <span className="text-mtis-gold">{content.site_name?.split(' ').slice(1).join(' ') || 'VOTE'}</span>
                </span>
                <p className="text-xs text-white/60">{content.site_tagline}</p>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-white hover:text-mtis-gold transition font-medium">Home</Link>
              <Link href="#features" className="text-white/80 hover:text-mtis-gold transition">Features</Link>
              <Link href="#how-it-works" className="text-white/80 hover:text-mtis-gold transition">How It Works</Link>
              <Link href="#contact" className="text-white/80 hover:text-mtis-gold transition">Contact</Link>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link 
                href="/login" 
                className="px-5 py-2 rounded-xl text-white font-medium hover:bg-white/10 transition"
              >
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="px-6 py-2 bg-mtis-gold text-mtis-blue font-semibold rounded-xl hover:shadow-lg transition-all hover:scale-105"
              >
                Register Now
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <Link href="/" className="block py-2 text-gray-800 hover:text-mtis-blue font-medium">Home</Link>
              <Link href="#features" className="block py-2 text-gray-600 hover:text-mtis-blue">Features</Link>
              <Link href="#how-it-works" className="block py-2 text-gray-600 hover:text-mtis-blue">How It Works</Link>
              <Link href="#contact" className="block py-2 text-gray-600 hover:text-mtis-blue">Contact</Link>
              <div className="pt-4 flex gap-3">
                <Link href="/login" className="flex-1 text-center px-4 py-2 border border-mtis-blue rounded-xl text-mtis-blue font-medium">Sign In</Link>
                <Link href="/register" className="flex-1 text-center px-4 py-2 bg-mtis-blue text-white rounded-xl font-medium">Register</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Sparkles size={16} className="text-mtis-gold" />
                <span className="text-sm text-white/90">Official Voting System</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                {content.hero_title || DEFAULT_CONTENT.hero_title}
              </h1>
              <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                {content.hero_subtitle || DEFAULT_CONTENT.hero_subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link 
                  href="/register-contestant" 
                  className="group inline-flex items-center justify-center gap-2 px-8 py-3 bg-mtis-gold text-mtis-blue font-semibold rounded-xl hover:shadow-xl transition-all hover:scale-105"
                >
                  Contestant Registration <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
                </Link>
                <Link 
                  href="/public-vote" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition"
                >
                  Public Voting<ChevronRight size={18} />
                </Link>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 mt-12 pt-8 border-t border-white/20 max-w-lg mx-auto lg:mx-0">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center lg:text-left">
                    <div className="flex items-center gap-2 justify-center lg:justify-start mb-2">
                      <stat.icon size={20} className="text-mtis-gold" />
                      <span className="text-2xl font-bold text-white">{stat.value}</span>
                    </div>
                    <p className="text-sm text-white/60">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Illustration */}
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mtis-gold to-amber-500 flex items-center justify-center mx-auto mb-4">
                      <Shield size={40} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Secure Voting Platform</h3>
                    <p className="text-white/60 text-sm">Your vote is encrypted and anonymous</p>
                  </div>
                  
                  {/* Feature List */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white/80 text-sm">
                      <CheckCircle size={16} className="text-mtis-gold flex-shrink-0" />
                      <span>End-to-end encryption</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80 text-sm">
                      <CheckCircle size={16} className="text-mtis-gold flex-shrink-0" />
                      <span>Real-time vote tracking</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/80 text-sm">
                      <CheckCircle size={16} className="text-mtis-gold flex-shrink-0" />
                      <span>Multi-factor authentication</span>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 bg-gradient-to-r from-mtis-gold to-amber-500 rounded-xl px-4 py-2 shadow-lg animate-bounce">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-white" />
                    <span className="text-sm font-bold text-white">Trusted System</span>
                  </div>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white rounded-xl px-4 py-2 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-mtis-blue" />
                    <span className="text-sm font-bold text-mtis-blue">500+ Active Voters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About the Pageant Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-mtis-blue mb-6">{content.about_title || DEFAULT_CONTENT.about_title}</h2>
          <p className="text-gray-600 text-lg leading-relaxed">{content.about_text || DEFAULT_CONTENT.about_text}</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-mtis-blue mb-4">Why Choose MTIS Voting System?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We provide a secure, transparent, and user-friendly platform for all your voting needs
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="group text-center p-6 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mtis-blue/10 to-mtis-wine/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
                  <feature.icon size={28} className="text-mtis-blue" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-mtis-blue mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple three-step process to cast your vote
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Register Account", description: "Create your voter account with your email and verify your identity", icon: Users },
              { step: "02", title: "Browse Categories", description: "Explore different voting categories and learn about contestants", icon: Globe },
              { step: "03", title: "Cast Your Vote", description: "Select your favorite contestant and submit your vote securely", icon: Heart },
            ].map((item, idx) => (
              <div key={idx} className="relative text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-mtis-blue to-mtis-wine flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <item.icon size={32} className="text-white" />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-3 w-8 h-8 rounded-full bg-mtis-gold text-white flex items-center justify-center font-bold text-sm">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-mtis-blue mb-4">What People Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Trusted by voters, contestants, and organizers alike
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-mtis-blue to-mtis-wine flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="fill-mtis-gold text-mtis-gold" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{testimonial.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-mtis-blue to-mtis-wine">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Cast Your Vote?
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Join thousands of voters who have already participated in shaping the future of MTIS
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="px-8 py-3 bg-mtis-gold text-mtis-blue font-semibold rounded-xl hover:shadow-xl transition-all hover:scale-105"
            >
              Register Now
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/img/mtislogo.png"
                  alt="MTIS Logo"
                  width={32}
                  height={32}
                  className="object-contain "
                />
                <span className="font-bold text-lg">{content.site_name || DEFAULT_CONTENT.site_name}</span>
              </div>
              <p className="text-gray-400 text-sm">
                Official voting system for the MTIS Pageant {content.event_year || DEFAULT_CONTENT.event_year}.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-mtis-gold transition">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-mtis-gold transition">How It Works</Link></li>
                <li><Link href="#testimonials" className="hover:text-mtis-gold transition">Testimonials</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-mtis-gold transition">FAQ</Link></li>
                <li><Link href="#" className="hover:text-mtis-gold transition">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-mtis-gold transition">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail size={14} /> {content.contact_email || DEFAULT_CONTENT.contact_email}
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} /> {content.contact_phone || DEFAULT_CONTENT.contact_phone}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={14} /> {content.contact_address || DEFAULT_CONTENT.contact_address}
                </li>
              </ul>
              <div className="flex gap-4 mt-4">
                <Link href={content.social_facebook || "#"} className="text-gray-400 hover:text-mtis-gold transition">
                  <FaFacebook size={18} />
                </Link>
                <Link href={content.social_twitter || "#"} className="text-gray-400 hover:text-mtis-gold transition">
                  <FaTwitter size={18} />
                </Link>
                <Link href={content.social_instagram || "#"} className="text-gray-400 hover:text-mtis-gold transition">
                  <FaInstagram size={18} />
                </Link>
                <Link href={content.social_linkedin || "#"} className="text-gray-400 hover:text-mtis-gold transition">
                  <FaLinkedin size={18} />
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>{content.footer_copyright || DEFAULT_CONTENT.footer_copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}