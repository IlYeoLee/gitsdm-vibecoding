import React, { useState, useRef, useEffect } from 'react';
import {
  Users, LayoutDashboard, Map, Plus, ArrowRight, Clock, Zap, ChevronRight, User,
  ExternalLink, Sparkles, Image as ImageIcon, Heart, Ban, Upload, X, Sun, Moon,
  Coffee, Home, Building2, ChevronDown, FileImage, Calendar,
  MessageCircle, Dna, Phone, Instagram, Link as LinkIcon, Trash2, CheckCircle2,
  Copy, Share2, Check, Navigation, AlertCircle, Smile, MapPinned, Flag, CalendarPlus, Circle, Monitor, Bed
} from 'lucide-react';

// --- Constants ---
const VIEWS = {
  LANDING: 'landing',
  SETUP_TEAM: 'setup_team',
  PROFILE_FORM: 'profile_form',
  DASHBOARD: 'dashboard'
};

const ROLES = ["PL", "ID", "VD", "UX"];
const GENERATIONS = ["31기", "32기", "33기", "34기"];
const PROJECT_CATEGORIES = ["파운데이션", "인텐시브", "소모임", "산학", "MEP", "기타"];
const WORK_STYLE_TAGS = ["빠른 시각화", "깊은 리서치", "논리적 근거", "디테일 집착", "아이디어 위주", "문서화 강점"];
const MEP_TOPICS = ["가전", "AR", "VR", "로봇", "모빌리티", "휴머노이드", "바이브코딩", "AI", "헬스케어", "에코시스템"];

// --- Helper: Local Storage Data Handling ---
const APP_STORAGE_KEY = 'ALIGN_TEAM_DATA';

const saveTeamToLocal = (team) => {
  try {
    const allTeams = JSON.parse(localStorage.getItem(APP_STORAGE_KEY) || '{}');
    allTeams[team.id] = team;
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(allTeams));
  } catch (err) {
    console.warn('LocalStorage limit reached. Trying to save without images...', err);
    try {
      const lightTeam = JSON.parse(JSON.stringify(team));
      if (lightTeam.members) {
        lightTeam.members.forEach(m => {
          if (m.workItems) {
            m.workItems.forEach(wi => {
              wi.url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400';
            });
          }
        });
      }
      const allTeams = JSON.parse(localStorage.getItem(APP_STORAGE_KEY) || '{}');
      allTeams[lightTeam.id] = lightTeam;
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(allTeams));
    } catch (e) {
      console.error('Completely failed to save to localStorage.', e);
    }
  }
};

const getTeamFromLocal = (id) => {
  try {
    const allTeams = JSON.parse(localStorage.getItem(APP_STORAGE_KEY) || '{}');
    return allTeams[id] || null;
  } catch (err) {
    return null;
  }
};

const copyToClipboard = (text) => {
  try {
    const textField = document.createElement('textarea');
    textField.value = text;
    textField.style.position = 'fixed';
    textField.style.left = '-9999px';
    textField.style.top = '0';
    document.body.appendChild(textField);
    textField.focus();
    textField.select();
    document.execCommand('copy');
    document.body.removeChild(textField);
  } catch (err) {
    console.error('Clipboard copy failed:', err);
  }
};

const getInviteUrl = (teamId) => {
  let baseUrl = window.location.href.split('?')[0];
  if (baseUrl.startsWith('blob:') || baseUrl === 'null') {
    return `https://align-os.app/?teamId=${teamId}`;
  }
  return `${baseUrl}?teamId=${teamId}`;
};

// --- UI Components ---
const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white border border-gray-100 rounded-3xl md:rounded-[28px] p-5 md:p-6 shadow-sm transition-all ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, type = "button" }) => {
  const baseStyles = "px-5 md:px-6 py-3.5 md:py-4 rounded-2xl md:rounded-[20px] font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 text-sm md:text-base";
  const variants = {
    primary: "bg-[#3182f6] text-white hover:bg-[#1b64da]",
    secondary: "bg-[#f2f4f6] text-[#4e5968] hover:bg-[#e5e8eb]",
    outline: "border border-[#e5e8eb] text-[#4e5968] hover:bg-gray-50",
    ghost: "text-[#8b95a1] hover:bg-gray-100"
  };
  return (
    <button type={type} onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
};

// --- Full Screen Finch Style Scene ---
const FinchWalkingScene = ({ members, onMemberClick }) => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const getRoleColor = (role) => {
    switch(role) {
      case 'PL': return '#3182f6';
      case 'ID': return '#00c471';
      case 'VD': return '#ff8a00';
      case 'UX': return '#9b51e0';
      default: return '#3182f6';
    }
  };

  const getBackpackColor = (role) => {
    switch(role) {
      case 'PL': return '#e1306c';
      case 'ID': return '#ffb300';
      case 'VD': return '#f04452';
      case 'UX': return '#00b8d9';
      default: return '#f04452';
    }
  };

  // Mobile spacing tighter so 5+ characters still fit
  const charOffset = isMobile ? 70 : 110;

  return (
    <div className="absolute inset-0 bg-[#E8DDE0] overflow-hidden pointer-events-none">
      <style>{`
        .scene-bg-pan { animation: sceneScroll 28s linear infinite; }
        .scene-objects-pan { animation: sceneScroll 14s linear infinite; }
        @keyframes sceneScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        .char-bounce { animation: walkBounce 0.5s ease-in-out infinite alternate; }
        .leg-swing-f { animation: legFront 0.5s linear infinite alternate; }
        .leg-swing-b { animation: legBack 0.5s linear infinite alternate; }

        @keyframes walkBounce { 0% { transform: translateY(0); } 100% { transform: translateY(-12px); } }
        @keyframes legFront { 0% { transform: rotate(-20deg); } 100% { transform: rotate(30deg); } }
        @keyframes legBack { 0% { transform: rotate(30deg); } 100% { transform: rotate(-20deg); } }

        .text-shadow-sm { text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      `}</style>

      {/* Layer 1: Office Interior Background — slow parallax */}
      <div className="absolute top-0 left-0 h-full flex scene-bg-pan z-0" style={{ width: 'max-content' }}>
        {[...Array(6)].map((_, i) => (
          <img key={i} src="/scene-bg.png" alt="" draggable={false} className="h-full w-auto block flex-shrink-0 select-none" />
        ))}
      </div>

      {/* Layer 2: Foreground Furniture — faster parallax (chairs/desk align with carpet line per finished example) */}
      <div className="absolute top-0 left-0 h-full flex scene-objects-pan z-10" style={{ width: 'max-content' }}>
        {[...Array(6)].map((_, i) => (
          <img key={i} src="/objects.png" alt="" draggable={false} className="h-full w-auto block flex-shrink-0 select-none" />
        ))}
      </div>

      {/* Layer 3: Characters — anchored on the carpet, in front of furniture */}
      <div className="absolute bottom-[6%] md:bottom-[8%] w-full h-[180px] md:h-[220px] pointer-events-auto flex items-end justify-center z-50">
        {members.map((member, index) => {
          const delay = index * -0.4;
          // Use CSS variable so we can swap offset between mobile/desktop without re-render
          const indexOffset = (index - (members.length - 1) / 2);
          const zIndex = 50 - index;
          const scale = 1 - (Math.abs(index - (members.length - 1) / 2) * 0.05);

          return (
            <div
              key={member.id}
              onClick={() => onMemberClick(member)}
              className="absolute bottom-8 md:bottom-10 flex flex-col items-center cursor-pointer transition-transform hover:scale-110"
              style={{
                transform: `translateX(${indexOffset * charOffset}px) scale(${scale})`,
                zIndex
              }}
            >
              {/* Speech Bubble */}
              <div className="absolute -top-12 md:-top-16 bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-md border border-gray-100 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-500 whitespace-nowrap text-center">
                 <div className="text-[10px] md:text-sm font-black text-[#4e5968] max-w-[110px] md:max-w-[200px] truncate">"{member.intro || '안녕!'}"</div>
                 <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b border-r border-gray-100"></div>
              </div>

              {/* Character Wrapper */}
              <div className="relative w-[64px] h-[80px] md:w-[110px] md:h-[130px] char-bounce transition-all" style={{ animationDelay: `${delay}s` }}>

                <div className="absolute top-2 md:top-3 -left-3 md:-left-5 w-10 md:w-16 h-12 md:h-20 rounded-xl md:rounded-2xl shadow-sm z-0" style={{ backgroundColor: getBackpackColor(member.role) }}></div>

                <div className="absolute inset-0 rounded-[32px] md:rounded-[45px] shadow-[inset_0_-8px_0_rgba(0,0,0,0.1)] z-10 overflow-hidden" style={{ backgroundColor: getRoleColor(member.role) }}>
                  <div className="absolute bottom-[-5px] right-[-10px] w-[55px] md:w-[90px] h-[65px] md:h-[110px] bg-white rounded-[30px] md:rounded-[40px]"></div>

                  {member.role === 'PL' && <div className="absolute -top-1 right-0 w-full h-6 md:h-10 bg-yellow-400 rounded-t-full z-20 shadow-sm"></div>}

                  <div className="absolute top-5 md:top-8 right-3 md:right-6 flex gap-2 md:gap-3 z-20">
                    <div className="w-1.5 h-2.5 md:w-3 md:h-4 bg-[#191f28] rounded-full"></div>
                    <div className="w-1.5 h-2.5 md:w-3 md:h-4 bg-[#191f28] rounded-full"></div>
                  </div>

                  <div className="absolute top-7 md:top-11 -right-1 w-5 md:w-8 h-3.5 md:h-6 bg-[#FFB300] rounded-full shadow-sm z-20 border-b-2 border-orange-500/30"></div>

                  <div className="absolute top-7 md:top-11 right-7 md:right-12 w-2.5 md:w-3.5 h-1.5 md:h-2 bg-pink-300 rounded-full opacity-80 z-20"></div>
                </div>

                <div className="absolute top-10 md:top-14 left-1 md:left-2 w-8 md:w-14 h-4 md:h-7 rounded-full z-20 origin-left shadow-sm leg-swing-b" style={{ backgroundColor: getRoleColor(member.role), animationDelay: `${delay}s` }}></div>

                <div className="absolute -bottom-2 left-2.5 md:left-4 w-5 md:w-7 h-3.5 md:h-5 bg-[#FFB300] rounded-full origin-top z-0 leg-swing-b" style={{ animationDelay: `${delay}s` }}></div>

                <div className="absolute -bottom-2 right-2.5 md:right-4 w-5 md:w-7 h-3.5 md:h-5 bg-[#FFB300] rounded-full origin-top z-20 leg-swing-f" style={{ animationDelay: `${delay}s` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Responsive Modal Components ---
const BottomSheet = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center pointer-events-auto p-0 md:p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-md md:max-w-2xl h-[85vh] md:h-auto md:max-h-[85vh] bg-[#f5f7fa] rounded-t-[32px] md:rounded-[40px] shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 flex flex-col transition-all">
        <div className="w-full flex justify-center py-3 md:hidden"><div className="w-10 h-1.5 bg-gray-300 rounded-full"></div></div>

        <div className="px-5 md:px-8 py-4 md:py-6 flex justify-between items-center border-b border-gray-100">
           <h3 className="text-xl md:text-3xl font-black text-[#191f28]">{title}</h3>
           <button onClick={onClose} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 transition-colors"><X size={18}/></button>
        </div>
        <div className="p-5 md:p-8 overflow-y-auto flex-1 pb-20 md:pb-8">
           {children}
        </div>
      </div>
    </div>
  );
};

const MemberDetailModal = ({ member, onClose }) => {
  if (!member) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center pointer-events-auto p-0 md:p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-md md:max-w-3xl h-[92vh] md:h-auto md:max-h-[90vh] bg-white rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-y-auto animate-in slide-in-from-bottom md:zoom-in-95 pb-8 md:pb-12 transition-all">
        <div className="sticky top-0 w-full flex justify-center py-3 bg-gradient-to-b from-white via-white to-transparent z-10 md:hidden"><div className="w-10 h-1.5 bg-gray-300 rounded-full"></div></div>

        <button onClick={onClose} className="absolute top-4 md:top-8 right-4 md:right-8 p-2.5 md:p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 z-20 transition-colors"><X size={20} /></button>

        <div className="px-5 md:px-12 pt-2 md:pt-12 space-y-6 md:space-y-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-gradient-to-br from-[#3182f6] to-[#00c471] rounded-3xl md:rounded-[40px] flex items-center justify-center text-white text-3xl md:text-5xl font-black shadow-lg">{member.name[0]}</div>
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2 flex-wrap">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight">{member.name}</h2>
                <span className="px-2.5 py-1 md:px-3 md:py-1.5 bg-blue-50 text-[#3182f6] rounded-lg md:rounded-xl text-xs md:text-sm font-black">{member.role}</span>
              </div>
              <p className="text-sm md:text-lg font-bold text-gray-400 mb-3 md:mb-4">{member.generation}</p>

              <div className="flex flex-wrap gap-2 md:gap-3">
                 {member.phone && <a href={`tel:${member.phone}`} className="px-3 md:px-4 py-2 md:py-2.5 bg-gray-50 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm text-[#4e5968] hover:bg-gray-100 transition-colors"><Phone size={14}/> 전화</a>}
                 {member.snsLink && <a href={member.snsLink.startsWith('http') ? member.snsLink : `https://${member.snsLink}`} target="_blank" rel="noreferrer" className="px-3 md:px-4 py-2 md:py-2.5 bg-pink-50 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm text-[#e1306c] hover:bg-pink-100 transition-colors"><Instagram size={14}/> SNS</a>}
              </div>
            </div>
          </div>

          {member.portfolioLinks?.length > 0 && (
            <div className="space-y-2 md:space-y-3">
              <h4 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">포트폴리오</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {member.portfolioLinks.map((link, i) => (
                  <a key={i} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-[#4e5968] hover:bg-gray-100 transition-colors">
                    <LinkIcon size={14} className="text-[#3182f6] shrink-0"/><span className="truncate">{link}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 md:space-y-4">
             <h4 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">대표 작업물</h4>
             <div className="flex gap-3 md:gap-4 overflow-x-auto snap-x scrollbar-hide pb-2 -mx-5 px-5 md:mx-0 md:px-0">
               {member.workItems.map((item, i) => (
                 <div key={i} className="flex-shrink-0 w-[220px] md:w-[320px] bg-gray-50 rounded-2xl md:rounded-[28px] overflow-hidden snap-start shadow-sm border border-gray-100">
                    <img src={item.url} className="w-full h-36 md:h-52 object-cover" />
                    <div className="p-4 md:p-6 text-xs md:text-sm font-bold text-[#4e5968]">{item.description || '설명 없음'}</div>
                 </div>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-3 md:space-y-4">
               <h4 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">작업 성향 & 리듬</h4>
               <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                  {member.workStyles.map(s => <span key={s} className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 rounded-lg md:rounded-xl text-xs md:text-sm font-black text-[#4e5968]">#{s}</span>)}
               </div>
               <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl text-center"><Sun size={16} className="mx-auto mb-1.5 md:mb-2 text-orange-400"/><span className="text-xs md:text-sm font-black">{member.schedule.start}</span></div>
                  <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl text-center"><Moon size={16} className="mx-auto mb-1.5 md:mb-2 text-blue-500"/><span className="text-xs md:text-sm font-black">{member.schedule.night}</span></div>
                  <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl text-center"><Home size={16} className="mx-auto mb-1.5 md:mb-2 text-green-500"/><span className="text-xs md:text-sm font-black">{member.schedule.place}</span></div>
               </div>
            </div>

            <div className="space-y-3 md:space-y-4">
               <h4 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest">협업 약속</h4>
               <div className="space-y-2 md:space-y-3">
                 <div className="p-4 md:p-5 bg-red-50/50 rounded-2xl md:rounded-[24px] border border-red-100">
                   <h5 className="text-[10px] md:text-[11px] font-black text-red-400 mb-1.5 md:mb-2 flex items-center gap-1.5"><Heart size={12}/> 추구하는 가치</h5>
                   <p className="text-xs md:text-sm font-bold text-[#4e5968]">{member.pursuits || '-'}</p>
                 </div>
                 <div className="p-4 md:p-5 bg-gray-50 rounded-2xl md:rounded-[24px] border border-gray-100">
                   <h5 className="text-[10px] md:text-[11px] font-black text-gray-400 mb-1.5 md:mb-2 flex items-center gap-1.5"><Ban size={12}/> 지양하는 방식</h5>
                   <p className="text-xs md:text-sm font-bold text-[#4e5968]">{member.avoid || '-'}</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [view, setView] = useState(VIEWS.LANDING);
  const [team, setTeam] = useState({ id: '', name: '', category: PROJECT_CATEGORIES[0], targetSize: 4, members: [] });
  const [step, setStep] = useState(1);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef(null);

  const [showMembersSheet, setShowMembersSheet] = useState(false);
  const [showRulesSheet, setShowRulesSheet] = useState(false);
  const [showJourneySheet, setShowJourneySheet] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '', role: 'UX', generation: '34기', phone: '', snsLink: '',
    portfolioLinks: [], workItems: [], workStyles: [], styleReasons: {},
    researchTopics: [], researchSubject: '',
    schedule: { start: '오전', night: '비선호', place: '출퇴근' },
    pursuits: '', avoid: '', intro: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const teamId = params.get('teamId');
    if (teamId) {
      const localTeam = getTeamFromLocal(teamId);
      if (localTeam) {
        setTeam(localTeam);
        setView(VIEWS.DASHBOARD);
      } else {
        setTeam({ id: teamId, name: '초대받은 프로젝트', category: '파운데이션', targetSize: 4, members: [] });
      }
    }
  }, []);

  const handleCreateTeam = () => {
    try {
      const teamId = crypto.randomUUID();
      const newTeam = {
        id: teamId,
        name: team.name,
        category: team.category,
        targetSize: team.targetSize || 4,
        members: [],
        createdAt: Date.now()
      };
      saveTeamToLocal(newTeam);

      const inviteUrl = getInviteUrl(teamId);
      copyToClipboard(inviteUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);

      try { window.history.pushState({}, '', `?teamId=${teamId}`); } catch(e){}

      setTeam(newTeam);
      setStep(1);
      setView(VIEWS.PROFILE_FORM);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfileSubmit = () => {
    const newUser = { ...profileData, id: crypto.randomUUID() };
    const updatedTeam = { ...team, members: [...team.members, newUser] };
    saveTeamToLocal(updatedTeam);
    setTeam(updatedTeam);
    setView(VIEWS.DASHBOARD);
  };

  const copyInviteLink = () => {
    const inviteUrl = getInviteUrl(team.id);
    copyToClipboard(inviteUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 300;
          let width = img.width;
          let height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.4);
          setProfileData(prev => ({ ...prev, workItems: [...prev.workItems, { url: compressedDataUrl, description: '' }] }));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const renderStep = () => {
    switch(step) {
      case 1: return (
        <div className="space-y-7 md:space-y-10 animate-in slide-in-from-right-4 duration-500 pb-6 md:pb-10">
          <header>
            <h2 className="text-2xl md:text-4xl font-black mb-1.5 md:mb-2 tracking-tight">당신에 대해 알려주세요</h2>
            <p className="text-[#8b95a1] text-sm md:text-lg font-bold">협업 멤버들에게 공유될 정보를 구성합니다.</p>
          </header>
          <div className="space-y-6 md:space-y-8">
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">이름</label>
                <input value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full p-3.5 md:p-5 bg-[#f2f4f6] rounded-2xl md:rounded-[22px] font-bold text-sm md:text-base outline-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="성함" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">기수</label>
                <div className="relative">
                  <select value={profileData.generation} onChange={e => setProfileData({...profileData, generation: e.target.value})} className="w-full p-3.5 md:p-5 bg-[#f2f4f6] rounded-2xl md:rounded-[22px] font-bold text-sm md:text-base outline-none appearance-none cursor-pointer">
                    {GENERATIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2 col-span-2 md:col-span-1">
                <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">역할</label>
                <div className="relative">
                  <select value={profileData.role} onChange={e => setProfileData({...profileData, role: e.target.value})} className="w-full p-3.5 md:p-5 bg-[#f2f4f6] rounded-2xl md:rounded-[22px] font-bold text-sm md:text-base outline-none appearance-none cursor-pointer">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Phone size={12}/> 연락처</label>
                <input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full p-3.5 md:p-5 bg-[#f2f4f6] rounded-2xl md:rounded-[22px] font-bold text-sm md:text-base outline-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="010-0000-0000" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Instagram size={12}/> SNS 링크</label>
                <input value={profileData.snsLink} onChange={e => setProfileData({...profileData, snsLink: e.target.value})} className="w-full p-3.5 md:p-5 bg-[#f2f4f6] rounded-2xl md:rounded-[22px] font-bold text-sm md:text-base outline-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="instagram.com/id" />
              </div>
            </div>

            <div className="space-y-2 md:space-y-3">
              <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><LinkIcon size={12}/> 포트폴리오 링크</label>
              {profileData.portfolioLinks.map((link, i) => (
                <div key={i} className="flex gap-2 animate-in slide-in-from-top-1">
                   <input value={link} onChange={e => {
                     const nl = [...profileData.portfolioLinks]; nl[i] = e.target.value; setProfileData({...profileData, portfolioLinks: nl});
                   }} className="flex-1 p-3.5 md:p-5 bg-[#f2f4f6] rounded-2xl md:rounded-[22px] font-bold text-sm md:text-base outline-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="https://..." />
                   <button onClick={() => setProfileData(p => ({...p, portfolioLinks: p.portfolioLinks.filter((_, idx) => idx !== i)}))} className="p-3.5 md:p-5 bg-red-50 text-red-500 rounded-xl md:rounded-2xl shrink-0"><Trash2 size={18}/></button>
                </div>
              ))}
              <Button variant="outline" className="w-full py-3 md:py-4 text-xs md:text-sm" onClick={() => setProfileData(p => ({...p, portfolioLinks: [...p.portfolioLinks, '']}))}><Plus size={14}/> 링크 추가하기</Button>
            </div>

            <div className="space-y-3 md:space-y-4">
              <label className="text-[10px] md:text-xs font-black text-gray-400 block uppercase tracking-widest ml-1">대표 작업물 ({profileData.workItems.length})</label>
              <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 md:pb-4 snap-x -mx-4 px-4 md:mx-0 md:px-0">
                 {profileData.workItems.map((item, i) => (
                   <div key={i} className="flex-shrink-0 w-[220px] md:w-[260px] p-3 md:p-4 bg-white rounded-3xl md:rounded-[32px] border border-gray-100 shadow-sm snap-start relative group">
                      <img src={item.url} className="h-28 md:h-36 w-full object-cover rounded-xl md:rounded-2xl mb-3 md:mb-4" />
                      <button onClick={() => setProfileData(p => ({...p, workItems: p.workItems.filter((_, idx) => idx !== i)}))} className="absolute top-5 right-5 md:top-6 md:right-6 p-1.5 md:p-2 bg-black/50 text-white rounded-full transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100"><X size={12}/></button>
                      <textarea value={item.description} onChange={e => {
                        const ni = [...profileData.workItems]; ni[i].description = e.target.value; setProfileData({...profileData, workItems: ni});
                      }} className="w-full p-2.5 md:p-3 bg-[#f2f4f6] rounded-xl md:rounded-2xl text-xs font-bold h-16 md:h-20 outline-none resize-none focus:border-[#3182f6]/20 transition-all border-2 border-transparent" placeholder="작업물에 대한 설명" />
                   </div>
                 ))}
                 <input type="file" ref={fileInputRef} onChange={e => handleFiles(e.target.files)} multiple accept="image/*" className="hidden" />
                 <div onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-[220px] md:w-[260px] h-[200px] md:h-[250px] rounded-3xl md:rounded-[32px] border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 md:gap-3 cursor-pointer hover:border-[#3182f6] hover:bg-white transition-all">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-gray-300 shadow-sm"><Upload size={20}/></div>
                    <span className="text-[11px] md:text-xs font-black text-gray-400">이미지 파일 추가</span>
                 </div>
              </div>
            </div>
          </div>
          <Button onClick={() => setStep(2)} className="w-full py-4 md:py-6 text-base md:text-xl shadow-lg shadow-blue-500/20" disabled={!profileData.name || profileData.workItems.length === 0}>다음으로</Button>
        </div>
      );
      case 2: return (
        <div className="space-y-8 md:space-y-12 animate-in slide-in-from-right-4 duration-500">
          <header>
            <h2 className="text-2xl md:text-4xl font-black mb-1.5 md:mb-2 tracking-tight">작업 성향과 리듬</h2>
            <p className="text-[#8b95a1] text-sm md:text-lg font-bold">팀원들이 당신을 어떻게 도와주면 좋을까요?</p>
          </header>
          <div className="space-y-7 md:space-y-10">
            <section className="space-y-4 md:space-y-5">
              <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">작업 성향 키워드</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                 {WORK_STYLE_TAGS.map(tag => (
                   <button key={tag} onClick={() => {
                     const exists = profileData.workStyles.includes(tag);
                     setProfileData({ ...profileData, workStyles: exists ? profileData.workStyles.filter(t => t !== tag) : [...profileData.workStyles, tag] });
                   }} className={`p-3.5 md:p-5 rounded-2xl md:rounded-[22px] font-black text-xs md:text-sm transition-all border-2 ${profileData.workStyles.includes(tag) ? 'bg-[#3182f6] border-transparent text-white shadow-lg shadow-blue-500/30' : 'bg-white border-gray-100 text-[#4e5968] hover:bg-gray-50'}`}>{tag}</button>
                 ))}
              </div>
              <div className="space-y-2.5 md:space-y-3 mt-4 md:mt-6">
                 {profileData.workStyles.map(tag => (
                   <div key={tag} className="animate-in slide-in-from-left-2">
                      <span className="text-[10px] md:text-[11px] font-black text-[#3182f6] ml-3 mb-1 block uppercase">Why #{tag}?</span>
                      <input value={profileData.styleReasons[tag] || ''} onChange={e => setProfileData({...profileData, styleReasons: {...profileData.styleReasons, [tag]: e.target.value}})} className="w-full p-3.5 md:p-5 bg-white border border-gray-100 rounded-2xl md:rounded-[22px] outline-none font-bold text-sm md:text-base shadow-sm focus:border-[#3182f6]/30 transition-all" placeholder="이유를 간단히 설명해주세요." />
                   </div>
                 ))}
              </div>
            </section>

            <section className="space-y-4 md:space-y-6">
              <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">나의 작업 리듬 선호도</label>
              <div className="space-y-6 md:space-y-8">
                 {[
                   { k: 'start', label: '시작 시간', opt: [{ v: '오전', d: '상쾌한 오전 시작', i: <Sun/> }, { v: '오후', d: '여유로운 오후 시작', i: <Coffee/> }] },
                   { k: 'night', label: '밤샘 여부', opt: [{ v: '선호', d: '밤의 집중력 선호', i: <Moon/> }, { v: '비선호', d: '컨디션 관리 중시', i: <X/> }] },
                   { k: 'place', label: '작업 장소', opt: [{ v: '출퇴근', d: '개인 공간/재택', i: <Building2/> }, { v: '멤박', d: '멤버십에서 자기', i: <Bed/> }] }
                 ].map(section => (
                   <div key={section.k} className="space-y-3 md:space-y-4">
                      <div className="flex items-center gap-2 text-sm md:text-base font-black text-[#191f28]">{section.label}</div>
                      <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                        {section.opt.map(opt => (
                          <button key={opt.v} onClick={() => setProfileData({...profileData, schedule: {...profileData.schedule, [section.k]: opt.v}})} className={`p-4 md:p-6 rounded-3xl md:rounded-[32px] text-left transition-all border-2 ${profileData.schedule[section.k] === opt.v ? 'bg-[#3182f6]/5 border-[#3182f6] shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                             <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-3 ${profileData.schedule[section.k] === opt.v ? 'bg-[#3182f6] text-white' : 'bg-gray-100 text-gray-400'}`}>{React.cloneElement(opt.i, { size: 18 })}</div>
                             <div className="font-black text-base md:text-xl">{opt.v}</div>
                             <div className="text-[10px] md:text-xs font-bold text-gray-400 mt-0.5 md:mt-1">{opt.d}</div>
                          </button>
                        ))}
                      </div>
                   </div>
                 ))}
              </div>
            </section>
          </div>
          <div className="flex gap-2.5 md:gap-3 pt-4 md:pt-6">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">이전</Button>
            <Button onClick={() => setStep(3)} className="flex-[2]">다음으로</Button>
          </div>
        </div>
      );
      case 3: return (
        <div className="space-y-8 md:space-y-12 animate-in slide-in-from-right-4 duration-500 pb-12 md:pb-20">
           <header>
             <h2 className="text-2xl md:text-4xl font-black mb-1.5 md:mb-2 tracking-tight">최종 협업 약속</h2>
             <p className="text-[#8b95a1] text-sm md:text-lg font-bold">기분 좋은 팀워크를 위해 꼭 지키고 싶은 점들입니다.</p>
           </header>
           <div className="space-y-6 md:space-y-8">
             {team.category === 'MEP' && (
               <div className="p-5 md:p-10 bg-white border-2 border-[#3182f6]/20 rounded-3xl md:rounded-[42px] space-y-5 md:space-y-8 shadow-sm">
                 <div className="flex items-center gap-3 md:gap-4">
                   <div className="w-11 h-11 md:w-14 md:h-14 bg-[#e8f3ff] rounded-xl md:rounded-2xl flex items-center justify-center text-[#3182f6] shrink-0"><Dna size={24} /></div>
                   <div>
                     <h3 className="text-lg md:text-2xl font-black tracking-tight">MEP 연구 관심사</h3>
                     <p className="text-[11px] md:text-sm font-bold text-gray-400">이번 프로젝트의 개인적 연구 목표입니다.</p>
                   </div>
                 </div>
                 <div className="flex flex-wrap gap-1.5 md:gap-2">{MEP_TOPICS.map(topic => (<button key={topic} onClick={() => { const nl = profileData.researchTopics.includes(topic) ? profileData.researchTopics.filter(t => t !== topic) : [...profileData.researchTopics, topic]; setProfileData({...profileData, researchTopics: nl}); }} className={`px-4 py-2 md:px-6 md:py-3 rounded-full text-xs md:text-sm font-black transition-all ${profileData.researchTopics.includes(topic) ? 'bg-[#3182f6] text-white shadow-md' : 'bg-[#f2f4f6] text-[#8b95a1]'}`}>{topic}</button>))}</div>
                 <textarea value={profileData.researchSubject} onChange={e => setProfileData({...profileData, researchSubject: e.target.value})} className="w-full p-4 md:p-8 bg-[#f2f4f6] rounded-2xl md:rounded-[32px] outline-none font-bold text-sm md:text-xl min-h-[120px] md:min-h-[160px] resize-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="구체적인 연구 주제를 적어주세요." />
               </div>
             )}
             <div className="space-y-3 md:space-y-4">
               <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Heart size={14} className="text-red-400"/> 추구하는 협업 가치</label>
               <textarea value={profileData.pursuits} onChange={e => setProfileData({...profileData, pursuits: e.target.value})} className="w-full p-4 md:p-8 bg-[#f2f4f6] rounded-2xl md:rounded-[32px] outline-none font-bold text-sm md:text-lg min-h-[120px] md:min-h-[160px] resize-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="예: 속도보다 논리적인 완결성을 중요하게 생각합니다." />
             </div>
             <div className="space-y-3 md:space-y-4">
               <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Ban size={14} className="text-gray-400"/> 지양하는 협업 방식 (Don't)</label>
               <textarea value={profileData.avoid} onChange={e => setProfileData({...profileData, avoid: e.target.value})} className="w-full p-4 md:p-8 bg-[#f2f4f6] rounded-2xl md:rounded-[32px] outline-none font-bold text-sm md:text-lg min-h-[120px] md:min-h-[160px] resize-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="예: 사전 공유 없는 불참이나 자정 이후의 급한 연락 등" />
             </div>
             <div className="space-y-3 md:space-y-4">
               <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest ml-1">팀원들에게 한마디</label>
               <input value={profileData.intro} onChange={e => setProfileData({...profileData, intro: e.target.value})} className="w-full p-4 md:p-6 bg-[#f2f4f6] rounded-2xl md:rounded-[24px] outline-none font-bold text-sm md:text-lg shadow-inner border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="안녕하세요! 한 학기 잘 지내봐요!" />
             </div>
           </div>
           <div className="flex gap-2.5 md:gap-3 pt-6 md:pt-10">
             <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">이전</Button>
             <Button onClick={handleProfileSubmit} className="flex-[2] py-4 md:py-6 text-base md:text-2xl shadow-2xl shadow-blue-500/40">팀 아지트로 합류하기 <ArrowRight size={18}/></Button>
           </div>
        </div>
      );
      default: return null;
    }
  };

  const targetMembers = team.targetSize || 4;
  const currentMembers = team.members ? team.members.length : 0;
  const isAligned = currentMembers >= targetMembers;

  return (
    <div className="min-h-screen bg-[#f5f7fa] font-sans selection:bg-[#3182f6]/20 text-[#191f28]">

      {isCopied && (
        <div className="fixed top-4 md:top-16 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top-6 duration-500">
           <div className="bg-[#191f28] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-full flex items-center gap-2 shadow-2xl">
              <div className="w-4 h-4 md:w-5 md:h-5 bg-[#00c471] rounded-full flex items-center justify-center"><Check size={10} strokeWidth={4}/></div>
              <span className="text-xs md:text-sm font-black tracking-tight">복사 완료!</span>
           </div>
        </div>
      )}

      {view !== VIEWS.DASHBOARD && view !== VIEWS.LANDING && (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 py-3 md:py-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-[#3182f6] rounded-lg md:rounded-xl flex items-center justify-center text-white font-black italic text-sm md:text-base">A</div>
              <span className="font-black text-xl md:text-2xl tracking-tighter">Align</span>
            </div>
            {view === VIEWS.PROFILE_FORM && (
              <div className="flex gap-1.5 md:gap-2">
                 {[1,2,3].map(s => <div key={s} className={`w-6 md:w-8 h-1.5 rounded-full transition-colors ${step >= s ? 'bg-[#3182f6]' : 'bg-gray-100'}`}/>)}
              </div>
            )}
          </div>
        </nav>
      )}

      <main>
        {view === VIEWS.LANDING && (
          <div className="min-h-screen flex flex-col items-center justify-center p-5 md:p-6 text-center max-w-3xl mx-auto">
             <div className="bg-[#e8f3ff] text-[#3182f6] px-3.5 md:px-5 py-1.5 md:py-2 rounded-full font-black text-[10px] md:text-xs mb-5 md:mb-8 tracking-[0.15em] md:tracking-[0.2em] uppercase">Samsung Design Membership Team OS</div>
             <h1 className="text-[2.5rem] leading-[1.05] md:text-7xl lg:text-8xl font-black mb-5 md:mb-8 tracking-tighter text-[#191f28]">첫날의 얼라인을<br /><span className="text-[#3182f6]">실전</span>으로</h1>
             <p className="text-[#4e5968] text-base md:text-2xl mb-8 md:mb-12 font-medium leading-relaxed">삼성디자인멤버십 팀 프로젝트의 시작.<br />어색한 자기소개는 줄이고,<br className="md:hidden" /> 바로 일할 수 있는 환경을 만드세요.</p>
             <Button onClick={() => setView(VIEWS.SETUP_TEAM)} className="text-base md:text-2xl px-7 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-[32px] shadow-2xl shadow-blue-500/40 w-full md:w-auto">지금 팀 생성하기 <ArrowRight size={20} className="md:hidden" /><ArrowRight size={28} className="hidden md:inline" /></Button>
          </div>
        )}

        {view === VIEWS.SETUP_TEAM && (
          <div className="max-w-xl mx-auto py-8 md:py-20 px-5 md:px-6 animate-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-3xl md:text-5xl font-black mb-7 md:mb-12 tracking-tight text-center">프로젝트 시작</h2>
            <div className="space-y-7 md:space-y-12">
              <div className="space-y-3 md:space-y-5">
                <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.15em] md:tracking-[0.2em] ml-2">Category</label>
                <div className="relative">
                  <select value={team.category} onChange={e => setTeam({...team, category: e.target.value})} className="w-full p-4 md:p-7 bg-[#f2f4f6] rounded-2xl md:rounded-[32px] outline-none text-base md:text-2xl font-black appearance-none focus:ring-8 focus:ring-[#3182f6]/5 transition-all">
                    {PROJECT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                </div>
              </div>

              <div className="space-y-3 md:space-y-5">
                <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.15em] md:tracking-[0.2em] ml-2">Team Size</label>
                <div className="relative">
                  <select value={team.targetSize || 4} onChange={e => setTeam({...team, targetSize: Number(e.target.value)})} className="w-full p-4 md:p-7 bg-[#f2f4f6] rounded-2xl md:rounded-[32px] outline-none text-base md:text-2xl font-black appearance-none focus:ring-8 focus:ring-[#3182f6]/5 transition-all">
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => <option key={num} value={num}>{num}명</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                </div>
              </div>

              <div className="space-y-3 md:space-y-5">
                <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.15em] md:tracking-[0.2em] ml-2">Project Name</label>
                <textarea className="w-full p-5 md:p-10 bg-[#f2f4f6] rounded-3xl md:rounded-[48px] outline-none text-base md:text-2xl font-bold min-h-[120px] md:min-h-[200px] resize-none focus:ring-8 focus:ring-[#3182f6]/5 transition-all border-none" placeholder="팀 이름 또는 구체적인 목표를 입력하세요" value={team.name} onChange={e => setTeam({...team, name: e.target.value})} />
              </div>
              <Button onClick={handleCreateTeam} className="w-full py-5 md:py-8 text-base md:text-2xl shadow-2xl shadow-blue-500/20" disabled={!team.name}>초대 링크 생성하고 프로필 작성 <ArrowRight size={18}/></Button>
            </div>
          </div>
        )}

        {view === VIEWS.PROFILE_FORM && (
          <div className="max-w-7xl mx-auto py-6 md:py-12 px-4 md:px-8 flex flex-col lg:flex-row gap-8 md:gap-16">
            <div className="flex-1">{renderStep()}</div>
            <div className="hidden lg:block w-[380px]">
              <div className="sticky top-32 space-y-6">
                <div className="flex items-center gap-3 ml-2">
                   <Sparkles size={20} className="text-[#3182f6]"/>
                   <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Real-time Card View</span>
                </div>
                <Card className="overflow-hidden p-0 shadow-[0_32px_80px_rgba(0,0,0,0.1)] border-none ring-1 ring-gray-100 scale-100 hover:scale-[1.02] transition-all duration-500">
                  <div className="h-64 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                    {profileData.workItems.length > 0 ? (
                      <><img src={profileData.workItems[0].url} className="w-full h-full object-cover" alt="preview" /><div className="absolute top-6 left-6 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl text-xs font-black shadow-lg">{profileData.role}</div></>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-gray-300"><FileImage size={56} strokeWidth={1.5} className="opacity-50" /><span className="text-sm font-black tracking-tight">작업물 이미지가 여기에 표시됩니다.</span></div>
                    )}
                  </div>
                  <div className="p-10">
                    <div className="flex justify-between items-start mb-4"><h4 className="text-3xl font-black tracking-tight">{profileData.name || "이름"}</h4><span className="text-xs font-black text-[#3182f6] px-3 py-1.5 bg-blue-50 rounded-xl">{profileData.generation}</span></div>
                    <div className="flex gap-3 mb-6 opacity-40">{profileData.phone && <Phone size={14}/>}{profileData.portfolioLinks.filter(l=>l).length > 0 && <LinkIcon size={14}/>}</div>
                    <p className="text-lg text-gray-500 font-bold italic line-clamp-3 leading-relaxed">"{profileData.workItems[0]?.description || '작업물에 대한 설명이 여기에 요약되어 표시됩니다.'}"</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {view === VIEWS.DASHBOARD && (
          <div className="fixed inset-0 w-full h-full bg-[#8FCB81] overflow-hidden flex justify-center">

            <FinchWalkingScene members={team.members} onMemberClick={setSelectedMember} />

            <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />

            <BottomSheet isOpen={showJourneySheet} onClose={() => setShowJourneySheet(false)} title="우리의 여정 (Quest)">
              <div className="space-y-5 md:space-y-6 relative">
                 <div className="absolute left-[23px] md:left-[27px] top-6 bottom-10 w-0.5 bg-gray-200 z-0"></div>

                 <div className="relative z-10 flex gap-3 md:gap-4">
                   <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#00c471] text-white flex items-center justify-center shrink-0 border-4 border-white shadow-sm"><MapPinned size={20}/></div>
                   <div className="pt-2.5 md:pt-3">
                     <h4 className="font-black text-base md:text-lg text-gray-400 line-through">프로젝트 아지트 생성</h4>
                   </div>
                 </div>

                 <div className="relative z-10 flex gap-3 md:gap-4">
                   <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${isAligned ? 'bg-[#00c471]' : 'bg-[#3182f6]'} text-white flex items-center justify-center shrink-0 border-4 border-white shadow-sm`}>
                     {isAligned ? <CheckCircle2 size={20}/> : <Users size={20}/>}
                   </div>
                   <div className="pt-1.5 md:pt-2 flex-1">
                     <h4 className={`font-black text-base md:text-lg mb-1 ${isAligned ? 'text-gray-400 line-through' : 'text-[#191f28]'}`}>팀원 합류 ({currentMembers}/{targetMembers})</h4>
                     {!isAligned && (
                       <button onClick={copyInviteLink} className="mt-1.5 md:mt-2 px-3.5 md:px-4 py-2 bg-blue-50 text-[#3182f6] rounded-lg md:rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors">
                         <Plus size={14}/> 초대 링크 복사하기
                       </button>
                     )}
                   </div>
                 </div>

                 <div className="relative z-10 flex gap-3 md:gap-4">
                   <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${isAligned ? 'bg-[#3182f6]' : 'bg-gray-100 text-gray-400'} text-white flex items-center justify-center shrink-0 border-4 border-white shadow-sm`}>
                     <Heart size={20}/>
                   </div>
                   <div className="pt-1.5 md:pt-2 flex-1">
                     <h4 className={`font-black text-base md:text-lg mb-1 ${isAligned ? 'text-[#191f28]' : 'text-gray-400'}`}>그라운드 룰 숙지하기</h4>
                     <button onClick={() => { setShowJourneySheet(false); setShowRulesSheet(true); }} className={`mt-1.5 md:mt-2 px-3.5 md:px-4 py-2 rounded-lg md:rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-colors ${isAligned ? 'bg-blue-50 text-[#3182f6] hover:bg-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                        팀원들의 약속 읽어보기
                     </button>
                   </div>
                 </div>

                 <div className="relative z-10 flex gap-3 md:gap-4">
                   <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                     <CalendarPlus size={20}/>
                   </div>
                   <div className="pt-1.5 md:pt-2 flex-1">
                     <h4 className="font-black text-base md:text-lg mb-1 text-gray-400">첫 킥오프 미팅 잡기</h4>
                     <p className="text-xs md:text-sm font-bold text-gray-400 mb-2 md:mb-3">모든 팀원이 얼라인되면 활성화됩니다.</p>
                     <button disabled={!isAligned} onClick={() => alert("캘린더 연동 기능이 준비 중입니다!")} className={`px-3.5 md:px-4 py-2 rounded-lg md:rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-colors ${isAligned ? 'bg-[#3182f6] text-white hover:bg-blue-600' : 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'}`}>
                        <CalendarPlus size={14}/> 미팅 일정 조율하기
                     </button>
                   </div>
                 </div>

                 <div className="relative z-10 flex gap-3 md:gap-4 opacity-50">
                   <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                     <Flag size={20}/>
                   </div>
                   <div className="pt-2.5 md:pt-3">
                     <h4 className="font-black text-base md:text-lg text-gray-400">본격적인 프로젝트 시작!</h4>
                   </div>
                 </div>
              </div>
            </BottomSheet>

            <BottomSheet isOpen={showMembersSheet} onClose={() => setShowMembersSheet(false)} title="팀원 목록">
              <div className="space-y-3 md:space-y-4">
                 {team.members.map(member => (
                   <div key={member.id} onClick={() => { setShowMembersSheet(false); setSelectedMember(member); }} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-2xl md:rounded-[24px] shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 active:scale-95 transition-all">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-[#3182f6] rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-lg md:text-2xl shrink-0">{member.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 md:mb-1"><span className="font-black text-base md:text-xl">{member.name}</span><span className="text-[10px] md:text-xs font-bold text-[#3182f6] bg-blue-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg">{member.role}</span></div>
                        <p className="text-xs md:text-sm font-bold text-gray-400 truncate">"{member.intro}"</p>
                      </div>
                      <ChevronRight className="text-gray-300 shrink-0" size={20}/>
                   </div>
                 ))}
                 <button onClick={copyInviteLink} className="w-full p-4 md:p-6 border-2 border-dashed border-gray-300 rounded-2xl md:rounded-[24px] flex items-center justify-center gap-2 text-gray-500 font-black text-sm md:text-base hover:bg-white transition-colors">
                    <Plus size={18}/> 팀원 더 초대하기
                 </button>
              </div>
            </BottomSheet>

            <BottomSheet isOpen={showRulesSheet} onClose={() => setShowRulesSheet(false)} title="우리의 협업 약속">
               <div className="space-y-5 md:space-y-6">
                 {team.members.map(member => (
                   <div key={member.id} className="p-5 md:p-6 bg-white rounded-2xl md:rounded-[28px] shadow-sm border border-gray-100 space-y-3 md:space-y-4">
                     <div className="flex items-center gap-2 mb-1 md:mb-2"><div className="w-6 h-6 bg-[#3182f6] rounded-full flex items-center justify-center text-white text-[10px] font-black">{member.name[0]}</div><span className="font-black text-sm md:text-base">{member.name} 님의 약속</span></div>
                     <div className="p-3.5 md:p-4 bg-red-50/50 rounded-xl md:rounded-2xl border border-red-100"><h4 className="text-[10px] md:text-xs font-black text-red-400 mb-1 flex items-center gap-1"><Heart size={12}/> 추구하는 가치</h4><p className="text-xs md:text-base font-bold text-[#4e5968]">{member.pursuits || '-'}</p></div>
                     <div className="p-3.5 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl"><h4 className="text-[10px] md:text-xs font-black text-gray-400 mb-1 flex items-center gap-1"><Ban size={12}/> 지양하는 방식</h4><p className="text-xs md:text-base font-bold text-[#4e5968]">{member.avoid || '-'}</p></div>
                   </div>
                 ))}
               </div>
            </BottomSheet>

            <div className="absolute top-3 md:top-8 w-[calc(100%-1.5rem)] md:w-[calc(100%-2rem)] max-w-sm md:max-w-md left-1/2 -translate-x-1/2 z-40">
              <div
                onClick={() => setShowJourneySheet(true)}
                className="w-full bg-white/80 backdrop-blur-2xl rounded-2xl md:rounded-[24px] p-3 md:p-3.5 shadow-xl border border-white/80 animate-in slide-in-from-top-4 duration-700 flex flex-col gap-2.5 md:gap-3 cursor-pointer hover:bg-white/90 hover:scale-[1.02] transition-all group"
              >
                <div className="flex justify-between items-center px-1">
                  <span className={`font-black text-[11px] md:text-sm uppercase tracking-wider flex items-center gap-2 ${isAligned ? 'text-[#00c471]' : 'text-[#3182f6]'}`}>
                    {isAligned ? 'Ready to Kick-off 🚀' : 'Team Building 🏃'}
                  </span>
                  <span className="text-gray-600 font-black text-[10px] md:text-[11px] bg-white/90 px-2 py-0.5 md:py-1 rounded-md md:rounded-lg shadow-sm">{currentMembers} / {targetMembers} 합류</span>
                </div>
                <div className="flex items-center gap-2.5 md:gap-3">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md border-2 border-white font-black shrink-0 transition-colors ${isAligned ? 'bg-gradient-to-br from-[#00c471] to-[#00a35c] text-white' : 'bg-gradient-to-br from-[#FFD54F] to-[#FFCA28] text-yellow-700'}`}>
                     {isAligned ? <Flag size={16} fill="currentColor"/> : <Zap size={16} fill="currentColor"/>}
                  </div>
                  <div className="flex-1 h-2.5 md:h-3 bg-black/10 rounded-full overflow-hidden shadow-inner">
                     <div className="h-full bg-gradient-to-r from-[#4FC3F7] to-[#81C784] rounded-full transition-all duration-1000 relative" style={{width: `${Math.min((currentMembers / targetMembers) * 100, 100)}%`}}>
                       <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/50 rounded-full"></div>
                     </div>
                  </div>
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-gray-400 group-hover:text-[#3182f6] transition-colors"><ChevronRight size={18}/></div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-[100px] md:bottom-[130px] w-full flex flex-col items-center z-40 pointer-events-none animate-in slide-in-from-bottom-8 duration-700 delay-300 px-4">
               <h3 className="text-white font-black text-sm md:text-lg text-shadow-sm mb-3 md:mb-4 text-center tracking-tight">
                  {isAligned ? '팀원들이 모두 모였어요! 여정을 확인해볼까요?' : '우리의 아지트가 점점 완성되고 있어요!'}
               </h3>
               <button onClick={() => setShowJourneySheet(true)} className={`pointer-events-auto px-5 md:px-6 py-2.5 md:py-3 backdrop-blur-md rounded-full text-white font-black text-xs md:text-sm transition-colors border shadow-lg flex items-center gap-2 ${isAligned ? 'bg-[#3182f6]/80 border-[#3182f6] hover:bg-[#3182f6]' : 'bg-black/30 border-white/20 hover:bg-black/40'}`}>
                 <MapPinned size={14}/> 다음 할 일(Quest) 보기
               </button>
            </div>

            <div className="absolute bottom-0 md:bottom-8 w-full max-w-md md:max-w-2xl lg:max-w-4xl h-20 md:h-28 bg-white/95 backdrop-blur-xl flex items-center justify-around px-2 md:px-10 rounded-t-[32px] md:rounded-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl z-50 border-t md:border border-white transition-all pb-[env(safe-area-inset-bottom)]">
               <button className="flex flex-col items-center gap-1 md:gap-1.5 p-2 w-14 md:w-24 opacity-100 transition-opacity">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gray-100 rounded-full flex items-center justify-center text-[#3182f6]"><Home size={20} fill="currentColor"/></div>
                  <span className="text-[10px] md:text-xs font-black text-[#3182f6] hidden md:block">Home</span>
               </button>
               <button onClick={() => setShowMembersSheet(true)} className="flex flex-col items-center gap-1 md:gap-1.5 p-2 w-14 md:w-24 opacity-50 hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-transparent hover:bg-gray-50 rounded-full flex items-center justify-center text-[#4e5968] transition-colors"><Users size={20} /></div>
                  <span className="text-[10px] md:text-xs font-black text-[#4e5968] hidden md:block">Members</span>
               </button>
               <button onClick={() => setShowRulesSheet(true)} className="flex flex-col items-center gap-1 md:gap-1.5 p-2 w-14 md:w-24 opacity-50 hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-transparent hover:bg-gray-50 rounded-full flex items-center justify-center text-[#4e5968] transition-colors"><Heart size={20} /></div>
                  <span className="text-[10px] md:text-xs font-black text-[#4e5968] hidden md:block">Rules</span>
               </button>
               <button onClick={copyInviteLink} className="flex flex-col items-center gap-1 md:gap-1.5 p-2 w-14 md:w-24 opacity-50 hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-transparent hover:bg-gray-50 rounded-full flex items-center justify-center text-[#4e5968] transition-colors"><Share2 size={20} /></div>
                  <span className="text-[10px] md:text-xs font-black text-[#4e5968] hidden md:block">Invite</span>
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
