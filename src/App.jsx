import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getTeam as dbGetTeam, createTeam as dbCreateTeam, addMember as dbAddMember, updateKickoff as dbUpdateKickoff, subscribeTeam } from './lib/teamDb';
import Cropper from 'react-easy-crop';
import {
  Users, LayoutDashboard, Map, Plus, ArrowRight, Clock, Zap, ChevronRight, User,
  ExternalLink, Sparkles, Image as ImageIcon, Heart, Ban, Upload, X, Sun, Moon,
  Coffee, Home, Building2, ChevronDown, FileImage, Calendar,
  MessageCircle, Dna, Phone, Instagram, Link as LinkIcon, Trash2, CheckCircle2,
  Copy, Share2, Check, Navigation, AlertCircle, Smile, MapPinned, Flag, CalendarPlus, Circle, Monitor, Bed, Camera, ZoomIn, ZoomOut
} from 'lucide-react';

// Vite handles base path (/ in dev, /gitsdm-vibecoding/ in prod build) — runtime asset URLs must be prefixed
const ASSET = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, '')}`;

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

const CHEER_POOL = (category) => [
  '우리 화이팅! 🔥',
  '잘해보자! 💪',
  '아자아자! ✨',
  `${category} 가보자! 🚀`,
  '우리팀 최고야! 🎉',
  '같이 하면 돼! 👊',
  '파이팅!! 💥',
  '믿어, 우리 할 수 있어! 🌟',
  '오늘도 화이팅! ⚡',
  '최강 팀! 🏆',
];
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

// --- Confetti burst (pure CSS, no library) ---
const CONFETTI_COLORS = ['#3182f6','#00c471','#ff8a00','#9b51e0','#FFD54F','#E91E63','#00BCD4','#FF7043'];
const Confetti = ({ active }) => {
  if (!active) return null;
  const pieces = Array.from({ length: 72 }, (_, i) => ({
    id: i,
    left: `${(i / 72) * 100 + (Math.sin(i * 2.4) * 6)}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${(i % 12) * 0.05}s`,
    duration: `${1.1 + (i % 7) * 0.18}s`,
    w: 6 + (i % 5),
    h: 4 + (i % 4),
    rot: (i * 37) % 360,
    shape: i % 3 === 0 ? '50%' : '2px', // circle or rect
  }));
  return (
    <div className="fixed inset-0 z-[450] pointer-events-none overflow-hidden">
      <style>{`
        @keyframes cfFall {
          0%   { transform: translateY(-10px) rotate(0deg) scaleX(1);   opacity: 1; }
          50%  { scaleX(-1); }
          100% { transform: translateY(105vh) rotate(600deg) scaleX(1); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.left, top: 0,
          width: p.w, height: p.h,
          backgroundColor: p.color,
          borderRadius: p.shape,
          transform: `rotate(${p.rot}deg)`,
          animation: `cfFall ${p.duration} ${p.delay} ease-in both`,
        }} />
      ))}
    </div>
  );
};

// --- Full Screen Finch Style Scene ---
const SPRITE_FRAME_COUNT = 5;
const SPRITE_ASPECT = 909 / 759; // h/w

// Per-role face-circle data: interior transparency detected via flood-fill (759×909 base)
// dia = diameter as fraction of charWidth; cx/cy normalized to sprite w/h
const ROLE_SPRITES = {
  ID: {
    dia: 0.260,
    frames: [
      { cx: 423/759, cy: 347/909 },
      { cx: 434/759, cy: 447/909 },
      { cx: 442/759, cy: 338/909 },
      { cx: 448/759, cy: 347/909 },
      { cx: 490/759, cy: 361/909 },
    ],
  },
  PL: {
    dia: 0.270,
    frames: [
      { cx: 396/759, cy: 380/909 },
      { cx: 430/759, cy: 490/909 },
      { cx: 395/759, cy: 373/909 },
      { cx: 400/759, cy: 387/909 },
      { cx: 397/759, cy: 394/909 },
    ],
  },
  UX: {
    dia: 0.275,
    frames: [
      { cx: 413/759, cy: 356/909 },
      { cx: 411/759, cy: 460/909 },
      { cx: 402/759, cy: 344/909 },
      { cx: 428/759, cy: 354/909 },
      { cx: 428/759, cy: 354/909 },
    ],
  },
  VD: {
    dia: 0.335,
    frames: [
      { cx: 400/759, cy: 327/909 },
      { cx: 419/759, cy: 374/909 },
      { cx: 379/759, cy: 324/909 },
      { cx: 397/759, cy: 327/909 },
      { cx: 390/759, cy: 327/909 },
    ],
  },
};

// Demo members shown on the landing screen preview
const DEMO_MEMBERS = [
  { id: 'demo-pl', name: '김민준', role: 'PL', photoUrl: ASSET('preview/PL.png'), intro: '반가워요! 👑' },
  { id: 'demo-id', name: '이서연', role: 'ID', photoUrl: ASSET('preview/ID.png'), intro: '잘부탁해요 🤖' },
  { id: 'demo-ux', name: '박지후', role: 'UX', photoUrl: ASSET('preview/UX.png'), intro: '같이 해봐요! 🧡' },
  { id: 'demo-vd', name: '최유나', role: 'VD', photoUrl: ASSET('preview/VD.png'), intro: '화이팅! 🌼' },
];

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];
const TIME_SLOTS = ['오전', '오후', '저녁'];

const getBestSlots = (availability) => {
  const counts = {};
  Object.values(availability || {}).forEach(slots => {
    (slots || []).forEach(slot => { counts[slot] = (counts[slot] || 0) + 1; });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([slot, count]) => ({ slot, count }));
};

const FinchWalkingScene = ({ members, onMemberClick, isJumping, cheerMessages }) => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Walk-cycle frame ticker — 160ms per frame ≈ 0.8s full cycle
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % SPRITE_FRAME_COUNT), 160);
    return () => clearInterval(id);
  }, []);

  // Preload all role sprites so frame swaps don't flicker
  useEffect(() => {
    for (const role of Object.keys(ROLE_SPRITES)) {
      for (let i = 1; i <= SPRITE_FRAME_COUNT; i++) {
        const img = new Image();
        img.src = ASSET(`avatar/${role}/${role}${i}.png`);
      }
    }
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

  // Tiered character sizing: mobile base is larger, scales down gracefully with more members
  // naturalSpacing ≈ naturalCharWidth * 0.8 → allows snug walking without overlap on small screens
  const naturalCharWidth = isMobile ? 110 : 150;
  const naturalSpacing   = isMobile ? 88  : 160;
  const usableWidth = viewportWidth * (isMobile ? 0.96 : 0.80);
  const minScale = isMobile ? 0.48 : 0.40;
  const requiredWidth = Math.max(1, members.length) * naturalSpacing;
  const fitScale = requiredWidth > usableWidth ? Math.max(minScale, usableWidth / requiredWidth) : 1;
  const charWidth  = naturalCharWidth * fitScale;
  const charHeight = charWidth * SPRITE_ASPECT;
  const charOffset = naturalSpacing * fitScale;

  return (
    <div className="absolute inset-0 bg-[#E8DDE0] overflow-hidden pointer-events-none">
      <style>{`
        .scene-bg-pan     { animation: sceneScroll 70s linear infinite; }
        .scene-objects-pan{ animation: sceneScroll 40s linear infinite; }
        @keyframes sceneScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes charJump {
          0%   { transform: translateY(0px)   scaleX(1)    scaleY(1);    }
          12%  { transform: translateY(-42px) scaleX(0.92) scaleY(1.08); }
          26%  { transform: translateY(0px)   scaleX(1.08) scaleY(0.94); }
          40%  { transform: translateY(-26px) scaleX(0.95) scaleY(1.05); }
          54%  { transform: translateY(0px)   scaleX(1.05) scaleY(0.96); }
          67%  { transform: translateY(-14px) scaleX(0.97) scaleY(1.03); }
          78%  { transform: translateY(0px)   scaleX(1.02) scaleY(0.99); }
          88%  { transform: translateY(-6px)  scaleX(1)    scaleY(1);    }
          100% { transform: translateY(0px)   scaleX(1)    scaleY(1);    }
        }
        .char-jumping { animation: charJump 0.95s ease-in-out both; transform-origin: bottom center; }
        @keyframes bubbleFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        .bubble-float { animation: bubbleFloat 3s ease-in-out infinite; }
      `}</style>

      {/* Layer 1: Office Interior Background — slow parallax */}
      <div className="absolute top-0 left-0 h-full flex scene-bg-pan z-0" style={{ width: 'max-content' }}>
        {[...Array(6)].map((_, i) => (
          <img key={i} src={ASSET('scene-bg.png')} alt="" draggable={false} className="h-full w-auto block flex-shrink-0 select-none" />
        ))}
      </div>

      {/* Layer 2: Foreground Furniture — faster parallax (chairs/desk align with carpet line per finished example) */}
      <div className="absolute top-0 left-0 h-full flex scene-objects-pan z-10" style={{ width: 'max-content' }}>
        {[...Array(6)].map((_, i) => (
          <img key={i} src={ASSET('objects.png')} alt="" draggable={false} className="h-full w-auto block flex-shrink-0 select-none" />
        ))}
      </div>

      {/* Layer 3: Characters — clear of tab nav (mobile 80px, desktop 144px from bottom) */}
      <div
        className="absolute w-full pointer-events-auto flex items-end justify-center z-50"
        style={{ height: `${charHeight + 70}px`, bottom: isMobile ? '100px' : '170px' }}
      >
        {members.map((member, index) => {
          const indexOffset = index - (members.length - 1) / 2;
          const zIndex = 50 - index;
          const frame = ((tick + index) % SPRITE_FRAME_COUNT) + 1;
          const ringColor = getRoleColor(member.role);
          const roleKey = ROLE_SPRITES[member.role] ? member.role : 'ID';
          const spriteInfo = ROLE_SPRITES[roleKey];
          const faceFrame = spriteInfo.frames[frame - 1];
          const photoSize = charWidth * spriteInfo.dia;
          const faceLeft = charWidth * faceFrame.cx - photoSize / 2;
          const faceTop = charHeight * faceFrame.cy - photoSize / 2;

          const cheerMsg = cheerMessages?.[member.id];
          const bubbleText = cheerMsg || `"${member.intro || '안녕!'}"`;
          const bubbleBg = cheerMsg ? 'bg-[#3182f6]' : 'bg-white';
          const bubbleText2 = cheerMsg ? 'text-white' : 'text-[#4e5968]';
          const bubbleBorder = cheerMsg ? 'border-[#3182f6]' : 'border-gray-100';
          const tailBg = cheerMsg ? 'bg-[#3182f6]' : 'bg-white';

          return (
            <div
              key={member.id}
              className="absolute bottom-0 flex flex-col items-center cursor-pointer"
              style={{ transform: `translateX(${indexOffset * charOffset}px)`, zIndex }}
            >
              {/* Inner wrapper gets jump animation; click still fires on outer */}
              <div
                className={`flex flex-col items-center hover:scale-110 transition-transform ${isJumping ? 'char-jumping' : ''}`}
                style={{ animationDelay: `${index * 55}ms` }}
                onClick={() => onMemberClick(member)}
              >
                {/* Speech Bubble */}
                <div
                  className={`absolute ${bubbleBg} ${bubbleBorder} border px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-md animate-in fade-in zoom-in duration-300 whitespace-nowrap text-center transition-all bubble-float`}
                  style={{ bottom: `${charHeight + 8}px`, animationDelay: `${(index * 0.55) % 2.5}s` }}
                >
                  <div
                    className={`text-[10px] md:text-sm font-bold ${bubbleText2} truncate`}
                    style={{ maxWidth: `${charWidth + 70}px` }}
                  >{bubbleText}</div>
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 ${tailBg} rotate-45 border-b border-r ${bubbleBorder}`}></div>
                </div>

                {/* Character: role-specific sprite + face photo locked to face-hole per frame */}
                <div
                  className="relative drop-shadow-[0_6px_8px_rgba(0,0,0,0.15)]"
                  style={{ width: `${charWidth}px`, height: `${charHeight}px` }}
                >
                  <div
                    className="absolute rounded-full overflow-hidden"
                    style={{ left: `${faceLeft}px`, top: `${faceTop}px`, width: `${photoSize}px`, height: `${photoSize}px` }}
                  >
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover select-none" draggable={false}/>
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-bold text-white"
                        style={{ backgroundColor: ringColor, fontSize: `${photoSize * 0.42}px` }}
                      >{member.name?.[0] || '?'}</div>
                    )}
                  </div>
                  <img
                    src={ASSET(`avatar/${roleKey}/${roleKey}${frame}.png`)}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                  />
                </div>
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
           <h3 className="text-xl md:text-3xl font-bold text-[#191f28]">{title}</h3>
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
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-3xl md:rounded-[40px] flex items-center justify-center text-white text-3xl md:text-5xl font-bold shadow-lg overflow-hidden bg-gradient-to-br from-[#3182f6] to-[#00c471] shrink-0">
              {member.photoUrl ? (
                <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span>{member.name[0]}</span>
              )}
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2 flex-wrap">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{member.name}</h2>
                <span className="px-2.5 py-1 md:px-3 md:py-1.5 bg-blue-50 text-[#3182f6] rounded-lg md:rounded-xl text-xs md:text-sm font-bold">{member.role}</span>
              </div>
              <p className="text-sm md:text-lg font-medium text-gray-400 mb-3 md:mb-4">{member.generation}</p>

              <div className="flex flex-wrap gap-2 md:gap-3">
                 {member.phone && <a href={`tel:${member.phone}`} className="px-3 md:px-4 py-2 md:py-2.5 bg-gray-50 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 font-medium text-xs md:text-sm text-[#4e5968] hover:bg-gray-100 transition-colors"><Phone size={14}/> 전화</a>}
                 {member.snsLink && <a href={member.snsLink.startsWith('http') ? member.snsLink : `https://${member.snsLink}`} target="_blank" rel="noreferrer" className="px-3 md:px-4 py-2 md:py-2.5 bg-pink-50 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 font-medium text-xs md:text-sm text-[#e1306c] hover:bg-pink-100 transition-colors"><Instagram size={14}/> SNS</a>}
              </div>
            </div>
          </div>

          {member.portfolioLinks?.length > 0 && (
            <div className="space-y-2 md:space-y-3">
              <h4 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">포트폴리오</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {member.portfolioLinks.map((link, i) => (
                  <a key={i} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium text-[#4e5968] hover:bg-gray-100 transition-colors">
                    <LinkIcon size={14} className="text-[#3182f6] shrink-0"/><span className="truncate">{link}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 md:space-y-4">
             <h4 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">대표 작업물</h4>
             <div className="flex gap-3 md:gap-4 overflow-x-auto snap-x scrollbar-hide pb-2 -mx-5 px-5 md:mx-0 md:px-0">
               {member.workItems.map((item, i) => (
                 <div key={i} className="flex-shrink-0 w-[220px] md:w-[320px] bg-gray-50 rounded-2xl md:rounded-[28px] overflow-hidden snap-start shadow-sm border border-gray-100">
                    <img src={item.url} className="w-full h-36 md:h-52 object-cover" />
                    <div className="p-4 md:p-6 text-xs md:text-sm font-medium text-[#4e5968]">{item.description || '설명 없음'}</div>
                 </div>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-3 md:space-y-4">
               <h4 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">작업 성향 & 리듬</h4>
               <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                  {member.workStyles.map(s => <span key={s} className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 rounded-lg md:rounded-xl text-xs md:text-sm font-bold text-[#4e5968]">#{s}</span>)}
               </div>
               <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl text-center"><Sun size={16} className="mx-auto mb-1.5 md:mb-2 text-orange-400"/><span className="text-xs md:text-sm font-bold">{member.schedule.start}</span></div>
                  <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl text-center"><Moon size={16} className="mx-auto mb-1.5 md:mb-2 text-blue-500"/><span className="text-xs md:text-sm font-bold">{member.schedule.night}</span></div>
                  <div className="p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl text-center"><Home size={16} className="mx-auto mb-1.5 md:mb-2 text-green-500"/><span className="text-xs md:text-sm font-bold">{member.schedule.place}</span></div>
               </div>
            </div>

            <div className="space-y-3 md:space-y-4">
               <h4 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">협업 약속</h4>
               <div className="space-y-2 md:space-y-3">
                 <div className="p-4 md:p-5 bg-red-50/50 rounded-2xl md:rounded-[24px] border border-red-100">
                   <h5 className="text-[10px] md:text-[11px] font-bold text-red-400 mb-1.5 md:mb-2 flex items-center gap-1.5"><Heart size={12}/> 추구하는 가치</h5>
                   <p className="text-xs md:text-sm font-medium text-[#4e5968]">{member.pursuits || '-'}</p>
                 </div>
                 <div className="p-4 md:p-5 bg-gray-50 rounded-2xl md:rounded-[24px] border border-gray-100">
                   <h5 className="text-[10px] md:text-[11px] font-bold text-gray-400 mb-1.5 md:mb-2 flex items-center gap-1.5"><Ban size={12}/> 지양하는 방식</h5>
                   <p className="text-xs md:text-sm font-medium text-[#4e5968]">{member.avoid || '-'}</p>
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
  const photoInputRef = useRef(null);

  const [showMembersSheet, setShowMembersSheet] = useState(false);
  const [showRulesSheet, setShowRulesSheet] = useState(false);
  const [showJourneySheet, setShowJourneySheet] = useState(false);
  const [showKickoffSheet, setShowKickoffSheet] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState(() => {
    try { return localStorage.getItem('ALIGN_CURRENT_MEMBER_ID') || null; } catch { return null; }
  });
  const [isJumping, setIsJumping] = useState(false);
  const [activeCheerMessages, setActiveCheerMessages] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);

  // Photo crop modal state
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [profileData, setProfileData] = useState({
    name: '', role: 'UX', generation: '34기', phone: '', snsLink: '',
    photoUrl: '',
    portfolioLinks: [], workItems: [], workStyles: [], styleReasons: {},
    researchTopics: [], researchSubject: '',
    schedule: { start: '오전', night: '비선호', place: '출퇴근' },
    pursuits: '', avoid: '', intro: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const teamId = params.get('teamId');
    if (!teamId) return;
    dbGetTeam(teamId).then(remoteTeam => {
      if (remoteTeam) {
        setTeam(remoteTeam);
        setView(VIEWS.DASHBOARD);
      } else {
        const localTeam = getTeamFromLocal(teamId);
        if (localTeam) {
          setTeam(localTeam);
          setView(VIEWS.DASHBOARD);
        } else {
          setTeam({ id: teamId, name: '초대받은 프로젝트', category: '파운데이션', targetSize: 4, members: [] });
        }
      }
    });
  }, []);

  // Real-time Supabase subscription while on dashboard
  useEffect(() => {
    if (view !== VIEWS.DASHBOARD || !team.id) return;
    const unsub = subscribeTeam(team.id, {
      onMembersChange: (members) => setTeam(prev => ({ ...prev, members })),
      onKickoffChange: (kickoff) => setTeam(prev => ({ ...prev, kickoff })),
    });
    return unsub;
  }, [view, team.id]);

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
      dbCreateTeam(newTeam);

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
    dbAddMember(team.id, newUser);
    try { localStorage.setItem('ALIGN_CURRENT_MEMBER_ID', newUser.id); } catch {}
    setCurrentMemberId(newUser.id);
    setView(VIEWS.DASHBOARD);
  };

  const copyInviteLink = () => {
    const inviteUrl = getInviteUrl(team.id);
    copyToClipboard(inviteUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // --- Kickoff scheduling ---
  const kickoff = team.kickoff || { availability: {}, proposal: null, agreements: {} };
  const myAvailability = (kickoff.availability || {})[currentMemberId] || [];
  const isKickoffAgreed = !!(kickoff.proposal &&
    team.members.length > 0 &&
    team.members.every(m => (kickoff.agreements || {})[m.id]));

  const toggleAvailability = (slot) => {
    if (!currentMemberId) return;
    const current = (kickoff.availability || {})[currentMemberId] || [];
    const updated = current.includes(slot) ? current.filter(s => s !== slot) : [...current, slot];
    const k = { ...kickoff, availability: { ...(kickoff.availability || {}), [currentMemberId]: updated } };
    const t = { ...team, kickoff: k };
    setTeam(t); saveTeamToLocal(t);
    dbUpdateKickoff(team.id, k);
  };

  const proposeSlot = (slot) => {
    const k = { ...kickoff, proposal: slot, agreements: {} };
    const t = { ...team, kickoff: k };
    setTeam(t); saveTeamToLocal(t);
    dbUpdateKickoff(team.id, k);
  };

  const agreeToProposal = () => {
    if (!currentMemberId) return;
    const k = { ...kickoff, agreements: { ...(kickoff.agreements || {}), [currentMemberId]: true } };
    const t = { ...team, kickoff: k };
    setTeam(t); saveTeamToLocal(t);
    dbUpdateKickoff(team.id, k);
  };

  const handleCheer = () => {
    if (isJumping || team.members.length === 0) return;
    const pool = CHEER_POOL(team.category || '');
    const msgs = {};
    // Each member gets a unique message (shuffle-assign)
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    team.members.forEach((m, i) => { msgs[m.id] = shuffled[i % shuffled.length]; });
    setActiveCheerMessages(msgs);
    setIsJumping(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2200);
    setTimeout(() => { setIsJumping(false); setActiveCheerMessages({}); }, 2600);
  };

  // Photo selection now opens an interactive crop modal instead of auto-cropping center.
  const handlePhotoUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropImageSrc(e.target.result);
      setCropZoom(1);
      setCropPosition({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_area, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const confirmCrop = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = cropImageSrc;
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    const SIZE = 320; // output diameter — enough for the small face overlay + detail modal avatar
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      img,
      croppedAreaPixels.x, croppedAreaPixels.y,
      croppedAreaPixels.width, croppedAreaPixels.height,
      0, 0, SIZE, SIZE
    );
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setProfileData(prev => ({ ...prev, photoUrl: dataUrl }));
    setCropImageSrc(null);
  };

  const handleFiles = (files) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // High-quality preview: cap longest edge at 1600px, 0.9 JPEG.
          // ~250-500KB per image; localStorage save fallback in saveTeamToLocal swaps to placeholder if quota hit.
          const MAX_SIZE = 1600;
          let width = img.width;
          let height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
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
            <h2 className="text-2xl md:text-4xl font-bold mb-1.5 md:mb-2 tracking-tight">당신에 대해 알려주세요</h2>
            <p className="text-[#8b95a1] text-sm md:text-lg font-medium">협업 멤버들에게 공유될 정보를 구성합니다.</p>
          </header>
          <div className="space-y-6 md:space-y-8">
            {/* Profile Photo Upload — overlay on walking character */}
            <div className="space-y-2.5 md:space-y-3">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <Camera size={12}/> 프로필 사진 <span className="text-gray-300 normal-case font-medium tracking-normal">— 본인 얼굴 권장 (캐릭터 얼굴로 사용됩니다)</span>
              </label>
              <input type="file" accept="image/*" ref={photoInputRef} onChange={e => { handlePhotoUpload(e.target.files?.[0]); e.target.value = ''; }} className="hidden" />
              <div className="flex items-center gap-4 md:gap-5 p-4 md:p-5 bg-[#f2f4f6] rounded-2xl md:rounded-[22px]">
                <button onClick={() => photoInputRef.current?.click()} className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-white overflow-hidden border-2 border-dashed border-gray-300 hover:border-[#3182f6] hover:bg-blue-50 transition-all shrink-0 flex items-center justify-center group">
                  {profileData.photoUrl ? (
                    <img src={profileData.photoUrl} alt="프로필 사진" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-0.5 text-gray-300 group-hover:text-[#3182f6] transition-colors">
                      <Camera size={24}/>
                      <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
                    </div>
                  )}
                </button>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-xs md:text-sm font-medium text-[#4e5968] leading-snug">
                    {profileData.photoUrl
                      ? '얼굴이 캐릭터의 동그란 얼굴 영역에 올라가요.'
                      : '얼굴이 가운데에 오도록 정사각형 사진을 올려주세요.'}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => photoInputRef.current?.click()} className="px-3 py-1.5 md:px-4 md:py-2 bg-[#3182f6] text-white rounded-lg md:rounded-xl font-bold text-[11px] md:text-xs">
                      {profileData.photoUrl ? '변경' : '사진 선택'}
                    </button>
                    {profileData.photoUrl && (
                      <button onClick={() => setProfileData({...profileData, photoUrl: ''})} className="px-3 py-1.5 md:px-4 md:py-2 bg-white text-gray-500 rounded-lg md:rounded-xl font-bold text-[11px] md:text-xs border border-gray-200 hover:bg-gray-50">
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">이름</label>
                <input value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full p-3.5 md:p-5 bg-[#f2f4f6] rounded-2xl md:rounded-[22px] font-medium text-sm md:text-base outline-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="성함" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">기수</label>
                <div className="relative">
                  <select value={profileData.generation} onChange={e => setProfileData({...profileData, generation: e.target.value})} className="w-full p-3.5 md:p-5 bg-[#f2f4f6] rounded-2xl md:rounded-[22px] font-medium text-sm md:text-base outline-none appearance-none cursor-pointer">
                    {GENERATIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2 col-span-2 md:col-span-1">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">역할</label>
                <div className="relative">
                  <select value={profileData.role} onChange={e => setProfileData({...profileData, role: e.target.value})} className="w-full p-3.5 md:p-5 bg-[#f2f4f6] rounded-2xl md:rounded-[22px] font-medium text-sm md:text-base outline-none appearance-none cursor-pointer">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Phone size={12}/> 연락처</label>
                <input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full p-3.5 md:p-5 bg-[#f2f4f6] rounded-2xl md:rounded-[22px] font-medium text-sm md:text-base outline-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="010-0000-0000" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Instagram size={12}/> SNS 링크</label>
                <input value={profileData.snsLink} onChange={e => setProfileData({...profileData, snsLink: e.target.value})} className="w-full p-3.5 md:p-5 bg-[#f2f4f6] rounded-2xl md:rounded-[22px] font-medium text-sm md:text-base outline-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="instagram.com/id" />
              </div>
            </div>

            <div className="space-y-2 md:space-y-3">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><LinkIcon size={12}/> 포트폴리오 링크</label>
              {profileData.portfolioLinks.map((link, i) => (
                <div key={i} className="flex gap-2 animate-in slide-in-from-top-1">
                   <input value={link} onChange={e => {
                     const nl = [...profileData.portfolioLinks]; nl[i] = e.target.value; setProfileData({...profileData, portfolioLinks: nl});
                   }} className="flex-1 p-3.5 md:p-5 bg-[#f2f4f6] rounded-2xl md:rounded-[22px] font-medium text-sm md:text-base outline-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="https://..." />
                   <button onClick={() => setProfileData(p => ({...p, portfolioLinks: p.portfolioLinks.filter((_, idx) => idx !== i)}))} className="p-3.5 md:p-5 bg-red-50 text-red-500 rounded-xl md:rounded-2xl shrink-0"><Trash2 size={18}/></button>
                </div>
              ))}
              <Button variant="outline" className="w-full py-3 md:py-4 text-xs md:text-sm" onClick={() => setProfileData(p => ({...p, portfolioLinks: [...p.portfolioLinks, '']}))}><Plus size={14}/> 링크 추가하기</Button>
            </div>

            <div className="space-y-3 md:space-y-4">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 block uppercase tracking-widest ml-1">대표 작업물 ({profileData.workItems.length})</label>
              <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 md:pb-4 snap-x -mx-4 px-4 md:mx-0 md:px-0">
                 {profileData.workItems.map((item, i) => (
                   <div key={i} className="flex-shrink-0 w-[220px] md:w-[260px] p-3 md:p-4 bg-white rounded-3xl md:rounded-[32px] border border-gray-100 shadow-sm snap-start relative group">
                      <img src={item.url} className="h-28 md:h-36 w-full object-cover rounded-xl md:rounded-2xl mb-3 md:mb-4" />
                      <button onClick={() => setProfileData(p => ({...p, workItems: p.workItems.filter((_, idx) => idx !== i)}))} className="absolute top-5 right-5 md:top-6 md:right-6 p-1.5 md:p-2 bg-black/50 text-white rounded-full transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100"><X size={12}/></button>
                      <textarea value={item.description} onChange={e => {
                        const ni = [...profileData.workItems]; ni[i].description = e.target.value; setProfileData({...profileData, workItems: ni});
                      }} className="w-full p-2.5 md:p-3 bg-[#f2f4f6] rounded-xl md:rounded-2xl text-xs font-medium h-16 md:h-20 outline-none resize-none focus:border-[#3182f6]/20 transition-all border-2 border-transparent" placeholder="작업물에 대한 설명" />
                   </div>
                 ))}
                 <input type="file" ref={fileInputRef} onChange={e => handleFiles(e.target.files)} multiple accept="image/*" className="hidden" />
                 <div onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 w-[220px] md:w-[260px] h-[200px] md:h-[250px] rounded-3xl md:rounded-[32px] border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 md:gap-3 cursor-pointer hover:border-[#3182f6] hover:bg-white transition-all">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-gray-300 shadow-sm"><Upload size={20}/></div>
                    <span className="text-[11px] md:text-xs font-bold text-gray-400">이미지 파일 추가</span>
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
            <h2 className="text-2xl md:text-4xl font-bold mb-1.5 md:mb-2 tracking-tight">작업 성향과 리듬</h2>
            <p className="text-[#8b95a1] text-sm md:text-lg font-medium">팀원들이 당신을 어떻게 도와주면 좋을까요?</p>
          </header>
          <div className="space-y-7 md:space-y-10">
            <section className="space-y-4 md:space-y-5">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">작업 성향 키워드</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                 {WORK_STYLE_TAGS.map(tag => (
                   <button key={tag} onClick={() => {
                     const exists = profileData.workStyles.includes(tag);
                     setProfileData({ ...profileData, workStyles: exists ? profileData.workStyles.filter(t => t !== tag) : [...profileData.workStyles, tag] });
                   }} className={`p-3.5 md:p-5 rounded-2xl md:rounded-[22px] font-bold text-xs md:text-sm transition-all border-2 ${profileData.workStyles.includes(tag) ? 'bg-[#3182f6] border-transparent text-white shadow-lg shadow-blue-500/30' : 'bg-white border-gray-100 text-[#4e5968] hover:bg-gray-50'}`}>{tag}</button>
                 ))}
              </div>
              <div className="space-y-2.5 md:space-y-3 mt-4 md:mt-6">
                 {profileData.workStyles.map(tag => (
                   <div key={tag} className="animate-in slide-in-from-left-2">
                      <span className="text-[10px] md:text-[11px] font-bold text-[#3182f6] ml-3 mb-1 block uppercase">Why #{tag}?</span>
                      <input value={profileData.styleReasons[tag] || ''} onChange={e => setProfileData({...profileData, styleReasons: {...profileData.styleReasons, [tag]: e.target.value}})} className="w-full p-3.5 md:p-5 bg-white border border-gray-100 rounded-2xl md:rounded-[22px] outline-none font-medium text-sm md:text-base shadow-sm focus:border-[#3182f6]/30 transition-all" placeholder="이유를 간단히 설명해주세요." />
                   </div>
                 ))}
              </div>
            </section>

            <section className="space-y-4 md:space-y-6">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">나의 작업 리듬 선호도</label>
              <div className="space-y-6 md:space-y-8">
                 {[
                   { k: 'start', label: '시작 시간', opt: [{ v: '오전', d: '상쾌한 오전 시작', i: <Sun/> }, { v: '오후', d: '여유로운 오후 시작', i: <Coffee/> }] },
                   { k: 'night', label: '밤샘 여부', opt: [{ v: '선호', d: '밤의 집중력 선호', i: <Moon/> }, { v: '비선호', d: '컨디션 관리 중시', i: <X/> }] },
                   { k: 'place', label: '작업 장소', opt: [{ v: '출퇴근', d: '개인 공간/재택', i: <Building2/> }, { v: '멤박', d: '멤버십에서 자기', i: <Bed/> }] }
                 ].map(section => (
                   <div key={section.k} className="space-y-3 md:space-y-4">
                      <div className="flex items-center gap-2 text-sm md:text-base font-bold text-[#191f28]">{section.label}</div>
                      <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                        {section.opt.map(opt => (
                          <button key={opt.v} onClick={() => setProfileData({...profileData, schedule: {...profileData.schedule, [section.k]: opt.v}})} className={`p-4 md:p-6 rounded-3xl md:rounded-[32px] text-left transition-all border-2 ${profileData.schedule[section.k] === opt.v ? 'bg-[#3182f6]/5 border-[#3182f6] shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                             <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-3 ${profileData.schedule[section.k] === opt.v ? 'bg-[#3182f6] text-white' : 'bg-gray-100 text-gray-400'}`}>{React.cloneElement(opt.i, { size: 18 })}</div>
                             <div className="font-bold text-base md:text-xl">{opt.v}</div>
                             <div className="text-[10px] md:text-xs font-medium text-gray-400 mt-0.5 md:mt-1">{opt.d}</div>
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
             <h2 className="text-2xl md:text-4xl font-bold mb-1.5 md:mb-2 tracking-tight">최종 협업 약속</h2>
             <p className="text-[#8b95a1] text-sm md:text-lg font-medium">기분 좋은 팀워크를 위해 꼭 지키고 싶은 점들입니다.</p>
           </header>
           <div className="space-y-6 md:space-y-8">
             {team.category === 'MEP' && (
               <div className="p-5 md:p-10 bg-white border-2 border-[#3182f6]/20 rounded-3xl md:rounded-[42px] space-y-5 md:space-y-8 shadow-sm">
                 <div className="flex items-center gap-3 md:gap-4">
                   <div className="w-11 h-11 md:w-14 md:h-14 bg-[#e8f3ff] rounded-xl md:rounded-2xl flex items-center justify-center text-[#3182f6] shrink-0"><Dna size={24} /></div>
                   <div>
                     <h3 className="text-lg md:text-2xl font-bold tracking-tight">MEP 연구 관심사</h3>
                     <p className="text-[11px] md:text-sm font-medium text-gray-400">이번 프로젝트의 개인적 연구 목표입니다.</p>
                   </div>
                 </div>
                 <div className="flex flex-wrap gap-1.5 md:gap-2">{MEP_TOPICS.map(topic => (<button key={topic} onClick={() => { const nl = profileData.researchTopics.includes(topic) ? profileData.researchTopics.filter(t => t !== topic) : [...profileData.researchTopics, topic]; setProfileData({...profileData, researchTopics: nl}); }} className={`px-4 py-2 md:px-6 md:py-3 rounded-full text-xs md:text-sm font-bold transition-all ${profileData.researchTopics.includes(topic) ? 'bg-[#3182f6] text-white shadow-md' : 'bg-[#f2f4f6] text-[#8b95a1]'}`}>{topic}</button>))}</div>
                 <textarea value={profileData.researchSubject} onChange={e => setProfileData({...profileData, researchSubject: e.target.value})} className="w-full p-4 md:p-8 bg-[#f2f4f6] rounded-2xl md:rounded-[32px] outline-none font-medium text-sm md:text-xl min-h-[120px] md:min-h-[160px] resize-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="구체적인 연구 주제를 적어주세요." />
               </div>
             )}
             <div className="space-y-3 md:space-y-4">
               <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Heart size={14} className="text-red-400"/> 추구하는 협업 가치</label>
               <textarea value={profileData.pursuits} onChange={e => setProfileData({...profileData, pursuits: e.target.value})} className="w-full p-4 md:p-8 bg-[#f2f4f6] rounded-2xl md:rounded-[32px] outline-none font-medium text-sm md:text-lg min-h-[120px] md:min-h-[160px] resize-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="예: 속도보다 논리적인 완결성을 중요하게 생각합니다." />
             </div>
             <div className="space-y-3 md:space-y-4">
               <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Ban size={14} className="text-gray-400"/> 지양하는 협업 방식 (Don't)</label>
               <textarea value={profileData.avoid} onChange={e => setProfileData({...profileData, avoid: e.target.value})} className="w-full p-4 md:p-8 bg-[#f2f4f6] rounded-2xl md:rounded-[32px] outline-none font-medium text-sm md:text-lg min-h-[120px] md:min-h-[160px] resize-none border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="예: 사전 공유 없는 불참이나 자정 이후의 급한 연락 등" />
             </div>
             <div className="space-y-3 md:space-y-4">
               <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">팀원들에게 한마디</label>
               <input value={profileData.intro} onChange={e => setProfileData({...profileData, intro: e.target.value})} className="w-full p-4 md:p-6 bg-[#f2f4f6] rounded-2xl md:rounded-[24px] outline-none font-medium text-sm md:text-lg shadow-inner border-2 border-transparent focus:border-[#3182f6]/20 transition-all" placeholder="안녕하세요! 한 학기 잘 지내봐요!" />
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

      {/* Photo Crop Modal */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-[600] bg-black/85 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center px-5 md:px-8 py-4 md:py-5 text-white">
            <div>
              <h3 className="text-lg md:text-xl font-bold tracking-tight">얼굴 위치 맞추기</h3>
              <p className="text-xs md:text-sm font-medium text-white/60 mt-0.5">드래그해서 위치 조정 · 핀치/슬라이더로 확대</p>
            </div>
            <button onClick={() => setCropImageSrc(null)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
              <X size={20}/>
            </button>
          </div>
          <div className="relative flex-1 min-h-0">
            <Cropper
              image={cropImageSrc}
              crop={cropPosition}
              zoom={cropZoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              minZoom={1}
              maxZoom={4}
              zoomSpeed={0.4}
              onCropChange={setCropPosition}
              onZoomChange={setCropZoom}
              onCropComplete={onCropComplete}
              cropSize={typeof window !== 'undefined' && window.innerWidth < 768 ? { width: 280, height: 280 } : { width: 360, height: 360 }}
              objectFit="contain"
            />
          </div>
          <div className="px-5 md:px-8 py-4 md:py-6 bg-black space-y-4 md:space-y-5">
            <div className="flex items-center gap-3">
              <ZoomOut size={18} className="text-white/60 shrink-0"/>
              <input
                type="range"
                min={1}
                max={4}
                step={0.05}
                value={cropZoom}
                onChange={e => setCropZoom(Number(e.target.value))}
                className="flex-1 accent-[#3182f6]"
              />
              <ZoomIn size={18} className="text-white/60 shrink-0"/>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCropImageSrc(null)} className="flex-1 py-3.5 md:py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm md:text-base transition-colors">
                취소
              </button>
              <button onClick={confirmCrop} className="flex-[2] py-3.5 md:py-4 bg-[#3182f6] hover:bg-[#1b64da] text-white rounded-2xl font-bold text-sm md:text-base transition-colors">
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {isCopied && (
        <div className="fixed top-4 md:top-16 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top-6 duration-500">
           <div className="bg-[#191f28] text-white px-4 md:px-6 py-2.5 md:py-3 rounded-full flex items-center gap-2 shadow-2xl">
              <div className="w-4 h-4 md:w-5 md:h-5 bg-[#00c471] rounded-full flex items-center justify-center"><Check size={10} strokeWidth={4}/></div>
              <span className="text-xs md:text-sm font-bold tracking-tight">복사 완료!</span>
           </div>
        </div>
      )}

      {view !== VIEWS.DASHBOARD && view !== VIEWS.LANDING && (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-6 py-3 md:py-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-[#3182f6] rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold italic text-sm md:text-base">A</div>
              <span className="font-bold text-xl md:text-2xl tracking-tighter">Align</span>
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
          <div className="fixed inset-0 overflow-hidden">
            {/* Layer 1: Live animated scene with 4 demo members */}
            <FinchWalkingScene
              members={DEMO_MEMBERS}
              onMemberClick={() => {}}
              isJumping={false}
              cheerMessages={{}}
            />

            {/* Layer 2: Gradient dim — dark top for text, fades to clear at bottom */}
            <div
              className="absolute inset-0 z-[60] pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, rgba(10,14,26,0.45) 0%, rgba(10,14,26,0.20) 40%, rgba(10,14,26,0.00) 70%)' }}
            />

            {/* Layer 3: Content — title top half / button bottom */}
            <div className="absolute inset-0 z-[70]">

              {/* Title + body — upper half, well above the walking characters */}
              <div className="absolute inset-x-0 top-0 h-[46%] flex flex-col items-center justify-center px-6 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                <h1
                  className="text-[2.6rem] leading-[1.05] md:text-6xl lg:text-7xl font-bold mb-3.5 md:mb-5 tracking-tighter text-[#e5e7eb]"
                  style={{ textShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
                >
                  첫날의 얼라인을<br />실전으로
                </h1>
                <p
                  className="text-[#d1d5db] text-sm md:text-base font-medium leading-relaxed max-w-[280px] md:max-w-sm"
                  style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                >
                  삼성디자인멤버십 팀 프로젝트의 시작.<br />
                  어색한 자기소개는 줄이고,<br />바로 일할 수 있는 환경을 만드세요.
                </p>
              </div>

              {/* CTA button — pinned to bottom, below characters */}
              <div
                className="absolute inset-x-0 bottom-0 flex justify-center px-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ paddingBottom: 'max(28px, calc(env(safe-area-inset-bottom) + 20px))' }}
              >
                <Button
                  onClick={() => setView(VIEWS.SETUP_TEAM)}
                  className="text-base md:text-lg px-8 md:px-14 py-4 md:py-5 rounded-2xl md:rounded-[28px] shadow-2xl shadow-blue-500/50 w-full max-w-xs md:max-w-sm"
                >
                  지금 팀 생성하기 <ArrowRight size={20} />
                </Button>
              </div>

            </div>
          </div>
        )}

        {view === VIEWS.SETUP_TEAM && (
          <div className="max-w-xl mx-auto py-8 md:py-20 px-5 md:px-6 animate-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-3xl md:text-5xl font-bold mb-7 md:mb-12 tracking-tight text-center">프로젝트 시작</h2>
            <div className="space-y-7 md:space-y-12">
              <div className="space-y-3 md:space-y-5">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-[0.15em] md:tracking-[0.2em] ml-2">Category</label>
                <div className="relative">
                  <select value={team.category} onChange={e => setTeam({...team, category: e.target.value})} className="w-full p-4 md:p-7 bg-[#f2f4f6] rounded-2xl md:rounded-[32px] outline-none text-base md:text-2xl font-bold appearance-none focus:ring-8 focus:ring-[#3182f6]/5 transition-all">
                    {PROJECT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                </div>
              </div>

              <div className="space-y-3 md:space-y-5">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-[0.15em] md:tracking-[0.2em] ml-2">Team Size</label>
                <div className="relative">
                  <select value={team.targetSize || 4} onChange={e => setTeam({...team, targetSize: Number(e.target.value)})} className="w-full p-4 md:p-7 bg-[#f2f4f6] rounded-2xl md:rounded-[32px] outline-none text-base md:text-2xl font-bold appearance-none focus:ring-8 focus:ring-[#3182f6]/5 transition-all">
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => <option key={num} value={num}>{num}명</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                </div>
              </div>

              <div className="space-y-3 md:space-y-5">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-[0.15em] md:tracking-[0.2em] ml-2">Project Name</label>
                <textarea className="w-full p-5 md:p-10 bg-[#f2f4f6] rounded-3xl md:rounded-[48px] outline-none text-base md:text-2xl font-medium min-h-[120px] md:min-h-[200px] resize-none focus:ring-8 focus:ring-[#3182f6]/5 transition-all border-none" placeholder="팀 이름 또는 구체적인 목표를 입력하세요" value={team.name} onChange={e => setTeam({...team, name: e.target.value})} />
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
                   <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Real-time Card View</span>
                </div>
                <Card className="overflow-hidden p-0 shadow-[0_32px_80px_rgba(0,0,0,0.1)] border-none ring-1 ring-gray-100 scale-100 hover:scale-[1.02] transition-all duration-500">
                  <div className="h-64 bg-gray-50 flex items-center justify-center overflow-hidden relative">
                    {profileData.workItems.length > 0 ? (
                      <><img src={profileData.workItems[0].url} className="w-full h-full object-cover" alt="preview" /><div className="absolute top-6 left-6 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl text-xs font-bold shadow-lg">{profileData.role}</div></>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-gray-300"><FileImage size={56} strokeWidth={1.5} className="opacity-50" /><span className="text-sm font-bold tracking-tight">작업물 이미지가 여기에 표시됩니다.</span></div>
                    )}
                  </div>
                  <div className="p-10">
                    <div className="flex justify-between items-start mb-4"><h4 className="text-3xl font-bold tracking-tight">{profileData.name || "이름"}</h4><span className="text-xs font-bold text-[#3182f6] px-3 py-1.5 bg-blue-50 rounded-xl">{profileData.generation}</span></div>
                    <div className="flex gap-3 mb-6 opacity-40">{profileData.phone && <Phone size={14}/>}{profileData.portfolioLinks.filter(l=>l).length > 0 && <LinkIcon size={14}/>}</div>
                    <p className="text-lg text-gray-500 font-medium italic line-clamp-3 leading-relaxed">"{profileData.workItems[0]?.description || '작업물에 대한 설명이 여기에 요약되어 표시됩니다.'}"</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {view === VIEWS.DASHBOARD && (
          <div className="fixed inset-0 w-full h-full bg-[#8FCB81] overflow-hidden flex justify-center">

            <FinchWalkingScene
              members={team.members}
              onMemberClick={setSelectedMember}
              isJumping={isJumping}
              cheerMessages={activeCheerMessages}
            />

            <Confetti active={showConfetti} />

            <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />

            <BottomSheet isOpen={showJourneySheet} onClose={() => setShowJourneySheet(false)} title="우리의 여정 (Quest)">
              <div className="space-y-5 md:space-y-6 relative">
                 <div className="absolute left-[23px] md:left-[27px] top-6 bottom-10 w-0.5 bg-gray-200 z-0"></div>

                 <div className="relative z-10 flex gap-3 md:gap-4">
                   <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#00c471] text-white flex items-center justify-center shrink-0 border-4 border-white shadow-sm"><MapPinned size={20}/></div>
                   <div className="pt-2.5 md:pt-3">
                     <h4 className="font-bold text-base md:text-lg text-gray-400 line-through">프로젝트 아지트 생성</h4>
                   </div>
                 </div>

                 {/* Step 2: 팀원 합류 */}
                 <div className="relative z-10 flex gap-3 md:gap-4">
                   <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${isAligned ? 'bg-[#00c471]' : 'bg-[#3182f6]'} text-white flex items-center justify-center shrink-0 border-4 border-white shadow-sm`}>
                     {isAligned ? <CheckCircle2 size={20}/> : <Users size={20}/>}
                   </div>
                   <div className="pt-1.5 md:pt-2 flex-1">
                     <h4 className={`font-bold text-base md:text-lg mb-1 ${isAligned ? 'text-gray-400 line-through' : 'text-[#191f28]'}`}>팀원 합류 ({currentMembers}/{targetMembers})</h4>
                     {!isAligned && (
                       <button onClick={copyInviteLink} className="mt-1.5 md:mt-2 px-3.5 md:px-4 py-2 bg-blue-50 text-[#3182f6] rounded-lg md:rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors">
                         <Plus size={14}/> 초대 링크 복사하기
                       </button>
                     )}
                   </div>
                 </div>

                 {/* Step 3: 킥오프 일정 잡기 — active when isAligned, done when isKickoffAgreed */}
                 <div className="relative z-10 flex gap-3 md:gap-4">
                   <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${isKickoffAgreed ? 'bg-[#00c471]' : isAligned ? 'bg-[#3182f6]' : 'bg-gray-200'} text-white flex items-center justify-center shrink-0 border-4 border-white shadow-sm`}>
                     {isKickoffAgreed ? <CheckCircle2 size={20}/> : <CalendarPlus size={20}/>}
                   </div>
                   <div className="pt-1.5 md:pt-2 flex-1">
                     <h4 className={`font-bold text-base md:text-lg mb-1 ${isKickoffAgreed ? 'text-gray-400 line-through' : isAligned ? 'text-[#191f28]' : 'text-gray-400'}`}>첫 킥오프 일정 잡기</h4>
                     {isAligned && !isKickoffAgreed && (
                       <button onClick={() => { setShowJourneySheet(false); setShowKickoffSheet(true); }} className="mt-1.5 md:mt-2 px-3.5 md:px-4 py-2 bg-blue-50 text-[#3182f6] rounded-lg md:rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors">
                         <CalendarPlus size={14}/> 가능 시간 선택하기
                       </button>
                     )}
                     {isKickoffAgreed && kickoff.proposal && (
                       <p className="text-xs md:text-sm font-bold text-[#00c471] mt-1">{kickoff.proposal.replace('-', ' ')} 확정 ✓</p>
                     )}
                   </div>
                 </div>

                 {/* Step 4: 그라운드 룰 — active when isKickoffAgreed */}
                 <div className="relative z-10 flex gap-3 md:gap-4">
                   <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${isKickoffAgreed ? 'bg-[#3182f6]' : 'bg-gray-200'} text-white flex items-center justify-center shrink-0 border-4 border-white shadow-sm`}>
                     <Heart size={20}/>
                   </div>
                   <div className="pt-1.5 md:pt-2 flex-1">
                     <h4 className={`font-bold text-base md:text-lg mb-1 ${isKickoffAgreed ? 'text-[#191f28]' : 'text-gray-400'}`}>그라운드 룰 숙지하기</h4>
                     <button onClick={() => { setShowJourneySheet(false); setShowRulesSheet(true); }} className={`mt-1.5 md:mt-2 px-3.5 md:px-4 py-2 rounded-lg md:rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition-colors ${isKickoffAgreed ? 'bg-blue-50 text-[#3182f6] hover:bg-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                       팀원들의 약속 읽어보기
                     </button>
                   </div>
                 </div>

                 {/* Step 5: 프로젝트 시작 */}
                 <div className={`relative z-10 flex gap-3 md:gap-4 ${isKickoffAgreed ? '' : 'opacity-40'}`}>
                   <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                     <Flag size={20}/>
                   </div>
                   <div className="pt-2.5 md:pt-3">
                     <h4 className="font-bold text-base md:text-lg text-gray-400">본격적인 프로젝트 시작!</h4>
                   </div>
                 </div>
              </div>
            </BottomSheet>

            <BottomSheet isOpen={showMembersSheet} onClose={() => setShowMembersSheet(false)} title="팀원 목록">
              <div className="space-y-3 md:space-y-4">
                 {team.members.map(member => (
                   <div key={member.id} onClick={() => { setShowMembersSheet(false); setSelectedMember(member); }} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white rounded-2xl md:rounded-[24px] shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 active:scale-95 transition-all">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-[#3182f6] rounded-xl md:rounded-2xl flex items-center justify-center text-white font-bold text-lg md:text-2xl shrink-0 overflow-hidden">
                        {member.photoUrl ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" /> : member.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 md:mb-1"><span className="font-bold text-base md:text-xl">{member.name}</span><span className="text-[10px] md:text-xs font-medium text-[#3182f6] bg-blue-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg">{member.role}</span></div>
                        <p className="text-xs md:text-sm font-medium text-gray-400 truncate">"{member.intro}"</p>
                      </div>
                      <ChevronRight className="text-gray-300 shrink-0" size={20}/>
                   </div>
                 ))}
                 <button onClick={copyInviteLink} className="w-full p-4 md:p-6 border-2 border-dashed border-gray-300 rounded-2xl md:rounded-[24px] flex items-center justify-center gap-2 text-gray-500 font-bold text-sm md:text-base hover:bg-white transition-colors">
                    <Plus size={18}/> 팀원 더 초대하기
                 </button>
              </div>
            </BottomSheet>

            <BottomSheet isOpen={showRulesSheet} onClose={() => setShowRulesSheet(false)} title="우리의 협업 약속">
               <div className="space-y-5 md:space-y-6">
                 {team.members.map(member => (
                   <div key={member.id} className="p-5 md:p-6 bg-white rounded-2xl md:rounded-[28px] shadow-sm border border-gray-100 space-y-3 md:space-y-4">
                     <div className="flex items-center gap-2 mb-1 md:mb-2"><div className="w-6 h-6 bg-[#3182f6] rounded-full flex items-center justify-center text-white text-[10px] font-bold">{member.name[0]}</div><span className="font-bold text-sm md:text-base">{member.name} 님의 약속</span></div>
                     <div className="p-3.5 md:p-4 bg-red-50/50 rounded-xl md:rounded-2xl border border-red-100"><h4 className="text-[10px] md:text-xs font-bold text-red-400 mb-1 flex items-center gap-1"><Heart size={12}/> 추구하는 가치</h4><p className="text-xs md:text-base font-medium text-[#4e5968]">{member.pursuits || '-'}</p></div>
                     <div className="p-3.5 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl"><h4 className="text-[10px] md:text-xs font-bold text-gray-400 mb-1 flex items-center gap-1"><Ban size={12}/> 지양하는 방식</h4><p className="text-xs md:text-base font-medium text-[#4e5968]">{member.avoid || '-'}</p></div>
                   </div>
                 ))}
               </div>
            </BottomSheet>

            <BottomSheet isOpen={showKickoffSheet} onClose={() => setShowKickoffSheet(false)} title="킥오프 일정 잡기">
              <div className="space-y-5 md:space-y-6">
                {!currentMemberId ? (
                  <p className="text-center py-8 text-gray-400 font-medium text-sm">먼저 프로필을 등록해주세요.</p>
                ) : (
                  <>
                    <p className="text-xs md:text-sm font-medium text-gray-500">내가 가능한 시간을 탭해서 선택하세요. 숫자는 겹치는 팀원 수입니다.</p>

                    {/* Availability grid */}
                    <div className="overflow-x-auto -mx-1 px-1">
                      <div className="min-w-[300px]">
                        <div className="grid grid-cols-8 gap-1 mb-2">
                          <div />
                          {DAYS.map(d => (
                            <div key={d} className="text-center text-[10px] md:text-xs font-bold text-gray-400">{d}</div>
                          ))}
                        </div>
                        {TIME_SLOTS.map(time => (
                          <div key={time} className="grid grid-cols-8 gap-1 mb-1">
                            <div className="flex items-center justify-end pr-1.5 text-[9px] md:text-[10px] font-bold text-gray-400">{time}</div>
                            {DAYS.map(day => {
                              const slot = `${day}-${time}`;
                              const isMine = myAvailability.includes(slot);
                              const count = Object.values(kickoff.availability || {}).filter(arr => (arr || []).includes(slot)).length;
                              const isProposed = kickoff.proposal === slot;
                              return (
                                <button
                                  key={day}
                                  onClick={() => toggleAvailability(slot)}
                                  className={`h-9 md:h-11 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all ${
                                    isProposed ? 'ring-2 ring-[#3182f6] ring-offset-1' : ''
                                  } ${
                                    isMine
                                      ? 'bg-[#3182f6] text-white shadow-md shadow-blue-200'
                                      : count > 0
                                        ? 'bg-blue-50 text-[#3182f6]'
                                        : 'bg-gray-100 text-transparent hover:bg-gray-200'
                                  }`}
                                >
                                  {count > 0 ? count : '·'}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Proposal / agree section */}
                    {kickoff.proposal ? (
                      <div className="p-4 md:p-5 bg-blue-50 rounded-2xl md:rounded-[24px] border border-blue-100 space-y-3 md:space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#3182f6] rounded-lg flex items-center justify-center text-white shrink-0"><CalendarPlus size={16}/></div>
                          <h4 className="font-bold text-sm md:text-base text-[#191f28]">제안된 킥오프 일정</h4>
                        </div>
                        <p className="text-xl md:text-2xl font-bold text-[#3182f6]">{kickoff.proposal.replace('-', ' ')}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs md:text-sm font-medium text-gray-500">{Object.keys(kickoff.agreements || {}).length}/{team.members.length}명 동의</span>
                          <div className="flex gap-1">
                            {team.members.map(m => (
                              <div key={m.id} title={m.name} className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ${(kickoff.agreements || {})[m.id] ? 'bg-[#00c471] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                {m.name?.[0]}
                              </div>
                            ))}
                          </div>
                        </div>
                        {!(kickoff.agreements || {})[currentMemberId] ? (
                          <button onClick={agreeToProposal} className="w-full py-3 md:py-4 bg-[#3182f6] hover:bg-[#1b64da] text-white rounded-xl md:rounded-2xl font-bold text-sm md:text-base transition-colors">
                            동의하기
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 text-[#00c471] font-bold text-sm md:text-base">
                            <CheckCircle2 size={18}/> 동의 완료
                          </div>
                        )}
                        <button onClick={() => proposeSlot(null)} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2">
                          다른 시간으로 변경
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 md:space-y-4">
                        <h4 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">추천 시간대 (많이 겹치는 순)</h4>
                        {getBestSlots(kickoff.availability).slice(0, 4).length > 0 ? (
                          getBestSlots(kickoff.availability).slice(0, 4).map(({ slot, count }) => (
                            <button
                              key={slot}
                              onClick={() => proposeSlot(slot)}
                              className="w-full p-3.5 md:p-5 bg-white border border-gray-200 hover:border-[#3182f6] hover:bg-blue-50 rounded-xl md:rounded-2xl flex justify-between items-center font-bold text-sm md:text-base transition-all"
                            >
                              <span>{slot.replace('-', ' ')}</span>
                              <span className="text-xs md:text-sm text-[#3182f6] bg-blue-50 px-2.5 py-1 rounded-lg">{count}명 가능</span>
                            </button>
                          ))
                        ) : (
                          <p className="text-xs md:text-sm font-medium text-gray-400 text-center py-6">팀원들이 가능 시간을 선택하면 추천 시간이 표시됩니다.</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </BottomSheet>

            <div className="absolute top-3 md:top-8 w-[calc(100%-1.5rem)] md:w-[calc(100%-2rem)] max-w-sm md:max-w-md left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 md:gap-2.5">
              <div
                onClick={() => setShowJourneySheet(true)}
                className="w-full bg-white/80 backdrop-blur-2xl rounded-2xl md:rounded-[24px] p-3 md:p-3.5 shadow-xl border border-white/80 animate-in slide-in-from-top-4 duration-700 flex flex-col gap-2.5 md:gap-3 cursor-pointer hover:bg-white/90 hover:scale-[1.02] transition-all group"
              >
                <div className="flex justify-between items-center px-1">
                  <span className={`font-bold text-[11px] md:text-sm uppercase tracking-wider flex items-center gap-2 ${isAligned ? 'text-[#00c471]' : 'text-[#3182f6]'}`}>
                    {isAligned ? 'Ready to Kick-off 🚀' : 'Team Building 🏃'}
                  </span>
                  <span className="text-gray-600 font-bold text-[10px] md:text-[11px] bg-white/90 px-2 py-0.5 md:py-1 rounded-md md:rounded-lg shadow-sm">{currentMembers} / {targetMembers} 합류</span>
                </div>
                <div className="flex items-center gap-2.5 md:gap-3">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md border-2 border-white font-bold shrink-0 transition-colors ${isAligned ? 'bg-gradient-to-br from-[#00c471] to-[#00a35c] text-white' : 'bg-gradient-to-br from-[#FFD54F] to-[#FFCA28] text-yellow-700'}`}>
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

              {/* Cheer button — just below progress bar */}
              <button
                onClick={handleCheer}
                disabled={isJumping || team.members.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-xl border border-white/80 font-bold text-sm text-[#191f28] active:scale-95 transition-all hover:shadow-2xl hover:bg-white disabled:opacity-40 animate-in slide-in-from-top-4 duration-700"
              >
                <span className={`text-lg ${isJumping ? 'animate-spin' : ''}`}>🎉</span>
                우리 팀 응원하기
              </button>
            </div>

            <div className="absolute bottom-0 md:bottom-8 w-full max-w-md md:max-w-2xl lg:max-w-4xl h-20 md:h-28 bg-white/95 backdrop-blur-xl flex items-center justify-around px-2 md:px-10 rounded-t-[32px] md:rounded-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl z-50 border-t md:border border-white transition-all pb-[env(safe-area-inset-bottom)]">
               <button className="flex flex-col items-center gap-1 md:gap-1.5 p-2 w-14 md:w-24 opacity-100 transition-opacity">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-gray-100 rounded-full flex items-center justify-center text-[#3182f6]"><Home size={20} fill="currentColor"/></div>
                  <span className="text-[10px] md:text-xs font-bold text-[#3182f6] hidden md:block">Home</span>
               </button>
               <button onClick={() => setShowMembersSheet(true)} className="flex flex-col items-center gap-1 md:gap-1.5 p-2 w-14 md:w-24 opacity-50 hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-transparent hover:bg-gray-50 rounded-full flex items-center justify-center text-[#4e5968] transition-colors"><Users size={20} /></div>
                  <span className="text-[10px] md:text-xs font-bold text-[#4e5968] hidden md:block">Members</span>
               </button>
               <button onClick={() => setShowRulesSheet(true)} className="flex flex-col items-center gap-1 md:gap-1.5 p-2 w-14 md:w-24 opacity-50 hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-transparent hover:bg-gray-50 rounded-full flex items-center justify-center text-[#4e5968] transition-colors"><Heart size={20} /></div>
                  <span className="text-[10px] md:text-xs font-bold text-[#4e5968] hidden md:block">Rules</span>
               </button>
               <button onClick={() => setShowKickoffSheet(true)} className="flex flex-col items-center gap-1 md:gap-1.5 p-2 w-14 md:w-24 opacity-50 hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-transparent hover:bg-gray-50 rounded-full flex items-center justify-center text-[#4e5968] transition-colors"><CalendarPlus size={20} /></div>
                  <span className="text-[10px] md:text-xs font-bold text-[#4e5968] hidden md:block">Schedule</span>
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
