import { Link } from 'react-router-dom'
import { Globe2, MessageCircle, DollarSign, ArrowRight, Zap, Users, Star, CheckCircle2, TrendingUp } from 'lucide-react'
import { flag } from '../utils/helpers'

const FEATURED = [
  {name:'Sophie',  country:'France',  code:'FR', seed:'sophie'},
  {name:'Liam',    country:'Ireland', code:'IE', seed:'liam'},
  {name:'Yuki',    country:'Japan',   code:'JP', seed:'yuki'},
  {name:'Carlos',  country:'Mexico',  code:'MX', seed:'carlos'},
  {name:'Amara',   country:'Ghana',   code:'GH', seed:'amara'},
  {name:'Emma',    country:'Sweden',  code:'SE', seed:'emma'},
]

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Globe2 size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white">GlobeVibe</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login"    className="btn-ghost text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <div className="absolute top-1/4 left-1/4  w-96 h-96 bg-primary-500/8  rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-500/6 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-primary-400 mb-8 border border-primary-500/20 animate-fade-in">
            <Zap size={13} /> Connect globally · Earn locally
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-slide-up">
            Chat with the World,<br />
            <span className="gradient-text">Get Paid for It</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed animate-slide-up">
            Connect with fascinating people from 50+ countries. Pay a small fee via M-Pesa to unlock real conversations. Foreigners earn every time someone connects with them.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14 animate-slide-up">
            <Link to="/register" className="btn-primary px-8 py-3 text-base shadow-xl shadow-primary-500/25 group">
              Start Connecting <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3 text-base">
              <MessageCircle size={17} /> I have an account
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 mb-14">
            <span className="flex items-center gap-1.5"><Users size={13} className="text-primary-400" />2,500+ users</span>
            <span className="flex items-center gap-1.5"><Globe2 size={13} className="text-primary-400" />50+ countries</span>
            <span className="flex items-center gap-1.5"><Star size={13} className="text-yellow-400 fill-yellow-400" />4.9 rating</span>
          </div>

          {/* Floating profile cards */}
          <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl mx-auto animate-fade-in">
            {FEATURED.map((p,i) => (
              <div key={i} className="glass flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-white/5 hover:border-primary-500/30 transition-all duration-300">
                <div className="relative">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed}`} className="w-9 h-9 rounded-full bg-dark-600" />
                  <span className="absolute -bottom-0.5 -right-0.5 text-xs">{flag(p.code)}</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.country}</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-1" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="badge badge-green text-xs mx-auto mb-4">How It Works</div>
            <h2 className="font-display text-4xl font-bold text-white mb-3">Simple. Fast. Rewarding.</h2>
            <p className="text-gray-400 max-w-md mx-auto">Three easy steps to global conversations</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {icon:Users,       n:'01', title:'Create Account', desc:'Sign up in 60 seconds. Set up your profile with your country and interests.', c:'text-primary-400', bg:'bg-primary-500/10'},
              {icon:DollarSign,  n:'02', title:'Pay & Connect',  desc:'Browse foreigners, pay a small fee via M-Pesa STK Push, and unlock the chat.', c:'text-accent-400', bg:'bg-accent-500/10'},
              {icon:MessageCircle,n:'03',title:'Chat & Earn',   desc:'Have real conversations. Foreigners earn 70% of each connection fee paid to chat with them.', c:'text-blue-400', bg:'bg-blue-500/10'},
            ].map((item,i) => (
              <div key={i} className="card border border-white/5 text-center hover:border-primary-500/20 transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <item.icon size={22} className={item.c} />
                </div>
                <div className="font-mono text-xs text-gray-600 mb-2">{item.n}</div>
                <h3 className="font-display font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="badge badge-orange text-xs mb-4">Why GlobeVibe</div>
              <h2 className="font-display text-3xl font-bold text-white mb-6">Built for real connections and real earnings</h2>
              <div className="space-y-4">
                {[
                  {t:'Instant M-Pesa Payments', d:'Pay with your phone via STK Push — no card needed. Safe and instant.'},
                  {t:'Earn While You Chat',      d:'Foreigners earn 70% of every connection fee. Withdraw anytime.'},
                  {t:'Verified Profiles',        d:'Every foreigner is verified by our admin team for authenticity.'},
                  {t:'Safe & Moderated',         d:'Report system and admin moderation keep the platform safe.'},
                  {t:'Works Everywhere',         d:'Fully responsive — works great on mobile, tablet and desktop.'},
                ].map((f,i) => (
                  <div key={i} className="flex gap-3">
                    <CheckCircle2 size={18} className="text-primary-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-white font-medium text-sm mb-0.5">{f.t}</div>
                      <div className="text-gray-400 text-sm">{f.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock chat preview */}
            <div className="relative">
              <div className="glass-strong rounded-3xl p-5 border border-white/10 shadow-2xl">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=sophie" className="w-9 h-9 rounded-full" />
                  <div>
                    <div className="text-white text-sm font-medium">Sophie Laurent 🇫🇷</div>
                    <div className="flex items-center gap-1 text-xs text-green-400"><div className="w-1.5 h-1.5 rounded-full bg-green-400" />Online</div>
                  </div>
                  <div className="ml-auto badge badge-green text-xs">Connected</div>
                </div>
                <div className="space-y-2.5 mb-4">
                  <div className="flex justify-end"><div className="msg-sent">Bonjour Sophie! Je suis ravi de te parler 😊</div></div>
                  <div className="flex gap-2 items-end">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=sophie" className="w-6 h-6 rounded-full flex-shrink-0" />
                    <div className="msg-recv">Your French is impressive! Where did you learn? 🇰🇪</div>
                  </div>
                  <div className="flex justify-end"><div className="msg-sent">Google Translate 😂 But I'd love to really learn!</div></div>
                  <div className="flex gap-2 items-end">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=sophie" className="w-6 h-6 rounded-full flex-shrink-0" />
                    <div className="msg-recv">I can teach you! I love hearing about Kenya ❤️</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input className="flex-1 input-field text-sm py-2" placeholder="Type a message…" readOnly />
                  <button className="btn-primary px-3 py-2 text-sm rounded-xl">Send</button>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 glass-strong border border-primary-500/30 rounded-2xl p-3 shadow-xl animate-float">
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="text-primary-400" />
                  <div>
                    <div className="text-xs text-gray-400">Sophie earned</div>
                    <div className="text-sm font-bold text-white">KES 7,000 this week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="glass-strong rounded-3xl p-12 border border-primary-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-white mb-3">Ready to go global?</h2>
              <p className="text-gray-400 mb-8">Join thousands of Kenyans connecting with the world.</p>
              <Link to="/register" className="btn-primary px-10 py-3.5 text-base inline-flex mx-auto shadow-2xl shadow-primary-500/30 group">
                Create Free Account <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2"><Globe2 size={14} className="text-primary-400" /> © 2024 GlobeVibe. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>Powered by M-Pesa STK Push</span>
            <span>·</span>
            <Link to="/admin" className="hover:text-primary-400 transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
