export const COUNTRIES = [
  {code:'KE',name:'Kenya'},{code:'UG',name:'Uganda'},{code:'TZ',name:'Tanzania'},
  {code:'RW',name:'Rwanda'},{code:'NG',name:'Nigeria'},{code:'GH',name:'Ghana'},
  {code:'ZA',name:'South Africa'},{code:'ET',name:'Ethiopia'},{code:'EG',name:'Egypt'},
  {code:'US',name:'United States'},{code:'GB',name:'United Kingdom'},{code:'FR',name:'France'},
  {code:'DE',name:'Germany'},{code:'JP',name:'Japan'},{code:'CN',name:'China'},
  {code:'IN',name:'India'},{code:'BR',name:'Brazil'},{code:'MX',name:'Mexico'},
  {code:'CA',name:'Canada'},{code:'AU',name:'Australia'},{code:'NZ',name:'New Zealand'},
  {code:'AE',name:'UAE'},{code:'SE',name:'Sweden'},{code:'NO',name:'Norway'},
  {code:'DK',name:'Denmark'},{code:'NL',name:'Netherlands'},{code:'IT',name:'Italy'},
  {code:'ES',name:'Spain'},{code:'PT',name:'Portugal'},{code:'IE',name:'Ireland'},
  {code:'PH',name:'Philippines'},{code:'ID',name:'Indonesia'},{code:'SG',name:'Singapore'},
  {code:'ZW',name:'Zimbabwe'},{code:'CM',name:'Cameroon'},{code:'SN',name:'Senegal'},
  {code:'MA',name:'Morocco'},{code:'MZ',name:'Mozambique'},{code:'TH',name:'Thailand'},
  {code:'KR',name:'South Korea'},{code:'AR',name:'Argentina'},{code:'CO',name:'Colombia'},
]

export const flag = code => {
  if (!code) return '🌍'
  try {
    return [...code.toUpperCase()]
      .map(c => String.fromCodePoint(127397 + c.charCodeAt(0)))
      .join('')
  } catch { return '🌍' }
}

export const fmtKES      = v  => `KES ${Number(v||0).toLocaleString('en-KE',{minimumFractionDigits:0,maximumFractionDigits:2})}`
export const fmtDate     = d  => new Date(d).toLocaleDateString('en-KE',{day:'numeric',month:'short',year:'numeric'})
export const fmtTime     = d  => new Date(d).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})
export const formatTime  = fmtTime   // alias

export const timeAgo = d => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export const initials = n => (n || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
export const truncate  = (s, n = 60) => s?.length > n ? s.slice(0, n) + '…' : (s || '')
