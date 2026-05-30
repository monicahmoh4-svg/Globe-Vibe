import { Link } from 'react-router-dom'
import { Globe2, MessageCircle, ArrowRight, Zap, Users, Star, CheckCircle2, TrendingUp, DollarSign, Shield, BookOpen } from 'lucide-react'
import { flag } from '../utils/helpers'

const FEATURED = [
  { name: 'James',   country: 'USA',      code: 'US', seed: 'james',   wants: 'Wants to learn Kiswahili' },
  { name: 'Sarah',   country: 'Canada',   code: 'CA', seed: 'sarah',   wants: 'Lonely, loves African culture' },
  { name: 'Michael', country: 'UK',       code: 'GB', seed: 'michael', wants: 'Teach me Kiswahili!' },
  { name: 'Emma',    country: 'Sweden',   code: 'SE', seed: 'emma',    wants: 'Learning Swahili' },
  { name: 'Hans',    country: 'Germany',  code: 'DE', seed: 'hans',    wants: 'Kenya trip planned' },
  { name: 'Yuki',    country: 'Japan',    code: 'JP', seed: 'yuki',    wants: 'African language fan' },
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
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-primary-400 mb-8 border border-primary-500/20 animate-fade-in">
            <BookOpen size={13}/> Foreigners want to learn Kiswahili · You earn money teaching them
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-slide-up">
            Chat with Lonely Foreigners<br/>
            <span className="gradient-text">and Get Paid for It</span>
          </h1>

          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed animate-slide-up">
            Hundreds of foreigners from the <strong className="text-white">USA, Canada, UK, Germany</strong> and more are looking for Kenyan friends to teach them <strong className="text-white">Kiswahili</strong> and share African culture.
            Pay <strong className="text-white">KES 100 once</strong> to unlock all of them — then earn <strong className="text-green-400">KES 3 per message</strong> you send.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14 animate-slide-up">
            <Link to="/register" className="btn-primary px-8 py-3.5 text-base shadow-xl shadow-primary-500/25 group">
              Start Earning Now <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3.5 text-base">
              <MessageCircle size={17}/> Already have account
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500 mb-14">
            <span className="flex items-center gap-1.5"><Users size={13} className="text-primary-400"/>500+ foreigners</span>
            <span className="flex items-center gap-1.5"><Globe2 size={13} className="text-primary-400"/>30+ countries</span>
            <span className="flex items-center gap-1.5"><Star size={13} className="text-yellow-400 fill-yellow-400"/>4.9 rating</span>
          </div>

          {/* Foreigner cards */}
          <div className="flex flex-wrap justify-center gap-2.5 max-w-2xl mx-auto animate-fade-in">
            {FEATURED.map((p, i) => (
              <div key={i} className="glass flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border border-white/5 hover:border-primary-500/30 transition-all duration-300">
                <div className="relative">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed}`} className="w-9 h-9 rounded-full bg-dark-600"/>
                  <span className="absolute -bottom-0.5 -right-0.5 text-xs">{flag(p.code)}</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-white">{p.name} · {p.country}</div>
                  <div className="text-xs text-primary-400">{p.wants}</div>
                </div>
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
            <h2 className="font-display text-4xl font-bold text-white mb-3">Activate Once. Earn Forever.</h2>
            <p className="text-gray-400 max-w-md mx-auto">One payment unlocks every foreigner on the platform. No per-chat fees — ever again.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-5 mb-12">
            {[
              { icon: Users,        n: '01', title: 'Create Account', desc: 'Sign up free. Choose to earn as a user or be listed as a foreigner.',  c: 'text-primary-400', bg: 'bg-primary-500/10' },
              { icon: Zap,          n: '02', title: 'Pay KES 100 Once', desc: 'One-time activation fee unlocks ALL foreigners forever. Never pay again.', c: 'text-accent-400',  bg: 'bg-accent-500/10'  },
              { icon: MessageCircle,n: '03', title: 'Chat for Free',   desc: 'Start free chats with any foreigner instantly. No per-chat charges.', c: 'text-blue-400',    bg: 'bg-blue-500/10'   },
              { icon: TrendingUp,   n: '04', title: 'Earn KES 3/msg',  desc: 'Every message you send earns KES 3 into your wallet. Withdraw via M-Pesa.',  c: 'text-green-400',   bg: 'bg-green-500/10'  },
            ].map((item, i) => (
              <div key={i} className="card border border-white/5 text-center hover:border-primary-500/20 transition-all hover:-translate-y-1">
                <div className={`w-11 h-11 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                  <item.icon size={20} className={item.c}/>
                </div>
                <div className="font-mono text-xs text-gray-600 mb-1.5">{item.n}</div>
                <h3 className="font-display font-semibold text-white mb-2 text-sm">{item.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Earnings calculator */}
          <div className="glass-strong rounded-3xl p-6 border border-primary-500/20 max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-primary-400"/>
              <h3 className="font-display font-semibold text-white text-sm">Earnings Example — One Chat Session</h3>
            </div>
            <div className="space-y-2.5 text-sm">
              {[
                { label: 'Activation fee (paid once, not per chat)', value: '− KES 100', color: 'text-orange-400' },
                { label: 'Send 50 messages to a foreigner',          value: '+ KES 150', color: 'text-green-400'  },
                { label: 'Send 100 messages in the same session',    value: '+ KES 300', color: 'text-green-400'  },
                { label: 'Net profit after 100 messages',             value: '+ KES 200', color: 'text-primary-400', bold: true },
              ].map((row, i) => (
                <div key={i} className={`flex justify-between items-center ${i === 3 ? 'pt-2.5 border-t border-white/10' : ''}`}>
                  <span className="text-gray-400 text-xs">{row.label}</span>
                  <span className={`font-semibold ${row.color} ${row.bold ? 'font-display text-base' : 'text-sm'}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Chat with multiple foreigners daily — your wallet never stops growing!</p>
          </div>
        </div>
      </section>

      {/* Who are the foreigners */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="badge badge-purple text-xs mx-auto mb-4">Real Foreigners</div>
            <h2 className="font-display text-3xl font-bold text-white mb-3">Who Are These People?</h2>
            <p className="text-gray-400 max-w-lg mx-auto text-sm">Real people from around the world who are lonely, curious about African culture, or specifically want to learn Kiswahili.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'James Mitchell', country: 'New York, USA', code: 'US', seed: 'james', bio: '"I\'m lonely in New York and absolutely fascinated by Swahili. Please teach me — I already know Jambo and Asante! 😄"', tag: 'Wants to learn Kiswahili' },
              { name: 'Sarah Campbell', country: 'Toronto, Canada', code: 'CA', seed: 'sarah', bio: '"Learning Kiswahili is my 2024 goal. I visited Nairobi and fell in love with Kenya. Back home now and lonely!"', tag: 'Loves Kenyan culture' },
              { name: 'Michael Brown', country: 'London, UK', code: 'GB', seed: 'michael', bio: '"Watched a documentary about East Africa and now I\'m obsessed. Teach me Swahili please! I\'ll tell you about London 🇬🇧"', tag: 'Kiswahili beginner' },
              { name: 'Hans Mueller', country: 'Berlin, Germany', code: 'DE', seed: 'hans', bio: '"Planning a Kenya safari next year. I want to learn basic Kiswahili before I go. Looking for a patient teacher!"', tag: 'Planning Kenya trip' },
              { name: 'Emily Johnson', country: 'Sydney, Australia', code: 'AU', seed: 'emily', bio: '"Habari! I\'m lonely working from home. I fell in love with African cultures and Kiswahili sounds like music to me!"', tag: 'African culture fan' },
              { name: 'Yuki Tanaka', country: 'Tokyo, Japan', code: 'JP', seed: 'yuki', bio: '"I discovered Kiswahili by accident and now I\'m obsessed! Teach me and I\'ll teach you some Japanese too 🗾"', tag: 'Language exchange' },
            ].map((p, i) => (
              <div key={i} className="card border border-white/5 hover:border-primary-500/20 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.seed}`} className="w-12 h-12 rounded-2xl bg-dark-600"/>
                    <span className="absolute -bottom-1 -right-1 text-base">{flag(p.code)}</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{p.name}</div>
                    <div className="text-gray-500 text-xs">{p.country}</div>
                    <span className="badge badge-blue text-xs mt-0.5">{p.tag}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed italic">{p.bio}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm mb-4">+ hundreds more from France, Mexico, India, Brazil, UAE and more…</p>
            <Link to="/register" className="btn-primary inline-flex text-sm px-6 py-3">
              Chat with All of Them <ArrowRight size={15}/>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="badge badge-orange text-xs mb-4">Why GlobeVibe</div>
              <h2 className="font-display text-3xl font-bold text-white mb-6">Built for real connections and real earnings</h2>
              <div className="space-y-4">
                {[
                  { t: 'One Fee, All Foreigners',    d: 'Pay KES 100 once and chat with every foreigner on the platform forever. No per-chat fees.' },
                  { t: 'Earn KES 3 Per Message',     d: 'Every single message you send earns money deposited into your wallet instantly.' },
                  { t: 'Real People, Real Chats',    d: 'Real foreigners from 30+ countries wanting to learn Kiswahili and connect with Kenyans.' },
                  { t: 'Withdraw via M-Pesa',        d: 'Withdraw your earnings anytime to M-Pesa. Minimum withdrawal is KES 200.' },
                  { t: 'Become a Foreigner Too',     d: 'Register as a foreigner from your profile. Let users from Kenya connect and chat with you.' },
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

            {/* Chat preview */}
            <div className="relative">
              <div className="glass-strong rounded-3xl p-5 border border-white/10 shadow-2xl">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=james" className="w-9 h-9 rounded-full"/>
                  <div>
                    <div className="text-white text-sm font-medium">James Mitchell 🇺🇸</div>
                    <div className="flex items-center gap-1 text-xs text-green-400"><div className="w-1.5 h-1.5 rounded-full bg-green-400"/>Online · Wants to learn Kiswahili</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <TrendingUp size={11} className="text-green-400"/>
                    <span className="text-green-400 text-xs font-semibold">+KES 3/msg</span>
                  </div>
                </div>

                <div className="space-y-2.5 mb-4">
                  <div className="flex gap-2 items-end">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=james" className="w-6 h-6 rounded-full flex-shrink-0"/>
                    <div className="msg-recv">Habari! How do you say "How are you?" in Kiswahili? 😊</div>
                  </div>
                  <div className="flex justify-end">
                    <div>
                      <div className="msg-sent">You say "Habari yako?" and the reply is "Nzuri sana!" meaning "Very well!" 🇰🇪</div>
                      <div className="text-xs text-green-400 text-right mt-0.5 pr-1">+KES 3</div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=james" className="w-6 h-6 rounded-full flex-shrink-0"/>
                    <div className="msg-recv">Habari yako! That's beautiful! Teach me more please! ❤️</div>
                  </div>
                  <div className="flex justify-end">
                    <div>
                      <div className="msg-sent">Of course! Next: "Asante sana" means "Thank you very much!" 😄</div>
                      <div className="text-xs text-green-400 text-right mt-0.5 pr-1">+KES 3</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input className="flex-1 input-field text-sm py-2" placeholder="Type Kiswahili lessons to earn…" readOnly/>
                  <button className="btn-primary px-3 py-2 text-sm rounded-xl">Send</button>
                </div>
              </div>

              {/* Floating earnings badge */}
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
            <h2 className="font-display text-3xl font-bold text-white mb-2">Choose your role</h2>
            <p className="text-gray-400 text-sm">You can do both — be a user AND a foreigner</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="card border border-primary-500/20 bg-primary-500/5">
              <div className="w-10 h-10 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle size={19} className="text-primary-400"/>
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">Chat User</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">Pay KES 100 once to unlock all foreigners. Chat with anyone and earn KES 3 per message you send.</p>
              <ul className="space-y-1.5 text-xs text-gray-400 mb-5">
                {['One-time KES 100 activation fee', 'Chat with ALL foreigners for free', 'Earn KES 3 per message sent', 'Withdraw to M-Pesa anytime'].map(item => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 size={12} className="text-primary-400 flex-shrink-0"/>{item}</li>
                ))}
              </ul>
              <Link to="/register" className="btn-primary text-sm py-2.5 w-full">
                Join as User <ArrowRight size={14}/>
              </Link>
            </div>

            <div className="card border border-purple-500/20 bg-purple-500/5">
              <div className="w-10 h-10 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                <Globe2 size={19} className="text-purple-400"/>
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">Foreigner</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">Register as a foreigner to get listed. Activated users can start free chats with you — share your culture and language!</p>
              <ul className="space-y-1.5 text-xs text-gray-400 mb-5">
                {['Free to register as foreigner', 'Get listed on the browse page', 'Chat with people from Kenya', 'Switch from your profile anytime'].map(item => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 size={12} className="text-purple-400 flex-shrink-0"/>{item}</li>
                ))}
              </ul>
              <Link to="/register" className="font-display font-semibold text-sm py-2.5 w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all">
                Join as Foreigner <ArrowRight size={14}/>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="glass-strong rounded-3xl p-6 border border-white/8 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Shield size={22} className="text-primary-400"/>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-display text-lg font-semibold text-white mb-1">Safe, transparent &amp; M-Pesa powered</h3>
              <p className="text-gray-400 text-sm">Payments via M-Pesa STK Push (Lipana Technologies). Every transaction is logged. Withdraw earnings whenever your balance hits KES 200. Admin moderates all chats.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="glass-strong rounded-3xl p-12 border border-primary-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none"/>
            <div className="relative">
              <h2 className="font-display text-3xl font-bold text-white mb-3">Start earning from your Kiswahili today</h2>
              <p className="text-gray-400 mb-8">Hundreds of lonely foreigners are waiting to learn from you. Pay once, chat forever, earn forever.</p>
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
          <div className="flex items-center gap-2"><Globe2 size={14} className="text-primary-400"/> © 2024 GlobeVibe. All rights reserved.</div>
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
