import { Link } from 'react-router-dom'
import { Globe2, MessageCircle, ArrowRight, Zap, Users, Star, CheckCircle2, TrendingUp, DollarSign, Shield } from 'lucide-react'
import { flag } from '../utils/helpers'

const FEATURED = [
  { name:'Sophie',  country:'France',  code:'FR', seed:'sophie'  },
  { name:'Liam',    country:'Ireland', code:'IE', seed:'liam'    },
  { name:'Yuki',    country:'Japan',   code:'JP', seed:'yuki'    },
  { name:'Carlos',  country:'Mexico',  code:'MX', seed:'carlos'  },
  { name:'Amara',   country:'Ghana',   code:'GH', seed:'amara'   },
  { name:'Emma',    country:'Sweden',  code:'SE', seed:'emma'    },
]

export default function Landing() {
  return (
    <div className="min-h-screen">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Globe2 size={16} className="text-white"/>
            </div>
            <span className="font-display font-bold text-lg text-white">GlobeVibe</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login"    className="btn-ghost text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/8 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-500/6 rounded-full blur-3xl pointer-events-none"/>

        <div className="relative max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-primary-400 mb-8 border border-primary-500/20 animate-fade-in">
            <Zap size={13}/> Pay activation fee · Chat · Earn money
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-slide-up">
            Chat with Foreigners<br/>
            <span className="gradient-text">and Get Paid for It</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed animate-slide-up">
            Pay a small <strong className="text-white">one-time activation fee</strong> to unlock a chat with a foreigner.
            Every message you send earns you real money — deposited straight into your wallet.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14 animate-slide-up">
            <Link to="/register" className="btn-primary px-8 py-3.5 text-base shadow-xl shadow-primary-500/25 group">
              Start Earning Now <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3.5 text-base">
              <MessageCircle size={17}/> Sign In
            </Link>
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 mb-14">
            <span className="flex items-center gap-1.5"><Users size={13} className="text-primary-400"/>2,500+ users</span>
            <span className="flex items-center gap-1.5"><Globe2 size={13} className="text-primary-400"/>50+ countries</span>
            <span className="flex items-center gap-1.5"><Star size={13} className="text-yellow-400 fill-yellow-400"/>4.9 rating</span>
          </div>

          {/* Floating profile cards */}
          <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl mx-auto animate-fade-in">
            {FEATURED.map((p, i) => (
              <div key={i} className="glass flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-white/5 hover:border-primary-500/30 transition-all duration-300">
                <div className="relative">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed}`} className="w-9 h-9 rounded-full bg-dark-600"/>
                  <span className="absolute -bottom-0.5 -right-0.5 text-xs">{flag(p.code)}</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.country}</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-1"/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Earning model — How it works */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <div className="badge badge-green text-xs mx-auto mb-4">How You Earn</div>
            <h2 className="font-display text-4xl font-bold text-white mb-3">Simple. Fast. Profitable.</h2>
            <p className="text-gray-400 max-w-md mx-auto">Three steps to start earning real money from conversations</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Users, n: '01',
                title: 'Create Your Account',
                desc:  'Sign up free in 60 seconds. Choose whether you want to earn as a user or get listed as a foreigner.',
                c: 'text-primary-400', bg: 'bg-primary-500/10',
              },
              {
                icon: Zap, n: '02',
                title: 'Pay Activation Fee',
                desc:  'Pay a small KES 100 one-time fee via M-Pesa STK Push to unlock a 24-hour chat session with your chosen foreigner.',
                c: 'text-accent-400', bg: 'bg-accent-500/10',
              },
              {
                icon: TrendingUp, n: '03',
                title: 'Chat & Earn KES 3/msg',
                desc:  'Every message you send during the session earns KES 3 directly into your wallet. Withdraw anytime via M-Pesa.',
                c: 'text-green-400', bg: 'bg-green-500/10',
              },
            ].map((item, i) => (
              <div key={i} className="card border border-white/5 text-center hover:border-primary-500/20 transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <item.icon size={22} className={item.c}/>
                </div>
                <div className="font-mono text-xs text-gray-600 mb-2">{item.n}</div>
                <h3 className="font-display font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Earning calculator preview */}
          <div className="glass-strong rounded-3xl p-6 border border-primary-500/20 max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-primary-400"/>
              <h3 className="font-display font-semibold text-white text-sm">Quick Earnings Example</h3>
            </div>
            <div className="space-y-2.5 text-sm">
              {[
                { label: 'Activation fee (one-time)', value: '− KES 100', color: 'text-orange-400' },
                { label: 'Send 50 messages (× KES 3)', value: '+ KES 150', color: 'text-green-400' },
                { label: 'Net profit from session',   value: '+ KES 50',  color: 'text-primary-400', bold: true },
              ].map((row, i) => (
                <div key={i} className={`flex justify-between items-center ${i === 2 ? 'pt-2.5 border-t border-white/10' : ''}`}>
                  <span className="text-gray-400">{row.label}</span>
                  <span className={`font-semibold ${row.color} ${row.bold ? 'font-display text-base' : ''}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Send 100+ messages and earn KES 200+ per session. No limits!</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="badge badge-orange text-xs mb-4">Why GlobeVibe</div>
              <h2 className="font-display text-3xl font-bold text-white mb-6">Real earnings, real conversations</h2>
              <div className="space-y-4">
                {[
                  { t: 'Earn Per Message',       d: 'Every message you send earns KES 3 credited to your wallet instantly.' },
                  { t: 'Instant M-Pesa Payments', d: 'Pay the activation fee and withdraw earnings via M-Pesa STK Push — no cards needed.' },
                  { t: 'Real Foreigners',         d: 'Connect with real people from 50+ countries — some joined to share culture, others to earn too.' },
                  { t: 'Become a Foreigner',      d: 'Register as a foreigner directly from your profile. Get listed and let users connect with you.' },
                  { t: 'Safe & Moderated',         d: 'Admin team reviews reports within hours. Every foreigner is verifiable.' },
                ].map((f, i) => (
                  <div key={i} className="flex gap-3">
                    <CheckCircle2 size={17} className="text-primary-400 flex-shrink-0 mt-0.5"/>
                    <div>
                      <div className="text-white font-medium text-sm mb-0.5">{f.t}</div>
                      <div className="text-gray-400 text-sm">{f.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock chat with earning UI */}
            <div className="relative">
              <div className="glass-strong rounded-3xl p-5 border border-white/10 shadow-2xl">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=sophie" className="w-9 h-9 rounded-full"/>
                  <div>
                    <div className="text-white text-sm font-medium">Sophie Laurent 🇫🇷</div>
                    <div className="flex items-center gap-1 text-xs text-green-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400"/> Online
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <TrendingUp size={11} className="text-green-400"/>
                    <span className="text-green-400 text-xs font-semibold">+KES 3/msg</span>
                  </div>
                </div>

                {/* Earning progress */}
                <div className="flex items-center gap-2 mb-4 p-2.5 bg-primary-500/10 rounded-xl border border-primary-500/20">
                  <Zap size={12} className="text-yellow-400"/>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Session earned</span>
                      <span className="text-green-400 font-semibold">KES 42 / KES 500</span>
                    </div>
                    <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-primary-500 rounded-full" style={{ width: '8.4%' }}/>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 mb-4">
                  <div className="flex justify-end">
                    <div>
                      <div className="msg-sent">Bonjour Sophie! Your culture fascinates me 😊</div>
                      <div className="text-xs text-green-400 text-right mt-0.5 pr-1">+KES 3</div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=sophie" className="w-6 h-6 rounded-full flex-shrink-0"/>
                    <div className="msg-recv">Merci! Tell me about Kenya — I'm so curious! 🇰🇪</div>
                  </div>
                  <div className="flex justify-end">
                    <div>
                      <div className="msg-sent">Kenya is amazing! Maasai Mara, Swahili coast... where should I start?</div>
                      <div className="text-xs text-green-400 text-right mt-0.5 pr-1">+KES 3</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input className="flex-1 input-field text-sm py-2" placeholder="Type to earn KES 3…" readOnly/>
                  <button className="btn-primary px-3 py-2 text-sm rounded-xl">Send</button>
                </div>
              </div>

              {/* Floating wallet badge */}
              <div className="absolute -top-4 -right-4 glass-strong border border-green-500/30 rounded-2xl p-3 shadow-xl animate-float">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-green-400"/>
                  <div>
                    <div className="text-xs text-gray-400">Wanjiru earned</div>
                    <div className="text-sm font-bold text-white">KES 4,200 this week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two roles */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-white mb-2">Two ways to participate</h2>
            <p className="text-gray-400 text-sm">Pick the role that suits you — or do both!</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {/* User role */}
            <div className="card border border-primary-500/20 bg-primary-500/5">
              <div className="w-10 h-10 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle size={19} className="text-primary-400"/>
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">Chat User</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                Browse foreigners, pay KES 100 to activate a chat session, and earn KES 3 for every message you send. The more you chat, the more you earn.
              </p>
              <ul className="space-y-1.5 text-xs text-gray-400 mb-5">
                {['Pay KES 100 activation fee','Earn KES 3 per message sent','Chat for up to 24 hours','Withdraw earnings via M-Pesa'].map(item => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 size={12} className="text-primary-400"/>{item}</li>
                ))}
              </ul>
              <Link to="/register" className="btn-primary text-sm py-2.5 w-full">
                Join as User <ArrowRight size={14}/>
              </Link>
            </div>

            {/* Foreigner role */}
            <div className="card border border-purple-500/20 bg-purple-500/5">
              <div className="w-10 h-10 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                <Globe2 size={19} className="text-purple-400"/>
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">Foreigner</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                Register as a foreigner to get listed on the platform. People from around the world pay to start conversations with you, expanding their cultural horizons.
              </p>
              <ul className="space-y-1.5 text-xs text-gray-400 mb-5">
                {['Create profile & get listed','Users pay to connect with you','Share your culture & language','Register directly from your profile'].map(item => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 size={12} className="text-purple-400"/>{item}</li>
                ))}
              </ul>
              <Link to="/register" state={{ is_foreigner: true }} className="font-display font-semibold text-sm py-2.5 w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-lg shadow-purple-900/30">
                Join as Foreigner <ArrowRight size={14}/>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="glass-strong rounded-3xl p-8 border border-white/8 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Shield size={24} className="text-primary-400"/>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-display text-lg font-semibold text-white mb-1">Safe, secure & transparent</h3>
              <p className="text-gray-400 text-sm">Payments processed via M-Pesa STK Push (Lipana Technologies). Your wallet balance and transactions are always visible. Withdraw anytime you reach KES 200 minimum.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="glass-strong rounded-3xl p-12 border border-primary-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none"/>
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-white mb-3">Ready to start earning?</h2>
              <p className="text-gray-400 mb-8">Join thousands connecting with the world — and getting paid for it.</p>
              <Link to="/register" className="btn-primary px-10 py-3.5 text-base inline-flex mx-auto shadow-2xl shadow-primary-500/30 group">
                Create Free Account <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform"/>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Globe2 size={14} className="text-primary-400"/>
            © 2024 GlobeVibe. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>M-Pesa via Lipana Technologies</span>
            <span>·</span>
            <Link to="/admin" className="hover:text-primary-400 transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
