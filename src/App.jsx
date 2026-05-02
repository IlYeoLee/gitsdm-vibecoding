import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getTeam as dbGetTeam, createTeam as dbCreateTeam, addMember as dbAddMember, updateKickoff as dbUpdateKickoff, subscribeTeam } from './lib/teamDb';
import Cropper from 'react-easy-crop';
import {
  Users, LayoutDashboard, Map, Plus, ArrowRight, Clock, Zap, ChevronRight, User,
  ExternalLink, Sparkles, Image as ImageIcon, Heart, Ban, Upload, X, Sun, Moon,
  Coffee, Home, Building2, ChevronDown, FileImage, Calendar,
  MessageCircle, Dna, Phone, Instagram, Link as LinkIcon, Trash2, CheckCircle2,
  Copy, Share2, Check, Navigation, AlertCircle, Smile, MapPinned, Flag, CalendarPlus, Circle, Monitor, Bed, Camera, ZoomIn, ZoomOut,
  Volume2, VolumeX
} from 'lucide-react';

// Vite handles base path (/ in dev, /gitsdm-vibecoding/ in prod build) — runtime asset URLs must be prefixed
const ASSET = (p) => `${import.meta.env.BASE_URL}${p.replace(/^\/+/, '')}`;

// Module-level BGM with fade-in / fade-out on loop
let _bgm = null;
let _bgmReady = false;
const BGM_VOL  = 0.28;
const FADE_SECS = 1.8; // subtle fade at start/end of each loop

const getBgm = () => {
  if (!_bgm) {
    _bgm = new Audio(ASSET('bgm.mp3'));
    _bgm.loop   = false;
    _bgm.volume = 0;
  }
  return _bgm;
};

const _setupBgm = () => {
  if (_bgmReady) return;
  _bgmReady = true;
  const b = getBgm();
  b.addEventListener('timeupdate', () => {
    if (!b.duration || b.paused) return;
    const pos = b.currentTime;
    const rem = b.duration - pos;
    if      (rem < FADE_SECS) b.volume = BGM_VOL * Math.max(0, rem / FADE_SECS);
    else if (pos < FADE_SECS) b.volume = BGM_VOL * Math.min(1, pos / FADE_SECS);
    else                       b.volume = BGM_VOL;
  });
  b.addEventListener('ended', () => {
    b.currentTime = 0;
    b.volume = 0;
    b.play().catch(() => {});
  });
};

const playBgm = () => {
  _setupBgm();
  const b = getBgm();
  b.currentTime = 0;
  b.volume = 0;
  b.play().catch(() => {});
};

const pauseBgm = () => {
  const b = getBgm();
  const from = b.volume;
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min((now - t0) / 500, 1);
    b.volume = from * (1 - p);
    if (p < 1) requestAnimationFrame(tick);
    else b.pause();
  };
  requestAnimationFrame(tick);
};

// SFX tap — plays on every CTA button press
let _sfx = null;
const playSfx = () => {
  try {
    if (!_sfx) {
      _sfx = new Audio(ASSET('sfx-tap.mp4'));
      _sfx.volume = 0.8;
    }
    _sfx.currentTime = 0;
    _sfx.play().catch(() => {});
  } catch {}
};

// SFX cheer — plays when "우리 팀 응원하기" is triggered
let _sfxCheer = null;
const playCheerSfx = () => {
  try {
    if (!_sfxCheer) {
      _sfxCheer = new Audio(ASSET('sfx-cheer.mp3'));
      _sfxCheer.volume = 1.0;
    }
    _sfxCheer.currentTime = 0;
    _sfxCheer.play().catch(() => {});
  } catch {}
};

// PNG icons (game-style replacements for lucide-react where available)
const ICO_PNGS = {
  Phone: 'icons/Phone 1.png',
  Users: 'icons/Users 1.png',
  Plus: 'icons/Plus 1.png',
  X: 'icons/X 1.png',
  Upload: 'icons/Upload 1.png',
  Sun: 'icons/Sun 1.png',
  Moon: 'icons/Moon 1.png',
  Sparkles: 'icons/Sparkles 1.png',
  Zap: 'icons/Zap 1.png',
  Trash2: 'icons/Trash2 1.png',
  MapPinned: 'icons/MapPinned 1.png',
  User: 'icons/User 1.png',
  ZoomIn: 'icons/ZoomIn 1.png',
  ZoomOut: 'icons/ZoomOut 1.png',
  MessageCircle: 'icons/MessageCircle 1.png',
  Monitor: 'icons/Monitor 1.png',
  Navigation: 'icons/Navigation 1.png',
  Smile: 'icons/Smile 1.png',
  Share2: 'icons/Share2 1.png',
  Map: 'icons/Map 1.png',
  Link: 'icons/Link 1.png',
  Bed: 'icons/bed.png',
  Building2: 'icons/building.png',
  Calendar: 'icons/calender.png',
  CalendarPlus: 'icons/calender.png',
  Coffee: 'icons/cup.png',
  Ban: 'icons/hate.png',
  Heart: 'icons/heart.png',
  Note: 'icons/note.png',
  Party: 'icons/party.png',
  Flag: 'icons/party.png',
  Home: 'icons/home.png',
  Camera: 'icons/camera.png',
  Instagram: 'icons/insta.png',
};
const Ico = ({ name, size = 20, className = '', style: s = {} }) => {
  const src = ICO_PNGS[name];
  if (!src) return null;
  return (
    <img src={ASSET(src)} alt="" draggable={false}
      style={{ width: size, height: size, objectFit: 'contain', display: 'inline-block', flexShrink: 0, ...s }}
      className={className} />
  );
};

// --- Constants ---
const VIEWS = {
  LANDING: 'landing',
  SETUP_TEAM: 'setup_team',
  ROSTER_SELECT: 'roster_select',
  INVITE_LANDING: 'invite_landing',
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
  <div onClick={onClick} className={`gcard ${onClick ? 'gcard-clickable' : ''} ${className}`}>{children}</div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", disabled = false, type = "button" }) => (
  <button
    type={type}
    onClick={(e) => { playSfx(); onClick?.(e); }}
    className={`gbtn gbtn-${variant} ${className}`}
    disabled={disabled}
  >
    {children}
  </button>
);

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

// Role lookup for pending roster members (before they fill their profile)
const MEMBER_ROLE_LOOKUP = {
  // UX
  '김채은': 'UX', '윤현경': 'UX', '이채연': 'UX', '장유진': 'UX',
  '정채영': 'UX', '김승희': 'UX', '박정민 (UX)': 'UX', '이서희': 'UX', '장별': 'UX',
  '전주현': 'UX', '한예지': 'UX', '백채영': 'UX', '서유빈': 'UX',
  '양준홍': 'UX', '이일여': 'UX', '이주은': 'UX', '정유진': 'UX',
  '조서현': 'UX', '권세진': 'UX', '서주원': 'UX', '서주원 ②': 'UX',
  '김정빈': 'UX', '임채은': 'UX', '최선우': 'UX', '임찬주': 'UX',
  '권솔': 'UX', '박우희': 'UX', '전다빈': 'UX', '윤영실': 'UX',
  '이지우': 'UX', '김예영': 'UX', '이정헌': 'UX', '이정현': 'UX',
  // ID
  '장인우': 'ID', '김민우': 'ID', '이준영': 'ID', '장은혜': 'ID',
  '주형준': 'ID', '나승환': 'ID', '김도완': 'ID',
  '박도현': 'ID', '박정민 (ID)': 'ID', '송시헌': 'ID', '임준우': 'ID',
  '강동헌': 'ID', '김시우': 'ID', '박세연': 'ID', '서현빈': 'ID',
  '양현지': 'ID', '정민서': 'ID', '정민영': 'ID', '최완혁': 'ID',
  '고유하': 'ID', '김소진': 'ID', '김정현': 'ID', '박주원': 'ID',
  '윤지원': 'ID', '김민정': 'ID', '이화인': 'ID', '서도윤': 'ID',
};

// Demo members shown on the landing screen preview — randomized per visit
const DEMO_INTROS = ['반가워요! 👋', '잘 부탁해요! ✨', '같이 해봐요! 🧡', '화이팅! 🔥'];
const getRandomDemoMembers = () => {
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
  const idPool  = shuffle(MEMBER_ROSTER.filter(m => MEMBER_ROLE_LOOKUP[m.name] === 'ID'));
  const uxPool  = shuffle(MEMBER_ROSTER.filter(m => MEMBER_ROLE_LOOKUP[m.name] === 'UX'));
  const allPool = shuffle(MEMBER_ROSTER);
  const used    = new Set();
  const pick = (pool) => {
    const m = pool.find(x => !used.has(x.name)) || pool[0];
    used.add(m.name);
    return m;
  };
  return [
    { role: 'PL', m: pick(allPool) },
    { role: 'ID', m: pick(idPool.length  ? idPool  : allPool) },
    { role: 'UX', m: pick(uxPool.length  ? uxPool  : allPool) },
    { role: 'VD', m: pick(uxPool.length  ? uxPool  : allPool) },
  ].map(({ role, m }, i) => ({
    id: `demo-${i}`, name: m.name, role,
    photoUrl: ASSET(m.photo), intro: DEMO_INTROS[i],
  }));
};

const MEMBER_ROSTER = [
  { name: '강동헌',      photo: 'members/강동헌.png' },
  { name: '고유하',      photo: 'members/고유하.png' },
  { name: '권세진',      photo: 'members/권세진.png' },
  { name: '권솔',        photo: 'members/권솔.png' },
  { name: '김도완',      photo: 'members/김도완.png' },
  { name: '김민정',      photo: 'members/김민정.png' },
  { name: '김소진',      photo: 'members/김소진.png' },
  { name: '김승희',      photo: 'members/김승희.png' },
  { name: '김시우',      photo: 'members/김시우.png' },
  { name: '김예영',      photo: 'members/김예영.png' },
  { name: '김정빈',      photo: 'members/김정빈.png' },
  { name: '김정현',      photo: 'members/김정현.png' },
  { name: '김채은',      photo: 'members/김채은.png' },
  { name: '나승환',      photo: 'members/나승환.png' },
  { name: '박도현',      photo: 'members/박도현.png' },
  { name: '이채연',      photo: 'members/이채연.png' },
  { name: '박세연',      photo: 'members/박세연.png' },
  { name: '박우희',      photo: 'members/박우희.png' },
  { name: '박정민 (ID)', photo: 'members/ID박정민.png' },
  { name: '박정민 (UX)', photo: 'members/UX박정민.png' },
  { name: '박주원',      photo: 'members/박주원.png' },
  { name: '백채영',      photo: 'members/백채영.png' },
  { name: '서유빈',      photo: 'members/서유빈.png' },
  { name: '서주원',      photo: 'members/서주원.png' },
  { name: '서주원 ②',   photo: 'members/서주원-1.png' },
  { name: '서현빈',      photo: 'members/서현빈.png' },
  { name: '송시헌',      photo: 'members/송시헌.png' },
  { name: '양준홍',      photo: 'members/양준홍.png' },
  { name: '양현지',      photo: 'members/양현지.png' },
  { name: '윤영실',      photo: 'members/윤영실.png' },
  { name: '윤지원',      photo: 'members/윤지원.png' },
  { name: '윤현경',      photo: 'members/윤현경.png' },
  { name: '이서희',      photo: 'members/이서희.png' },
  { name: '이일여',      photo: 'members/이일여.png' },
  { name: '이정현',      photo: 'members/이정현.png' },
  { name: '이주은',      photo: 'members/이주은.png' },
  { name: '이준영',      photo: 'members/이준영.png' },
  { name: '이지우',      photo: 'members/이지우.png' },
  { name: '이화인',      photo: 'members/이화인.png' },
  { name: '임준우',      photo: 'members/임준우.png' },
  { name: '임찬주',      photo: 'members/임찬주.png' },
  { name: '임채은',      photo: 'members/임채은.png' },
  { name: '장별',        photo: 'members/장별.png' },
  { name: '장유진',      photo: 'members/장유진.png' },
  { name: '전다빈',      photo: 'members/전다빈.png' },
  { name: '전주현',      photo: 'members/전주현.png' },
  { name: '정민서',      photo: 'members/정민서.png' },
  { name: '정민영',      photo: 'members/정민영.png' },
  { name: '정유진',      photo: 'members/정유진.png' },
  { name: '조서현',      photo: 'members/조서현.png' },
  { name: '주형준',      photo: 'members/주형준.png' },
  { name: '최선우',      photo: 'members/최선우.png' },
  { name: '최완혁',      photo: 'members/최완혁.png' },
  { name: '한예지',      photo: 'members/한예지.png' },
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
    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => setViewportWidth(window.innerWidth), 120); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
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
      case 'PL': return '#FF6B9D'; // pink
      case 'ID': return '#4A8FE0'; // blue
      case 'VD': return '#FFD600'; // yellow
      case 'UX': return '#FF8A00'; // orange
      default: return '#4A8FE0';
    }
  };

  // 2-row layout: 5+ on mobile, 8+ on desktop
  const splitThreshold = isMobile ? 5 : 8;
  const shouldSplit = members.length >= splitThreshold;
  const row1Members = shouldSplit ? members.slice(0, Math.ceil(members.length / 2)) : members;
  const row2Members = shouldSplit ? members.slice(Math.ceil(members.length / 2)) : [];
  const maxRowLen   = shouldSplit ? Math.max(row1Members.length, row2Members.length) : members.length;

  const naturalCharWidth = isMobile ? 108 : 126;
  const naturalSpacing   = isMobile ? 80  : 112;
  const usableWidth = viewportWidth * (isMobile ? 0.92 : 0.86);
  const minScale = isMobile ? 0.50 : 0.48;
  const requiredWidth = Math.max(1, maxRowLen) * naturalSpacing;
  const fitScale = requiredWidth > usableWidth ? Math.max(minScale, usableWidth / requiredWidth) : 1;
  const charWidth  = naturalCharWidth * fitScale;
  const charHeight = charWidth * SPRITE_ASPECT;
  const charOffset = naturalSpacing * fitScale;
  // Back row elevated enough that front-row speech bubbles (≈charHeight+36px) don't cover back-row faces
  const rowShift = shouldSplit ? charHeight * 1.25 : 0;

  return (
    <div className="absolute inset-0 bg-[#E8DDE0] overflow-hidden pointer-events-none">

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

      {/* Layer 3: Characters — 2-row layout for 5+/8+ members */}
      <div
        className="absolute w-full pointer-events-auto flex items-end justify-center z-50"
        style={{
          height: `${shouldSplit ? rowShift + charHeight * 1.6 + 48 : charHeight + 64}px`,
          bottom: isMobile ? '92px' : '130px',
        }}
      >
        {[
          { rowMembers: shouldSplit ? row2Members : null, isBack: false, zBase: 60 },
          { rowMembers: shouldSplit ? row1Members : null, isBack: true,  zBase: 30 },
          { rowMembers: shouldSplit ? null : members,      isBack: false, zBase: 60 },
        ].map(({ rowMembers: rm, isBack, zBase }) => {
          if (!rm) return null;
          return rm.map((member, index) => {
            const rowLen = rm.length;
            const indexOffset = index - (rowLen - 1) / 2;
            const globalIndex = isBack
              ? members.indexOf(member)
              : members.indexOf(member);
            const zIndex = zBase - index;
            const frame = ((tick + globalIndex) % SPRITE_FRAME_COUNT) + 1;
            const ringColor = getRoleColor(member.role);
            const roleKey = ROLE_SPRITES[member.role] ? member.role : 'ID';
            const spriteInfo = ROLE_SPRITES[roleKey];
            const faceFrame = spriteInfo.frames[frame - 1];
            const photoSize = charWidth * spriteInfo.dia;
            const faceLeft = Math.max(0, Math.min(charWidth - photoSize, charWidth * faceFrame.cx - photoSize / 2));
            const faceTop  = Math.max(0, Math.min(charHeight - photoSize, charHeight * faceFrame.cy - photoSize / 2));

            const cheerMsg = cheerMessages?.[member.id];
            const roleColor = getRoleColor(member.role);
            const rawBubble = cheerMsg || `"${member.intro || '안녕!'}"`;
            const bubbleText = rawBubble.length > 30 ? rawBubble.slice(0, 29) + '…' : rawBubble;
            const bubbleBg   = cheerMsg ? roleColor : '#fff';
            const bubbleTextColor = cheerMsg ? '#fff' : '#4e5968';
            const bubbleBorderColor = cheerMsg ? roleColor : '#e5e7eb';

            // Back-row chars sit higher; front-row at floor
            const bottomPos = isBack ? rowShift : 0;

            return (
              <div
                key={member.id}
                className="absolute flex flex-col items-center cursor-pointer"
                style={{ transform: `translateX(${indexOffset * charOffset}px)`, zIndex, bottom: `${bottomPos}px` }}
              >
                <div
                  className={`flex flex-col items-center hover:scale-110 transition-transform ${isJumping ? 'char-jumping' : ''}`}
                  style={{ animationDelay: `${globalIndex * 55}ms` }}
                  onClick={() => onMemberClick(member)}
                >
                  {/* Speech Bubble — sits above character, compact */}
                  <div
                    className="absolute bubble-float animate-in fade-in zoom-in duration-300"
                    style={{
                      bottom: `${charHeight + 6}px`,
                      animationDelay: `${(globalIndex * 0.55) % 2.5}s`,
                      background: bubbleBg,
                      border: `1.5px solid ${bubbleBorderColor}`,
                      borderRadius: '9px',
                      padding: '3px 8px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.10)',
                      maxWidth: `${charWidth + 20}px`,
                      wordBreak: 'keep-all',
                      overflowWrap: 'break-word',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontFamily: "'Jua', sans-serif", color: bubbleTextColor, letterSpacing: '-0.02em', lineHeight: 1.4 }}>
                      {bubbleText}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)',
                      width: '8px', height: '8px', background: bubbleBg,
                      borderBottom: `1.5px solid ${bubbleBorderColor}`,
                      borderRight: `1.5px solid ${bubbleBorderColor}`,
                    }}/>
                  </div>

                  {/* Character sprite + face photo */}
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
                        <div className="w-full h-full flex items-center justify-center text-white"
                          style={{ backgroundColor: ringColor, fontSize: `${photoSize * 0.42}px`, fontFamily: "'Jua', sans-serif" }}>
                          {member.name?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <img
                      src={ASSET(`avatar/${roleKey}/${roleKey}${frame}.png`)}
                      alt="" draggable={false}
                      className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
                    />
                  </div>
                </div>

                {/* Name pill badge — only in single-row layout */}
                {!shouldSplit && (
                  <div style={{
                    marginTop: '3px',
                    padding: '2px 9px',
                    background: 'rgba(255,253,247,0.92)',
                    border: '1.5px solid rgba(212,169,106,0.7)',
                    borderRadius: '9999px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                    fontSize: '11px',
                    fontFamily: "'Jua', sans-serif",
                    color: '#3D2B1F',
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                    maxWidth: `${charWidth + 20}px`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    pointerEvents: 'none',
                  }}>
                    {[member.role, member.name].filter(Boolean).join(' ')}
                  </div>
                )}
              </div>
            );
          });
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-md md:max-w-2xl h-[85vh] md:h-auto md:max-h-[85vh] gpanel-bg rounded-t-[32px] md:rounded-[32px] shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 flex flex-col transition-all"
        style={{ border: '2px solid var(--gc-gold)', borderBottom: 'none' }}>
        <div className="w-full flex justify-center py-3 md:hidden"><div className="gpanel-handle"></div></div>

        <div className="px-5 md:px-8 py-4 md:py-6 flex justify-between items-center" style={{ borderBottom: '1.5px solid var(--gc-border)' }}>
           <h3 className="text-xl md:text-3xl font-bold" style={{ color: 'var(--gc-text)' }}>{title}</h3>
           <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ background: 'var(--gc-border)', color: 'var(--gc-text)' }}><Ico name="X" size={18}/></button>
        </div>
        <div className="p-5 md:p-8 overflow-y-auto flex-1 pb-20 md:pb-8">
           {children}
        </div>
      </div>
    </div>
  );
};

const MemberDropdown = ({ value, onSelect, roster }) => {
  const memberList = (roster && roster.length > 0) ? roster : MEMBER_ROSTER;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = memberList.find(m => m.name === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-3.5 rounded-xl transition-all"
        style={{ background: 'var(--gc-input-bg)', border: `2px solid ${open ? 'var(--gc-gold)' : 'var(--gc-tan)'}`, boxShadow: open ? '0 0 0 4px rgba(232,164,74,0.18)' : 'none', outline: 'none' }}
      >
        {selected ? (
          <div className="flex items-center gap-3">
            <img src={ASSET(selected.photo)} alt={selected.name}
              className="w-8 h-8 rounded-full object-cover border-2"
              style={{ borderColor: 'var(--gc-gold)' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--gc-text)' }}>{value}</span>
          </div>
        ) : (
          <span className="text-sm font-medium" style={{ color: 'var(--gc-text-muted)' }}>이름을 선택하세요 (가나다순)</span>
        )}
        <ChevronDown size={18} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--gc-text-muted)' }} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-[100] mt-2 rounded-2xl overflow-y-auto scrollbar-hide"
          style={{ background: 'var(--gc-surface)', border: '2px solid var(--gc-gold)', boxShadow: '0 8px 0 var(--gc-gold-dark), 0 16px 40px rgba(180,120,50,0.18)', maxHeight: '288px', padding: '12px' }}>
          <div className="grid grid-cols-5 gap-1.5">
            {memberList.map(m => {
              const isSel = m.name === value;
              return (
                <button
                  key={m.photo}
                  type="button"
                  onClick={() => { onSelect(m); setOpen(false); }}
                  className="member-face-btn flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all"
                  style={isSel
                    ? { background: 'rgba(74,144,226,0.15)', border: '2px solid var(--gc-gold)' }
                    : { border: '2px solid transparent' }}
                >
                  <div className="flex-shrink-0" style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${isSel ? 'var(--gc-gold)' : 'var(--gc-tan)'}` }}>
                    <img src={ASSET(m.photo)} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                  <span className="text-[8px] font-bold text-center leading-tight w-full" style={{ color: 'var(--gc-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Animated character sprite with face overlay — used in profile detail modal
const MemberCharacter = ({ member, size = 130 }) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % SPRITE_FRAME_COUNT), 160);
    return () => clearInterval(id);
  }, []);
  const charWidth = size;
  const charHeight = charWidth * SPRITE_ASPECT;
  const roleKey = ROLE_SPRITES[member.role] ? member.role : 'ID';
  const roleColors = { PL: '#FF6B9D', ID: '#4A8FE0', VD: '#FFD600', UX: '#FF8A00' };
  const roleColor = roleColors[member.role] || '#4A8FE0';
  const spriteInfo = ROLE_SPRITES[roleKey];
  const frame = (tick % SPRITE_FRAME_COUNT) + 1;
  const faceFrame = spriteInfo.frames[frame - 1];
  const photoSize = charWidth * spriteInfo.dia;
  const faceLeft = Math.max(0, Math.min(charWidth - photoSize, charWidth * faceFrame.cx - photoSize / 2));
  const faceTop  = Math.max(0, Math.min(charHeight - photoSize, charHeight * faceFrame.cy - photoSize / 2));
  return (
    <div style={{ width: charWidth, height: charHeight, position: 'relative', flexShrink: 0 }}
      className="drop-shadow-[0_8px_14px_rgba(0,0,0,0.18)]">
      <div className="absolute rounded-full overflow-hidden"
        style={{ left: faceLeft, top: faceTop, width: photoSize, height: photoSize }}>
        {member.photoUrl ? (
          <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" draggable={false}/>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white"
            style={{ backgroundColor: roleColor, fontSize: `${photoSize * 0.42}px`, fontFamily: "'Jua',sans-serif" }}>
            {member.name?.[0] || '?'}
          </div>
        )}
      </div>
      <img src={ASSET(`avatar/${roleKey}/${roleKey}${frame}.png`)} alt="" draggable={false}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"/>
    </div>
  );
};

const MemberDetailModal = ({ member, onClose }) => {
  if (!member) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center pointer-events-auto p-0 md:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-md md:max-w-3xl h-[92vh] md:h-auto md:max-h-[90vh] rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-y-auto animate-in slide-in-from-bottom md:zoom-in-95 pb-8 md:pb-12 transition-all"
        style={{ background: 'var(--gc-surface)', border: '2px solid var(--gc-gold)', borderBottom: 'none' }}>
        <div className="sticky top-0 w-full flex justify-center py-3 z-10 md:hidden"
          style={{ background: `linear-gradient(to bottom, var(--gc-surface), transparent)` }}><div className="gpanel-handle"></div></div>

        <button onClick={onClose} className="absolute top-4 md:top-8 right-4 md:right-8 p-2.5 md:p-3 rounded-full z-20 transition-colors"
          style={{ background: 'var(--gc-border)', color: 'var(--gc-text)' }}><Ico name="X" size={20} /></button>

        <div className="px-5 md:px-12 pt-2 md:pt-12 space-y-6 md:space-y-10">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            <MemberCharacter member={member} size={140} />
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2 flex-wrap">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{member.name}</h2>
                <span className="px-2.5 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-bold"
                  style={{ background: 'rgba(74,144,226,0.12)', color: 'var(--gc-blue)' }}>{member.role}</span>
              </div>
              <p className="text-sm md:text-lg font-medium mb-3 md:mb-4" style={{ color: 'var(--gc-text-muted)' }}>{member.generation}</p>
              <div className="flex flex-wrap gap-2 md:gap-3">
                 {member.phone && <a href={`tel:${member.phone}`} className="px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 font-medium text-xs md:text-sm transition-colors"
                   style={{ background: 'var(--gc-input-bg)', color: 'var(--gc-text-sub)', border: '1.5px solid var(--gc-tan)' }}><Ico name="Phone" size={14}/> 전화</a>}
                 {member.snsLink && <a href={member.snsLink.startsWith('http') ? member.snsLink : `https://${member.snsLink}`} target="_blank" rel="noreferrer"
                   className="px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 font-medium text-xs md:text-sm transition-colors"
                   style={{ background: 'rgba(225,48,108,0.08)', color: '#e1306c', border: '1.5px solid rgba(225,48,108,0.2)' }}><Ico name="Instagram" size={14}/> SNS</a>}
              </div>
            </div>
          </div>

          {member.portfolioLinks?.length > 0 && (
            <div className="space-y-2 md:space-y-3">
              <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--gc-text-muted)' }}>포트폴리오</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {member.portfolioLinks.map((link, i) => (
                  <a key={i} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 p-3 md:p-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium transition-colors"
                    style={{ background: 'var(--gc-input-bg)', color: 'var(--gc-text-sub)', border: '1.5px solid var(--gc-tan)' }}>
                    <Ico name="Link" size={14} className="shrink-0"/><span className="truncate">{link}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 md:space-y-4">
             <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--gc-text-muted)' }}>대표 작업물</h4>
             <div className="flex gap-3 md:gap-4 overflow-x-auto snap-x scrollbar-hide pb-2 -mx-5 px-5 md:mx-0 md:px-0">
               {member.workItems.map((item, i) => (
                 <div key={i} className="flex-shrink-0 w-[220px] md:w-[320px] gcard overflow-hidden snap-start" style={{ padding: 0 }}>
                    <img src={item.url} className="w-full h-36 md:h-52 object-cover" />
                    <div className="p-4 md:p-6 text-xs md:text-sm font-medium" style={{ color: 'var(--gc-text-sub)' }}>{item.description || '설명 없음'}</div>
                 </div>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-3 md:space-y-4">
               <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--gc-text-muted)' }}>작업 성향 & 리듬</h4>
               <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                  {member.workStyles.map(s => <span key={s} className="px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold"
                    style={{ background: 'var(--gc-input-bg)', border: '1.5px solid var(--gc-tan)', color: 'var(--gc-text-sub)' }}>#{s}</span>)}
               </div>
               <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {[
                    { ico: 'Sun',  label: '시작',  val: member.schedule?.start },
                    { ico: 'Moon', label: '밤샘',  val: member.schedule?.night },
                    { ico: 'Home', label: '장소',  val: member.schedule?.place },
                  ].map(({ ico, label, val }) => (
                    <div key={ico} className="p-3 md:p-4 rounded-xl md:rounded-2xl flex flex-col items-center gap-1" style={{ background: 'var(--gc-input-bg)', border: '1.5px solid var(--gc-border)' }}>
                      <Ico name={ico} size={22} className="mb-0.5"/>
                      <span style={{ fontSize: '10px', color: 'var(--gc-text-muted)', fontFamily: 'Pretendard Variable, sans-serif', fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: '13px', fontFamily: "'Jua', sans-serif", color: 'var(--gc-text)', lineHeight: 1.2 }}>{val || '-'}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="space-y-3 md:space-y-4">
               <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--gc-text-muted)' }}>협업 약속</h4>
               <div className="space-y-2 md:space-y-3">
                 <div className="p-4 md:p-5 rounded-2xl" style={{ background: 'rgba(232,84,84,0.06)', border: '1.5px solid rgba(232,84,84,0.2)' }}>
                   <h5 className="text-[10px] md:text-[11px] font-bold mb-1.5 md:mb-2 flex items-center gap-1.5" style={{ color: '#E85454' }}><Ico name="Heart" size={12}/> 추구하는 가치</h5>
                   <p className="text-xs md:text-sm font-medium" style={{ color: 'var(--gc-text)' }}>{member.pursuits || '-'}</p>
                 </div>
                 <div className="p-4 md:p-5 rounded-2xl" style={{ background: 'var(--gc-input-bg)', border: '1.5px solid var(--gc-border)' }}>
                   <h5 className="text-[10px] md:text-[11px] font-bold mb-1.5 md:mb-2 flex items-center gap-1.5" style={{ color: 'var(--gc-text-sub)' }}><Ico name="Ban" size={12}/> 지양하는 방식</h5>
                   <p className="text-xs md:text-sm font-medium" style={{ color: 'var(--gc-text)' }}>{member.avoid || '-'}</p>
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
  const [demoMembers] = useState(() => getRandomDemoMembers());
  const [team, setTeam] = useState({ id: '', name: '', category: PROJECT_CATEGORIES[0], targetSize: 4, members: [], kickoff: {} });
  const [selectedRoster, setSelectedRoster] = useState([]);
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
  const [isMuted, setIsMuted] = useState(() => {
    try { return localStorage.getItem('ALIGN_MUTED') === 'true'; } catch { return false; }
  });

  // Photo crop modal state
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [profileData, setProfileData] = useState({
    name: '', role: '', generation: '', phone: '', snsLink: '',
    photoUrl: '',
    portfolioLinks: [], workItems: [], workStyles: [], styleReasons: {},
    researchTopics: [], researchSubject: '',
    schedule: { start: '', night: '', place: '' },
    pursuits: '', avoid: '', intro: ''
  });

  // Scroll to top on every view or step change
  useEffect(() => { window.scrollTo(0, 0); }, [view]);
  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  // BGM: persist muted state; auto-start on first user interaction if unmuted
  useEffect(() => {
    try { localStorage.setItem('ALIGN_MUTED', String(isMuted)); } catch {}
  }, [isMuted]);
  useEffect(() => {
    if (isMuted) return;
    const handler = () => { playBgm(); };
    document.addEventListener('pointerdown', handler, { once: true });
    return () => document.removeEventListener('pointerdown', handler);
  }, [isMuted]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const teamId = params.get('teamId');
    if (!teamId) return;
    const alreadyRegistered = (() => { try { return localStorage.getItem('ALIGN_CURRENT_MEMBER_ID'); } catch { return null; } })();
    dbGetTeam(teamId).then(remoteTeam => {
      if (remoteTeam) {
        setTeam(remoteTeam);
        setView(alreadyRegistered ? VIEWS.DASHBOARD : VIEWS.INVITE_LANDING);
      } else {
        const localTeam = getTeamFromLocal(teamId);
        if (localTeam) {
          setTeam(localTeam);
          setView(alreadyRegistered ? VIEWS.DASHBOARD : VIEWS.INVITE_LANDING);
        } else {
          setTeam({ id: teamId, name: '초대받은 프로젝트', category: '파운데이션', targetSize: 4, members: [], kickoff: {} });
          setView(VIEWS.INVITE_LANDING);
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


      setTeam(newTeam);
      setSelectedRoster([]);
      setView(VIEWS.ROSTER_SELECT);
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

  const handleRosterConfirm = async () => {
    const newKickoff = { ...(team.kickoff || {}), rosterMembers: selectedRoster };
    setTeam(prev => ({ ...prev, kickoff: newKickoff }));
    saveTeamToLocal({ ...team, kickoff: newKickoff });
    dbUpdateKickoff(team.id, newKickoff);
    setStep(1);
    setView(VIEWS.PROFILE_FORM);
  };

  const getSceneMembers = (teamData) => {
    const t = teamData || team;
    const roster = t.kickoff?.rosterMembers || [];
    if (!roster.length) return t.members || [];
    return roster.map(r => {
      const registered = (t.members || []).find(m => m.name === r.name);
      if (registered) return { ...registered, intro: registered.intro || '작성 중..' };
      const pendingRole = MEMBER_ROLE_LOOKUP[r.name] || 'UX';
      return { id: `pending-${r.name}`, name: r.name, role: pendingRole, photoUrl: ASSET(r.photo), intro: '아직 초대 전', _isPending: true };
    });
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

  const disagreeFromProposal = () => {
    if (!currentMemberId) return;
    const newAgreements = { ...(kickoff.agreements || {}) };
    delete newAgreements[currentMemberId];
    const k = { ...kickoff, agreements: newAgreements };
    const t = { ...team, kickoff: k };
    setTeam(t); saveTeamToLocal(t);
    dbUpdateKickoff(team.id, k);
  };

  const handleCheer = () => {
    const sceneMembers = getSceneMembers();
    if (isJumping || sceneMembers.length === 0) return;
    playCheerSfx();
    const pool = CHEER_POOL(team.category || '');
    const msgs = {};
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    sceneMembers.forEach((m, i) => { msgs[m.id] = shuffled[i % shuffled.length]; });
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
        <div className="space-y-7 md:space-y-10 animate-in slide-in-from-right-4 duration-500 pb-28">
          <header>
            <h2 className="mb-1.5 md:mb-2 tracking-tight" style={{ fontSize: '24px', fontFamily: "'Jua', sans-serif", fontWeight: 400 }}>당신에 대해 알려주세요.</h2>
            <p className="text-sm md:text-lg font-medium" style={{ color: 'var(--gc-text-sub)' }}>협업 멤버들에게 공유될 정보를 구성합니다.</p>
          </header>
          <div className="space-y-6 md:space-y-8">
            {/* 1. 이름 드롭다운 + 기수 + 역할 */}
            <div className="space-y-3 md:space-y-4">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-1 flex items-center gap-1" style={{ color: 'var(--gc-text-sub)' }}>이름 <span style={{ color: '#E85454' }}>✦</span></label>
                <MemberDropdown
                  value={profileData.name}
                  roster={team.kickoff?.rosterMembers || []}
                  onSelect={async (m) => {
                    setProfileData(prev => ({ ...prev, name: m.name }));
                    try {
                      const res = await fetch(ASSET(m.photo));
                      const blob = await res.blob();
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                          const SIZE = 320;
                          const canvas = document.createElement('canvas');
                          canvas.width = SIZE; canvas.height = SIZE;
                          const ctx = canvas.getContext('2d');
                          const side = Math.min(img.width, img.height);
                          const sx = (img.width - side) / 2;
                          const sy = (img.height - side) / 2;
                          ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
                          setProfileData(prev => ({ ...prev, photoUrl: canvas.toDataURL('image/jpeg', 0.85) }));
                        };
                        img.src = e.target.result;
                      };
                      reader.readAsDataURL(blob);
                    } catch (err) {
                      console.warn('auto-fill photo failed', err);
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-1 flex items-center gap-1" style={{ color: 'var(--gc-text-sub)' }}>기수 <span style={{ color: '#E85454' }}>✦</span></label>
                  <div className="relative">
                    <select value={profileData.generation} onChange={e => setProfileData({...profileData, generation: e.target.value})} className="w-full p-3.5 md:p-4 rounded-xl font-medium text-sm md:text-base outline-none appearance-none cursor-pointer">
                      <option value="">기수 선택 *</option>
                      {GENERATIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: 'var(--gc-text-muted)' }} />
                  </div>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-1 flex items-center gap-1" style={{ color: 'var(--gc-text-sub)' }}>역할 <span style={{ color: '#E85454' }}>✦</span></label>
                  <div className="relative">
                    <select value={profileData.role} onChange={e => setProfileData({...profileData, role: e.target.value})} className="w-full p-3.5 md:p-4 rounded-xl font-medium text-sm md:text-base outline-none appearance-none cursor-pointer">
                      <option value="">역할 선택 *</option>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none" size={18} style={{ color: 'var(--gc-text-muted)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 프로필 사진 업로드 */}
            <div className="space-y-2.5 md:space-y-3">
              <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-1 flex items-center gap-1.5" style={{ color: 'var(--gc-text-sub)' }}>
                <Ico name="Camera" size={12}/> 프로필 사진 <span style={{ color: '#E85454' }}>✦</span> <span className="normal-case font-medium tracking-normal" style={{ color: 'var(--gc-text-muted)' }}>— 이름 선택 시 자동 채워져요</span>
              </label>
              <input type="file" accept="image/*" ref={photoInputRef} onChange={e => { handlePhotoUpload(e.target.files?.[0]); e.target.value = ''; }} className="hidden" />
              <div className="flex items-center gap-4 md:gap-5 p-4 md:p-5 rounded-2xl" style={{ background: 'var(--gc-input-bg)', border: '2px solid var(--gc-tan)' }}>
                <button onClick={() => photoInputRef.current?.click()}
                  className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-dashed transition-all shrink-0 flex items-center justify-center group"
                  style={{ background: 'var(--gc-surface)', borderColor: 'var(--gc-tan)' }}>
                  {profileData.photoUrl ? (
                    <img src={profileData.photoUrl} alt="프로필 사진" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-0.5 transition-colors" style={{ color: 'var(--gc-text-muted)' }}>
                      <Ico name="Camera" size={24}/>
                      <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
                    </div>
                  )}
                </button>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-xs md:text-sm font-medium leading-snug" style={{ color: 'var(--gc-text-sub)' }}>
                    {profileData.photoUrl ? '얼굴이 캐릭터의 동그란 얼굴 영역에 올라가요.' : '얼굴이 가운데에 오도록 정사각형 사진을 올려주세요.'}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => photoInputRef.current?.click()}
                      className="gbtn gbtn-primary text-[11px] md:text-xs" style={{ padding: '6px 14px' }}>
                      {profileData.photoUrl ? '변경' : '사진 선택'}
                    </button>
                    {profileData.photoUrl && (
                      <button onClick={() => setProfileData({...profileData, photoUrl: ''})}
                        className="gbtn gbtn-secondary text-[11px] md:text-xs" style={{ padding: '6px 14px' }}>
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-1 flex items-center gap-1.5" style={{ color: 'var(--gc-text-sub)' }}><Ico name="Phone" size={12}/> 연락처</label>
                <input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} className="w-full p-3.5 md:p-4 rounded-xl font-medium text-sm md:text-base outline-none transition-all" placeholder="010-0000-0000" />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-1 flex items-center gap-1.5" style={{ color: 'var(--gc-text-sub)' }}><Ico name="Instagram" size={12}/> SNS 링크</label>
                <input value={profileData.snsLink} onChange={e => setProfileData({...profileData, snsLink: e.target.value})} className="w-full p-3.5 md:p-4 rounded-xl font-medium text-sm md:text-base outline-none transition-all" placeholder="instagram.com/id" />
              </div>
            </div>

            <div className="space-y-2 md:space-y-3">
              <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-1 flex items-center gap-1.5" style={{ color: 'var(--gc-text-sub)' }}><Ico name="Link" size={12}/> 포트폴리오 링크</label>
              {profileData.portfolioLinks.map((link, i) => (
                <div key={i} className="flex gap-2 animate-in slide-in-from-top-1">
                   <input value={link} onChange={e => {
                     const nl = [...profileData.portfolioLinks]; nl[i] = e.target.value; setProfileData({...profileData, portfolioLinks: nl});
                   }} className="flex-1 p-3.5 md:p-4 rounded-xl font-medium text-sm md:text-base outline-none transition-all" placeholder="https://..." />
                   <button onClick={() => setProfileData(p => ({...p, portfolioLinks: p.portfolioLinks.filter((_, idx) => idx !== i)}))}
                     className="p-3.5 md:p-4 rounded-xl shrink-0 transition-colors"
                     style={{ background: 'rgba(232,84,84,0.1)', color: '#E85454' }}><Ico name="Trash2" size={18}/></button>
                </div>
              ))}
              <Button variant="outline" className="w-full py-3 md:py-4 text-xs md:text-sm" onClick={() => setProfileData(p => ({...p, portfolioLinks: [...p.portfolioLinks, '']}))}><Ico name="Plus" size={14}/> 링크 추가하기</Button>
            </div>

            <div className="space-y-3 md:space-y-4">
              <label className="text-[10px] md:text-xs font-bold block uppercase tracking-wide ml-1" style={{ color: 'var(--gc-text-sub)' }}>대표 작업물 ({profileData.workItems.length})</label>
              <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 md:pb-4 snap-x -mx-4 px-4 md:mx-0 md:px-0">
                 {profileData.workItems.map((item, i) => (
                   <div key={i} className="flex-shrink-0 w-[220px] md:w-[260px] p-3 md:p-4 gcard snap-start relative group" style={{ padding: '12px 14px' }}>
                      <img src={item.url} className="h-28 md:h-36 w-full object-cover rounded-xl md:rounded-2xl mb-3 md:mb-4" />
                      <button onClick={() => setProfileData(p => ({...p, workItems: p.workItems.filter((_, idx) => idx !== i)}))} className="absolute top-4 right-4 p-1.5 md:p-2 bg-black/50 text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Ico name="X" size={12}/></button>
                      <textarea value={item.description} onChange={e => {
                        const ni = [...profileData.workItems]; ni[i].description = e.target.value; setProfileData({...profileData, workItems: ni});
                      }} className="w-full p-2.5 md:p-3 rounded-xl text-xs font-medium h-16 md:h-20 outline-none resize-none transition-all" placeholder="작업물에 대한 설명" />
                   </div>
                 ))}
                 <input type="file" ref={fileInputRef} onChange={e => handleFiles(e.target.files)} multiple accept="image/*" className="hidden" />
                 <div onClick={() => fileInputRef.current?.click()}
                   className="flex-shrink-0 w-[220px] md:w-[260px] h-[200px] md:h-[250px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 md:gap-3 cursor-pointer transition-all"
                   style={{ borderColor: 'var(--gc-tan)', background: 'var(--gc-input-bg)' }}>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm"
                      style={{ background: 'var(--gc-surface)', color: 'var(--gc-text-muted)' }}><Ico name="Upload" size={20}/></div>
                    <span className="text-[11px] md:text-xs font-bold" style={{ color: 'var(--gc-text-muted)' }}>이미지 파일 추가</span>
                 </div>
              </div>
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-4" style={{ background: 'linear-gradient(to top, var(--gc-bg) 75%, transparent)' }}>
            <div className="max-w-xl mx-auto">
              <Button onClick={() => setStep(2)} className="w-full py-4 md:py-5 text-base md:text-xl" disabled={!profileData.name || !profileData.generation || !profileData.role || !profileData.photoUrl}>다음으로</Button>
            </div>
          </div>
        </div>
      );
      case 2: return (
        <div className="space-y-8 md:space-y-12 animate-in slide-in-from-right-4 duration-500 pb-28">
          <header>
            <h2 className="mb-2 md:mb-3" style={{ fontSize: '24px', fontFamily: "'Jua', sans-serif", fontWeight: 400 }}>작업 성향과 리듬</h2>
            <p className="text-base md:text-xl font-medium" style={{ color: 'var(--gc-text-sub)' }}>팀원들이 당신을 어떻게 도와주면 좋을까요?</p>
          </header>
          <div className="space-y-7 md:space-y-10">
            <section className="space-y-4 md:space-y-5">
              <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-1 flex items-center gap-1" style={{ color: 'var(--gc-text-sub)' }}>작업 성향 키워드 <span style={{ color: '#E85454' }}>✦</span></label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                 {WORK_STYLE_TAGS.map(tag => {
                   const sel = profileData.workStyles.includes(tag);
                   return (
                   <button key={tag} onClick={() => {
                     const exists = profileData.workStyles.includes(tag);
                     setProfileData({ ...profileData, workStyles: exists ? profileData.workStyles.filter(t => t !== tag) : [...profileData.workStyles, tag] });
                   }} className="p-3.5 md:p-5 rounded-2xl font-bold text-xs md:text-sm transition-all"
                     style={sel
                       ? { background: `linear-gradient(to bottom, var(--gc-blue-top), var(--gc-blue))`, color: '#fff', border: 'none', boxShadow: `0 3px 0 var(--gc-blue-floor)` }
                       : { background: 'var(--gc-input-bg)', border: '2px solid var(--gc-tan)', color: 'var(--gc-text-sub)' }}>
                     {tag}
                   </button>
                   );
                 })}
              </div>
              <div className="space-y-2.5 md:space-y-3 mt-4 md:mt-6">
                 {profileData.workStyles.map(tag => (
                   <div key={tag} className="animate-in slide-in-from-left-2">
                      <span className="text-[10px] md:text-[11px] font-bold ml-3 mb-1 block uppercase" style={{ color: 'var(--gc-blue)' }}>Why #{tag}?</span>
                      <input value={profileData.styleReasons[tag] || ''} onChange={e => setProfileData({...profileData, styleReasons: {...profileData.styleReasons, [tag]: e.target.value}})} className="w-full p-3.5 md:p-4 rounded-xl outline-none font-medium text-sm md:text-base transition-all" placeholder="이유를 간단히 설명해주세요." />
                   </div>
                 ))}
              </div>
            </section>

            <section className="space-y-4 md:space-y-6">
              <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-1" style={{ color: 'var(--gc-text-sub)' }}>나의 작업 리듬 선호도</label>
              <div className="space-y-6 md:space-y-8">
                 {[
                   { k: 'start', label: '시작 시간', opt: [{ v: '오전', d: '상쾌한 오전 시작', i: 'Sun' }, { v: '오후', d: '여유로운 오후 시작', i: 'Coffee' }] },
                   { k: 'night', label: '밤샘 여부', opt: [{ v: '선호', d: '밤의 집중력 선호', i: 'Moon' }, { v: '비선호', d: '컨디션 관리 중시', i: 'X' }] },
                   { k: 'place', label: '작업 장소', opt: [{ v: '출퇴근', d: '개인 공간/재택', i: 'Building2' }, { v: '멤박', d: '멤버십에서 자기', i: 'Bed' }] }
                 ].map(section => (
                   <div key={section.k} className="space-y-3 md:space-y-4">
                      <div className="flex items-center gap-2 text-sm md:text-base font-bold" style={{ color: 'var(--gc-text)' }}>{section.label}</div>
                      <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                        {section.opt.map(opt => {
                          const sel = profileData.schedule[section.k] === opt.v;
                          return (
                          <button key={opt.v} onClick={() => setProfileData({...profileData, schedule: {...profileData.schedule, [section.k]: opt.v}})}
                            className="p-4 md:p-6 rounded-2xl text-left transition-all"
                            style={sel
                              ? { background: `linear-gradient(145deg, #FFFDF7, rgba(74,144,226,0.08))`, border: `2.5px solid var(--gc-blue)`, boxShadow: `0 3px 0 var(--gc-blue-floor)` }
                              : { background: 'var(--gc-input-bg)', border: '2px solid var(--gc-tan)' }}>
                             <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-3"
                               style={sel ? { background: `linear-gradient(to bottom, var(--gc-blue-top), var(--gc-blue))`, boxShadow: `0 3px 0 var(--gc-blue-floor)` } : { background: 'var(--gc-border)' }}>
                               <Ico name={opt.i} size={28}/>
                             </div>
                             <div style={{ fontFamily: "'Jua', sans-serif", fontSize: '17px', fontWeight: 400, color: sel ? 'var(--gc-blue)' : 'var(--gc-text)', marginBottom: '3px' }}>{opt.v}</div>
                             <div style={{ fontSize: '11px', fontFamily: "'Pretendard Variable', Pretendard, sans-serif", fontWeight: 500, color: 'var(--gc-text-muted)' }}>{opt.d}</div>
                          </button>
                          );
                        })}
                      </div>
                   </div>
                 ))}
              </div>
            </section>
          </div>
          <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-4" style={{ background: 'linear-gradient(to top, var(--gc-bg) 75%, transparent)' }}>
              <div className="max-w-xl mx-auto flex gap-3">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">이전</Button>
                <Button onClick={() => setStep(3)} disabled={profileData.workStyles.length === 0} className="flex-[2]">다음으로</Button>
              </div>
            </div>
        </div>
      );
      case 3: return (
        <div className="space-y-8 md:space-y-12 animate-in slide-in-from-right-4 duration-500 pb-28">
           <header>
             <h2 className="mb-1.5 md:mb-2 tracking-tight" style={{ fontSize: '24px', fontFamily: "'Jua', sans-serif", fontWeight: 400 }}>최종 협업 약속</h2>
             <p className="text-sm md:text-lg font-medium" style={{ color: 'var(--gc-text-sub)' }}>기분 좋은 팀워크를 위해 꼭 지키고 싶은 점들입니다.</p>
           </header>
           <div className="space-y-6 md:space-y-8">
             {team.category === 'MEP' && (
               <div className="gcard p-5 md:p-8 space-y-5 md:space-y-7">
                 <div className="flex items-center gap-3 md:gap-4">
                   <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0"
                     style={{ background: 'rgba(74,144,226,0.12)' }}><Ico name="Note" size={28}/></div>
                   <div>
                     <h3 className="text-lg md:text-2xl font-bold tracking-tight">MEP 연구 관심사</h3>
                     <p className="text-[11px] md:text-sm font-medium" style={{ color: 'var(--gc-text-muted)' }}>이번 프로젝트의 개인적 연구 목표입니다.</p>
                   </div>
                 </div>
                 <div className="flex flex-wrap gap-1.5 md:gap-2">{MEP_TOPICS.map(topic => {
                   const sel = profileData.researchTopics.includes(topic);
                   return (
                   <button key={topic} onClick={() => { const nl = profileData.researchTopics.includes(topic) ? profileData.researchTopics.filter(t => t !== topic) : [...profileData.researchTopics, topic]; setProfileData({...profileData, researchTopics: nl}); }}
                     className="px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all"
                     style={sel
                       ? { background: `linear-gradient(to bottom, var(--gc-blue-top), var(--gc-blue))`, color: '#fff', boxShadow: `0 3px 0 var(--gc-blue-floor)` }
                       : { background: 'var(--gc-input-bg)', border: '1.5px solid var(--gc-tan)', color: 'var(--gc-text-sub)' }}>
                     {topic}
                   </button>
                   );
                 })}</div>
                 <textarea value={profileData.researchSubject} onChange={e => setProfileData({...profileData, researchSubject: e.target.value})} className="w-full p-4 md:p-5 rounded-xl outline-none font-medium text-sm md:text-base min-h-[120px] md:min-h-[140px] resize-none transition-all" placeholder="구체적인 연구 주제를 적어주세요." />
               </div>
             )}
             <div className="space-y-3 md:space-y-4">
               <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-1 flex items-center gap-2" style={{ color: 'var(--gc-text-sub)' }}><Ico name="Heart" size={14}/> 추구하는 협업 가치</label>
               <textarea value={profileData.pursuits} onChange={e => setProfileData({...profileData, pursuits: e.target.value})} className="w-full p-4 md:p-5 rounded-xl outline-none font-medium text-sm md:text-base min-h-[120px] md:min-h-[140px] resize-none transition-all" placeholder="예: 속도보다 논리적인 완결성을 중요하게 생각합니다." />
             </div>
             <div className="space-y-3 md:space-y-4">
               <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-1 flex items-center gap-2" style={{ color: 'var(--gc-text-sub)' }}><Ico name="Ban" size={14}/> 지양하는 협업 방식 (Don't)</label>
               <textarea value={profileData.avoid} onChange={e => setProfileData({...profileData, avoid: e.target.value})} className="w-full p-4 md:p-5 rounded-xl outline-none font-medium text-sm md:text-base min-h-[120px] md:min-h-[140px] resize-none transition-all" placeholder="예: 사전 공유 없는 불참이나 자정 이후의 급한 연락 등" />
             </div>
             <div className="space-y-3 md:space-y-4">
               <div className="flex items-center justify-between ml-1 mr-1">
                 <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--gc-text-sub)' }}>팀원들에게 한마디</label>
                 <span style={{ fontSize: '11px', fontFamily: 'Pretendard Variable, sans-serif', fontWeight: 500, color: profileData.intro.length > 30 ? '#E85454' : 'var(--gc-text-muted)' }}>{profileData.intro.length}/30</span>
               </div>
               <div style={profileData.intro.length > 30 ? { borderRadius: '14px', boxShadow: '0 0 0 3px rgba(232,84,84,0.35)' } : {}}>
                 <input
                   value={profileData.intro}
                   onChange={e => setProfileData({...profileData, intro: e.target.value})}
                   className="w-full p-4 md:p-5 rounded-xl outline-none font-medium text-sm md:text-base transition-all"
                   placeholder="잘해봅시다! 화이팅!"
                 />
               </div>
               {profileData.intro.length > 30 && (
                 <p style={{ fontSize: '11px', color: '#E85454', fontFamily: 'Pretendard Variable, sans-serif', marginTop: '4px', marginLeft: '4px' }}>30자 이내로 입력해주세요.</p>
               )}
             </div>
           </div>
           <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-4" style={{ background: 'linear-gradient(to top, var(--gc-bg) 75%, transparent)' }}>
               <div className="max-w-xl mx-auto flex gap-3">
                 <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">이전</Button>
                 <Button onClick={handleProfileSubmit} className="flex-[2]">완료하고 합류하기 <Ico name="Party" size={18}/></Button>
               </div>
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
    <div className="min-h-screen font-sans selection:bg-[#E8A44A]/25" style={{ background: 'var(--gc-bg)', color: 'var(--gc-text)' }}>

      {/* Photo Crop Modal */}
      {cropImageSrc && (
        <div className="fixed inset-0 z-[600] bg-black/88 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
          <div className="flex justify-between items-center px-5 md:px-8 py-4 md:py-5 text-white">
            <div>
              <h3 className="text-lg md:text-xl font-bold tracking-tight">얼굴 위치 맞추기</h3>
              <p className="text-xs md:text-sm font-medium text-white/55 mt-0.5">드래그해서 위치 조정 · 핀치/슬라이더로 확대</p>
            </div>
            <button onClick={() => setCropImageSrc(null)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
              <Ico name="X" size={20}/>
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
          <div className="px-5 md:px-8 py-4 md:py-6 space-y-4 md:space-y-5" style={{ background: 'rgba(30,20,10,0.96)', borderTop: '2px solid var(--gc-gold-dark)' }}>
            <div className="flex items-center gap-3">
              <Ico name="ZoomOut" size={18} className="text-white/55 shrink-0"/>
              <input
                type="range" min={1} max={4} step={0.05} value={cropZoom}
                onChange={e => setCropZoom(Number(e.target.value))}
                className="flex-1" style={{ accentColor: 'var(--gc-gold)' }}
              />
              <Ico name="ZoomIn" size={18} className="text-white/55 shrink-0"/>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCropImageSrc(null)}
                className="gbtn gbtn-secondary flex-1" style={{ color: 'var(--gc-text-sub)' }}>
                취소
              </button>
              <button onClick={confirmCrop}
                className="gbtn gbtn-primary" style={{ flex: 2 }}>
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {isCopied && (
        <div className="fixed top-4 md:top-16 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-top-6 duration-500">
           <div className="px-4 md:px-6 py-2.5 md:py-3 rounded-full flex items-center gap-2 shadow-2xl"
             style={{ background: 'var(--gc-text)', color: '#fff', border: '2px solid var(--gc-gold)', boxShadow: `0 4px 0 var(--gc-gold-dark), 0 8px 24px rgba(0,0,0,0.3)` }}>
              <div className="w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(to bottom, #6DD56E, var(--gc-green))` }}><Check size={10} strokeWidth={4}/></div>
              <span className="text-xs md:text-sm font-bold tracking-tight">복사 완료!</span>
           </div>
        </div>
      )}

      {view !== VIEWS.DASHBOARD && view !== VIEWS.LANDING && view !== VIEWS.INVITE_LANDING && (
        <nav className="sticky top-0 z-50 gnav-bar px-4 md:px-6 py-2.5 md:py-3">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <img src={ASSET('memboding-title.png')} alt="멤보딩" draggable={false}
              onClick={() => setView(VIEWS.LANDING)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              style={{ height: '36px', width: 'auto' }} />
            {view === VIEWS.PROFILE_FORM && (
              <div className="flex gap-1.5 md:gap-2">
                 {[1,2,3].map(s => <div key={s} className={`w-6 md:w-8 h-2 rounded-full transition-all ${step >= s ? 'gstep-dot-active' : 'gstep-dot-inactive'}`}/>)}
              </div>
            )}
          </div>
        </nav>
      )}

      <main>
        {view === VIEWS.LANDING && (
          <div className="fixed inset-0 overflow-hidden">
            <FinchWalkingScene
              members={demoMembers}
              onMemberClick={() => {}}
              isJumping={false}
              cheerMessages={{}}
            />

            <div className="absolute inset-0 z-[70]">
              <style>{`
                @keyframes subtitleLine {
                  0%   { opacity: 0; transform: translateY(10px); }
                  14%  { opacity: 1; transform: translateY(0); }
                  72%  { opacity: 1; transform: translateY(0); }
                  88%  { opacity: 0; transform: translateY(-6px); }
                  100% { opacity: 0; transform: translateY(10px); }
                }
                .sl { animation: subtitleLine 5.5s ease-in-out infinite; display: block; }
                .sl1 { animation-delay: 0s; }
                .sl2 { animation-delay: 0.38s; }
                .sl3 { animation-delay: 0.76s; }
              `}</style>
              {/* Title + body — upper portion; BGM button anchored to its bottom-right */}
              <div className="absolute inset-x-0 top-0 h-[46%] md:h-[36%] flex flex-col items-center justify-center px-6 text-center animate-in fade-in slide-in-from-top-4 duration-700 gap-3 md:gap-4">
                <img
                  src={ASSET('memboding-title.png')}
                  alt="멤보딩"
                  className="drop-shadow-2xl select-none"
                  style={{ width: 'min(280px, 72vw)' }}
                  draggable={false}
                />
                <div className="px-5 py-3 md:py-4 rounded-2xl text-sm md:text-base leading-relaxed max-w-[280px] md:max-w-sm"
                  style={{
                    background: 'rgba(255,253,247,0.92)',
                    border: '2.5px solid var(--gc-gold)',
                    boxShadow: '0 4px 0 var(--gc-gold-dark), 0 8px 20px rgba(180,120,50,0.18)',
                    color: 'var(--gc-text)',
                    backdropFilter: 'blur(8px)',
                    fontFamily: "'Jua', sans-serif",
                    minHeight: '5.4em',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}>
                  <span className="sl sl1">팀 프로젝트, 바로 시작!</span>
                  <span className="sl sl2">어색한 소개는 스킵하고,</span>
                  <span className="sl sl3">함께 일할 준비부터 완료하세요.</span>
                </div>
                {/* BGM button — bottom-right of this section so it never overlaps with title content */}
                <button
                  onClick={() => { playSfx(); const next = !isMuted; setIsMuted(next); if (!next) playBgm(); else pauseBgm(); }}
                  className="gbtn gbtn-secondary"
                  style={{ position: 'absolute', bottom: 12, right: 16, padding: '7px 12px', fontSize: '12px', gap: '5px' }}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  <span style={{ fontFamily: "'Jua', sans-serif", fontSize: '12px' }}>{isMuted ? 'BGM 켜기' : 'BGM 끄기'}</span>
                </button>
              </div>

              {/* CTA button */}
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
          <div className="max-w-xl mx-auto py-8 md:py-16 px-5 md:px-6 pb-40 md:pb-44 animate-in slide-in-from-bottom-8 duration-700">
            <h2 className="mb-7 md:mb-10 tracking-tight text-center" style={{ fontSize: '24px', fontFamily: "'Jua', sans-serif", fontWeight: 400, color: 'var(--gc-text)' }}>프로젝트 시작</h2>
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-3 md:space-y-4">
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-2" style={{ color: 'var(--gc-text-sub)' }}>Category</label>
                <div className="relative">
                  <select value={team.category} onChange={e => setTeam({...team, category: e.target.value})}
                    className="w-full p-4 md:p-5 rounded-2xl outline-none text-base md:text-xl font-bold appearance-none transition-all"
                    style={{ background: 'var(--gc-input-bg)', border: '2px solid var(--gc-tan)', color: 'var(--gc-text)', borderRadius: '18px' }}>
                    {PROJECT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 pointer-events-none" size={22} style={{ color: 'var(--gc-text-sub)' }} />
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-2" style={{ color: 'var(--gc-text-sub)' }}>Team Size</label>
                <div className="relative">
                  <select value={team.targetSize || 4} onChange={e => setTeam({...team, targetSize: Number(e.target.value)})}
                    className="w-full p-4 md:p-5 rounded-2xl outline-none text-base md:text-xl font-bold appearance-none transition-all"
                    style={{ background: 'var(--gc-input-bg)', border: '2px solid var(--gc-tan)', color: 'var(--gc-text)', borderRadius: '18px' }}>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => <option key={num} value={num}>{num}명</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 pointer-events-none" size={22} style={{ color: 'var(--gc-text-sub)' }} />
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-wide ml-2" style={{ color: 'var(--gc-text-sub)' }}>Project Name</label>
                <textarea
                  className="w-full p-5 md:p-7 outline-none text-base md:text-xl font-medium min-h-[120px] md:min-h-[160px] resize-none transition-all"
                  style={{ background: 'var(--gc-input-bg)', border: '2px solid var(--gc-tan)', borderRadius: '20px', color: 'var(--gc-text)' }}
                  placeholder="팀 이름 또는 구체적인 목표를 입력하세요" value={team.name} onChange={e => setTeam({...team, name: e.target.value})} />
              </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-4" style={{ background: 'linear-gradient(to top, var(--gc-bg) 75%, transparent)' }}>
              <div className="max-w-xl mx-auto">
                <Button onClick={handleCreateTeam} className="w-full py-5 md:py-6 text-base md:text-xl" disabled={!team.name}>
                  <Ico name="Link" size={18}/> 초대 링크 생성하고 프로필 작성 <ArrowRight size={18}/>
                </Button>
              </div>
            </div>
          </div>
        )}

        {view === VIEWS.ROSTER_SELECT && (
          <div className="max-w-2xl mx-auto py-8 md:py-16 px-5 md:px-6 pb-28 animate-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-6 md:mb-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight" style={{ color: 'var(--gc-text)' }}>
                팀원을 선택하세요
              </h2>
              <p className="text-sm md:text-base font-medium" style={{ color: 'var(--gc-text-sub)' }}>
                {team.targetSize}명을 선택하면 초대가 시작됩니다
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-base"
                style={{ background: selectedRoster.length >= team.targetSize ? 'rgba(91,184,92,0.15)' : 'rgba(74,144,226,0.12)',
                         color: selectedRoster.length >= team.targetSize ? 'var(--gc-green)' : 'var(--gc-blue)',
                         border: `1.5px solid ${selectedRoster.length >= team.targetSize ? 'var(--gc-green)' : 'rgba(74,144,226,0.3)'}` }}>
                {selectedRoster.length} / {team.targetSize} 선택됨
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4 mb-4">
              {MEMBER_ROSTER.map(m => {
                const isSel = selectedRoster.some(r => r.photo === m.photo);
                return (
                  <button
                    key={m.photo}
                    type="button"
                    onClick={() => {
                      if (isSel) {
                        setSelectedRoster(prev => prev.filter(r => r.photo !== m.photo));
                      } else if (selectedRoster.length < team.targetSize) {
                        setSelectedRoster(prev => [...prev, m]);
                      }
                    }}
                    className="member-face-btn flex flex-col items-center gap-1.5 p-2.5 md:p-3 rounded-2xl transition-all"
                    style={isSel
                      ? { background: 'rgba(74,144,226,0.15)', border: '2px solid var(--gc-gold)', boxShadow: '0 3px 0 var(--gc-gold-dark)' }
                      : { border: '2px solid transparent', opacity: !isSel && selectedRoster.length >= team.targetSize ? 0.4 : 1 }}
                  >
                    <div className="relative">
                      <div className="flex-shrink-0" style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: `2.5px solid ${isSel ? 'var(--gc-gold)' : 'var(--gc-tan)'}` }}>
                        <img src={ASSET(m.photo)} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                      {isSel && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(to bottom, var(--gc-blue-top), var(--gc-blue))', boxShadow: '0 2px 0 var(--gc-blue-floor)' }}>
                          <Check size={12} strokeWidth={3} color="#fff"/>
                        </div>
                      )}
                    </div>
                    <span className="text-xs md:text-sm font-bold text-center leading-tight" style={{ color: 'var(--gc-text)' }}>{m.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-4" style={{ background: 'linear-gradient(to top, var(--gc-bg) 75%, transparent)' }}>
              <div className="max-w-2xl mx-auto">
                <Button
                  onClick={handleRosterConfirm}
                  className="w-full py-5 md:py-6 text-base md:text-xl"
                  disabled={selectedRoster.length < team.targetSize}
                >
                  팀원 확정하고 내 프로필 작성 <ArrowRight size={18}/>
                </Button>
              </div>
            </div>
          </div>
        )}

        {view === VIEWS.INVITE_LANDING && (
          <div className="fixed inset-0 overflow-hidden">
            <FinchWalkingScene
              members={getSceneMembers()}
              onMemberClick={() => {}}
              isJumping={false}
              cheerMessages={{}}
            />

            <div className="absolute inset-0 z-[70]">
              <div className="absolute inset-x-0 top-0 h-[46%] flex flex-col items-center justify-center px-6 text-center animate-in fade-in slide-in-from-top-4 duration-700 gap-3 md:gap-4">
                <img
                  src={ASSET('memboding-title.png')}
                  alt="멤보딩"
                  className="drop-shadow-2xl select-none"
                  style={{ width: 'min(240px, 64vw)' }}
                  draggable={false}
                />
                <div className="px-5 py-3 rounded-2xl text-sm md:text-base font-bold leading-relaxed max-w-[260px] md:max-w-sm"
                  style={{
                    background: 'rgba(255,253,247,0.92)',
                    border: '2.5px solid var(--gc-gold)',
                    boxShadow: '0 4px 0 var(--gc-gold-dark), 0 8px 20px rgba(180,120,50,0.18)',
                    color: 'var(--gc-text)',
                    backdropFilter: 'blur(8px)',
                  }}>
                  <span className="text-base md:text-lg font-bold block mb-1" style={{ color: 'var(--gc-gold-dark)' }}>{team.name || '팀 초대장'}</span>
                  팀원들이 먼저 달리고 있어요!<br />
                  프로필을 작성하고 합류하세요.
                </div>
              </div>

              <div
                className="absolute inset-x-0 bottom-0 flex justify-center px-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ paddingBottom: 'max(28px, calc(env(safe-area-inset-bottom) + 20px))' }}
              >
                <Button
                  onClick={() => { setStep(1); setView(VIEWS.PROFILE_FORM); }}
                  className="text-base md:text-lg px-8 md:px-14 py-4 md:py-5 rounded-2xl md:rounded-[28px] shadow-2xl shadow-blue-500/50 w-full max-w-xs md:max-w-sm"
                >
                  🚀 방 들어가기
                </Button>
              </div>
            </div>
          </div>
        )}

        {view === VIEWS.PROFILE_FORM && (
          <div className="max-w-7xl mx-auto py-6 md:py-12 px-4 md:px-8 flex flex-col lg:flex-row gap-8 md:gap-16">
            <div className="flex-1">{renderStep()}</div>
            <div className="hidden lg:block w-[380px]">
              <div className="sticky top-32 space-y-6">
                <div className="flex items-center gap-3 ml-2">
                   <Ico name="Sparkles" size={20}/>
                   <span className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--gc-text-sub)' }}>Real-time Card View</span>
                </div>
                <Card className="overflow-hidden p-0 hover:scale-[1.02] transition-all duration-500">
                  <div className="h-64 flex items-center justify-center overflow-hidden relative"
                    style={{ background: 'var(--gc-input-bg)' }}>
                    {profileData.workItems.length > 0 ? (
                      <><img src={profileData.workItems[0].url} className="w-full h-full object-cover" alt="preview" />
                        <div className="absolute top-5 left-5 backdrop-blur-xl px-4 py-2 rounded-full text-xs font-bold shadow-lg"
                          style={{ background: 'rgba(255,253,247,0.92)', color: 'var(--gc-blue)', border: '1.5px solid var(--gc-tan)' }}>{profileData.role}</div></>
                    ) : (
                      <div className="flex flex-col items-center gap-4" style={{ color: 'var(--gc-text-muted)' }}>
                        <FileImage size={56} strokeWidth={1.5} className="opacity-50" />
                        <span className="text-sm font-bold tracking-tight">작업물 이미지가 여기에 표시됩니다.</span>
                      </div>
                    )}
                  </div>
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-3xl font-bold tracking-tight">{profileData.name || "이름"}</h4>
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{ background: 'rgba(74,144,226,0.12)', color: 'var(--gc-blue)' }}>{profileData.generation}</span>
                    </div>
                    <div className="flex gap-3 mb-5 opacity-50" style={{ color: 'var(--gc-text-sub)' }}>
                      {profileData.phone && <Ico name="Phone" size={14}/>}
                      {profileData.portfolioLinks.filter(l=>l).length > 0 && <Ico name="Link" size={14}/>}
                    </div>
                    <p className="text-base font-medium italic line-clamp-3 leading-relaxed" style={{ color: 'var(--gc-text-sub)' }}>
                      "{profileData.workItems[0]?.description || '작업물에 대한 설명이 여기에 요약되어 표시됩니다.'}"
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {view === VIEWS.DASHBOARD && (
          <div className="fixed inset-0 w-full h-full bg-[#8FCB81] overflow-hidden flex justify-center">

            <FinchWalkingScene
              members={getSceneMembers()}
              onMemberClick={(m) => { if (!m._isPending) setSelectedMember(m); }}
              isJumping={isJumping}
              cheerMessages={activeCheerMessages}
            />

            <Confetti active={showConfetti} />

            <MemberDetailModal member={selectedMember} onClose={() => setSelectedMember(null)} />

            <BottomSheet isOpen={showJourneySheet} onClose={() => setShowJourneySheet(false)} title="우리의 여정 (Quest)">
              <div className="space-y-5 md:space-y-6 relative">
                 <div className="absolute left-[23px] md:left-[27px] top-6 bottom-10 w-0.5 z-0" style={{ background: 'var(--gc-border)' }}></div>

                 <div className="relative z-10 flex gap-3 md:gap-4">
                   <div className="w-12 h-12 md:w-14 md:h-14 rounded-full text-white flex items-center justify-center shrink-0 border-4 border-white shadow-md"
                     style={{ background: `linear-gradient(to bottom, #6DD56E, var(--gc-green))`, boxShadow: `0 3px 0 var(--gc-green-floor)` }}><Ico name="MapPinned" size={20}/></div>
                   <div className="pt-2.5 md:pt-3">
                     <h4 className="font-bold text-base md:text-lg line-through" style={{ color: 'var(--gc-text-muted)' }}>프로젝트 아지트 생성</h4>
                   </div>
                 </div>

                 <div className="relative z-10 flex gap-3 md:gap-4">
                   <div className="w-12 h-12 md:w-14 md:h-14 rounded-full text-white flex items-center justify-center shrink-0 border-4 border-white shadow-md"
                     style={isAligned
                       ? { background: `linear-gradient(to bottom, #6DD56E, var(--gc-green))`, boxShadow: `0 3px 0 var(--gc-green-floor)` }
                       : { background: `linear-gradient(to bottom, var(--gc-blue-top), var(--gc-blue))`, boxShadow: `0 3px 0 var(--gc-blue-floor)` }}>
                     {isAligned ? <CheckCircle2 size={20}/> : <Ico name="Users" size={20}/>}
                   </div>
                   <div className="pt-1.5 md:pt-2 flex-1">
                     <h4 className="font-bold text-base md:text-lg mb-1"
                       style={{ color: isAligned ? 'var(--gc-text-muted)' : 'var(--gc-text)', textDecoration: isAligned ? 'line-through' : 'none' }}>
                       팀원 합류 ({currentMembers}/{targetMembers})</h4>
                     {!isAligned && (
                       <button onClick={copyInviteLink} className="mt-1.5 md:mt-2 px-3.5 md:px-4 py-2 rounded-full font-bold text-xs md:text-sm flex items-center gap-2 transition-colors"
                         style={{ background: 'rgba(74,144,226,0.12)', color: 'var(--gc-blue)', border: '1.5px solid rgba(74,144,226,0.25)' }}>
                         <Ico name="Plus" size={14}/> 초대 링크 복사하기
                       </button>
                     )}
                   </div>
                 </div>

                 <div className="relative z-10 flex gap-3 md:gap-4">
                   <div className="w-12 h-12 md:w-14 md:h-14 rounded-full text-white flex items-center justify-center shrink-0 border-4 border-white shadow-md"
                     style={isKickoffAgreed
                       ? { background: `linear-gradient(to bottom, #6DD56E, var(--gc-green))`, boxShadow: `0 3px 0 var(--gc-green-floor)` }
                       : isAligned
                         ? { background: `linear-gradient(to bottom, var(--gc-blue-top), var(--gc-blue))`, boxShadow: `0 3px 0 var(--gc-blue-floor)` }
                         : { background: 'var(--gc-border)', color: 'var(--gc-text-muted)' }}>
                     {isKickoffAgreed ? <CheckCircle2 size={20}/> : <Ico name="CalendarPlus" size={20}/>}
                   </div>
                   <div className="pt-1.5 md:pt-2 flex-1">
                     <h4 className="font-bold text-base md:text-lg mb-1"
                       style={{ color: isKickoffAgreed ? 'var(--gc-text-muted)' : isAligned ? 'var(--gc-text)' : 'var(--gc-text-muted)', textDecoration: isKickoffAgreed ? 'line-through' : 'none' }}>
                       첫 킥오프 일정 잡기</h4>
                     {isAligned && !isKickoffAgreed && (
                       <button onClick={() => { setShowJourneySheet(false); setShowKickoffSheet(true); }}
                         className="mt-1.5 md:mt-2 px-3.5 md:px-4 py-2 rounded-full font-bold text-xs md:text-sm flex items-center gap-2 transition-colors"
                         style={{ background: 'rgba(74,144,226,0.12)', color: 'var(--gc-blue)', border: '1.5px solid rgba(74,144,226,0.25)' }}>
                         <Ico name="CalendarPlus" size={14}/> 가능 시간 선택하기
                       </button>
                     )}
                     {isKickoffAgreed && kickoff.proposal && (
                       <p className="text-xs md:text-sm font-bold mt-1" style={{ color: 'var(--gc-green)' }}>{kickoff.proposal.replace('-', ' ')} 확정 ✓</p>
                     )}
                   </div>
                 </div>

                 <div className="relative z-10 flex gap-3 md:gap-4">
                   <div className="w-12 h-12 md:w-14 md:h-14 rounded-full text-white flex items-center justify-center shrink-0 border-4 border-white shadow-md"
                     style={isKickoffAgreed
                       ? { background: `linear-gradient(to bottom, var(--gc-blue-top), var(--gc-blue))`, boxShadow: `0 3px 0 var(--gc-blue-floor)` }
                       : { background: 'var(--gc-border)', color: 'var(--gc-text-muted)' }}>
                     <Ico name="Heart" size={20}/>
                   </div>
                   <div className="pt-1.5 md:pt-2 flex-1">
                     <h4 className="font-bold text-base md:text-lg mb-1"
                       style={{ color: isKickoffAgreed ? 'var(--gc-text)' : 'var(--gc-text-muted)' }}>그라운드 룰 숙지하기</h4>
                     <button onClick={() => { setShowJourneySheet(false); setShowRulesSheet(true); }}
                       className="mt-1.5 md:mt-2 px-3.5 md:px-4 py-2 rounded-full font-bold text-xs md:text-sm flex items-center gap-2 transition-colors"
                       style={isKickoffAgreed
                         ? { background: 'rgba(74,144,226,0.12)', color: 'var(--gc-blue)', border: '1.5px solid rgba(74,144,226,0.25)' }
                         : { background: 'var(--gc-input-bg)', color: 'var(--gc-text-muted)', border: '1.5px solid var(--gc-border)' }}>
                       팀원들의 약속 읽어보기
                     </button>
                   </div>
                 </div>

                 <div className={`relative z-10 flex gap-3 md:gap-4 ${isKickoffAgreed ? '' : 'opacity-40'}`}>
                   <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-md"
                     style={{ background: 'var(--gc-border)', color: 'var(--gc-text-muted)' }}>
                     <Flag size={20}/>
                   </div>
                   <div className="pt-2.5 md:pt-3">
                     <h4 className="font-bold text-base md:text-lg" style={{ color: 'var(--gc-text-muted)' }}>본격적인 프로젝트 시작!</h4>
                   </div>
                 </div>
              </div>
            </BottomSheet>

            <BottomSheet isOpen={showMembersSheet} onClose={() => setShowMembersSheet(false)} title="팀원 목록">
              <div className="space-y-3 md:space-y-4">
                 {team.members.map(member => (
                   <div key={member.id} onClick={() => { setShowMembersSheet(false); setSelectedMember(member); }}
                     className="flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer active:scale-95 transition-all gcard gcard-clickable"
                     style={{ padding: '12px 16px' }}>
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-bold text-lg md:text-2xl shrink-0 overflow-hidden"
                        style={{ background: `linear-gradient(to bottom, var(--gc-blue-top), var(--gc-blue))` }}>
                        {member.photoUrl ? <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" /> : member.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                          <span className="font-bold text-base md:text-xl">{member.name}</span>
                          <span className="text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full"
                            style={{ background: 'rgba(74,144,226,0.12)', color: 'var(--gc-blue)' }}>{member.role}</span>
                        </div>
                        <p className="text-xs md:text-sm font-medium truncate" style={{ color: 'var(--gc-text-muted)' }}>"{member.intro}"</p>
                      </div>
                      <ChevronRight className="shrink-0" size={20} style={{ color: 'var(--gc-text-muted)' }}/>
                   </div>
                 ))}
                 <button onClick={copyInviteLink}
                   className="w-full p-4 md:p-6 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm md:text-base transition-all"
                   style={{ border: '2px dashed var(--gc-tan)', color: 'var(--gc-text-sub)', background: 'var(--gc-input-bg)' }}>
                    <Ico name="Plus" size={18}/> 팀원 더 초대하기
                 </button>
              </div>
            </BottomSheet>

            <BottomSheet isOpen={showRulesSheet} onClose={() => setShowRulesSheet(false)} title="우리의 협업 약속">
               <div className="space-y-4 md:space-y-5">
                 {team.members.map(member => (
                   <div key={member.id} className="gcard space-y-3 md:space-y-4">
                     <div className="flex items-center gap-2 mb-1 md:mb-2">
                       <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                         style={{ background: `linear-gradient(to bottom, var(--gc-blue-top), var(--gc-blue))` }}>{member.name[0]}</div>
                       <span className="font-bold text-sm md:text-base">{member.name} 님의 약속</span>
                     </div>
                     <div className="p-3.5 md:p-4 rounded-xl md:rounded-2xl" style={{ background: 'rgba(232,84,84,0.06)', border: '1.5px solid rgba(232,84,84,0.2)' }}>
                       <h4 className="text-[10px] md:text-xs font-bold mb-1 flex items-center gap-1" style={{ color: '#E85454' }}><Ico name="Heart" size={12}/> 추구하는 가치</h4>
                       <p className="text-xs md:text-base font-medium" style={{ color: 'var(--gc-text)' }}>{member.pursuits || '-'}</p>
                     </div>
                     <div className="p-3.5 md:p-4 rounded-xl md:rounded-2xl" style={{ background: 'var(--gc-input-bg)', border: '1.5px solid var(--gc-border)' }}>
                       <h4 className="text-[10px] md:text-xs font-bold mb-1 flex items-center gap-1" style={{ color: 'var(--gc-text-sub)' }}><Ico name="Ban" size={12}/> 지양하는 방식</h4>
                       <p className="text-xs md:text-base font-medium" style={{ color: 'var(--gc-text)' }}>{member.avoid || '-'}</p>
                     </div>
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
                                  className="h-9 md:h-11 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all"
                                  style={
                                    isMine
                                      ? { background: `linear-gradient(to bottom, var(--gc-blue-top), var(--gc-blue))`, color: '#fff', boxShadow: `0 2px 0 var(--gc-blue-floor)`, outline: isProposed ? `2.5px solid var(--gc-gold)` : 'none', outlineOffset: '1px' }
                                      : count > 0
                                        ? { background: 'rgba(74,144,226,0.12)', color: 'var(--gc-blue)', outline: isProposed ? `2.5px solid var(--gc-gold)` : 'none', outlineOffset: '1px' }
                                        : { background: 'var(--gc-input-bg)', color: 'transparent', border: '1px solid var(--gc-border)' }
                                  }
                                >
                                  {count > 0 ? count : '·'}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Proposal card — always shown if a slot is proposed */}
                    {kickoff.proposal && (
                      <div className="gcard gcard-active space-y-3 md:space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ background: `linear-gradient(to bottom, var(--gc-blue-top), var(--gc-blue))` }}><Ico name="CalendarPlus" size={16}/></div>
                          <h4 className="font-bold text-sm md:text-base">제안된 킥오프 일정</h4>
                        </div>
                        <p className="text-xl md:text-2xl font-bold" style={{ color: 'var(--gc-blue)' }}>{kickoff.proposal.replace('-', ' ')}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs md:text-sm font-medium" style={{ color: 'var(--gc-text-sub)' }}>{Object.keys(kickoff.agreements || {}).length}/{team.members.length}명 동의</span>
                          <div className="flex gap-1">
                            {team.members.map(m => (
                              <div key={m.id} title={m.name} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                style={{ background: (kickoff.agreements || {})[m.id] ? 'var(--gc-green)' : 'var(--gc-border)' }}>
                                {m.name?.[0]}
                              </div>
                            ))}
                          </div>
                        </div>
                        {!(kickoff.agreements || {})[currentMemberId] ? (
                          <button onClick={agreeToProposal} className="gbtn gbtn-primary w-full">
                            동의하기
                          </button>
                        ) : (
                          <button onClick={disagreeFromProposal} className="gbtn gbtn-secondary w-full">
                            <CheckCircle2 size={16} style={{ color: 'var(--gc-green)' }}/> 동의 취소하기
                          </button>
                        )}
                      </div>
                    )}

                    {/* Recommended slots — always shown so other slots can be proposed */}
                    <div className="space-y-3 md:space-y-4">
                      <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--gc-text-muted)' }}>
                        {kickoff.proposal ? '다른 시간 제안하기' : '추천 시간대 (많이 겹치는 순)'}
                      </h4>
                      {getBestSlots(kickoff.availability).slice(0, 4).length > 0 ? (
                        getBestSlots(kickoff.availability).slice(0, 4).map(({ slot, count }) => (
                          <button
                            key={slot}
                            onClick={() => proposeSlot(slot)}
                            className="w-full gcard gcard-clickable flex justify-between items-center font-bold text-sm md:text-base"
                            style={{ padding: '14px 18px', opacity: kickoff.proposal === slot ? 0.5 : 1 }}
                          >
                            <span>{slot.replace('-', ' ')}</span>
                            <span className="text-xs md:text-sm px-2.5 py-1 rounded-full"
                              style={{ color: 'var(--gc-blue)', background: 'rgba(74,144,226,0.12)' }}>{count}명 가능</span>
                          </button>
                        ))
                      ) : (
                        <p className="text-xs md:text-sm font-medium text-center py-6" style={{ color: 'var(--gc-text-muted)' }}>팀원들이 가능 시간을 선택하면 추천 시간이 표시됩니다.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </BottomSheet>

            <div className="absolute top-3 md:top-8 w-[calc(100%-1.5rem)] md:w-[calc(100%-2rem)] max-w-sm md:max-w-md left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 md:gap-2.5">
              <div
                onClick={() => setShowJourneySheet(true)}
                className="w-full gwidget p-3 md:p-3.5 animate-in slide-in-from-top-4 duration-700 flex flex-col gap-2.5 md:gap-3 cursor-pointer hover:scale-[1.02] transition-all group"
              >
                <div className="flex justify-between items-center px-1">
                  <span className="font-bold text-[11px] md:text-sm uppercase tracking-wider flex items-center gap-2"
                    style={{ color: isAligned ? 'var(--gc-green)' : 'var(--gc-blue)' }}>
                    {isAligned ? 'Ready to Kick-off 🚀' : '우리의 여정 🏃'}
                  </span>
                  <span className="font-bold text-[10px] md:text-[11px] px-2 py-0.5 md:py-1 rounded-full"
                    style={{ background: 'var(--gc-input-bg)', color: 'var(--gc-text-sub)', border: '1.5px solid var(--gc-border)' }}>
                    {currentMembers} / {targetMembers} 합류
                  </span>
                </div>
                <div className="flex items-center gap-2.5 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md border-2 border-white font-bold shrink-0 transition-colors"
                    style={{ background: isAligned ? 'linear-gradient(135deg, #5BB85C, #3B7C3C)' : 'linear-gradient(135deg, #FFD54F, #FFCA28)', color: isAligned ? '#fff' : '#7A5C00' }}>
                     {isAligned ? <Ico name="Flag" size={20} /> : <Ico name="Zap" size={20} />}
                  </div>
                  <div className="flex-1 gprogress-track">
                     <div className="gprogress-fill" style={{ width: `${Math.min((currentMembers / targetMembers) * 100, 100)}%` }} />
                  </div>
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ color: 'var(--gc-text-muted)' }}>
                    <ChevronRight size={18}/>
                  </div>
                </div>
              </div>

              {/* Cheer + BGM row — always below the progress widget */}
              <div className="flex items-center gap-2 w-full justify-center">
                <button
                  onClick={handleCheer}
                  disabled={isJumping || getSceneMembers().length === 0}
                  className="gbtn gbtn-primary animate-in slide-in-from-top-4 duration-700 disabled:opacity-40"
                  style={{ fontSize: '16px', padding: '14px 24px', boxShadow: '0 5px 0 var(--gc-blue-floor), 0 8px 24px rgba(58,126,204,0.45)', flex: 1 }}
                >
                  <Ico name="Party" size={22} className={isJumping ? 'animate-spin' : ''}/>
                  우리 팀 응원하기
                </button>
                <button
                  onClick={() => { playSfx(); const next = !isMuted; setIsMuted(next); if (!next) playBgm(); else pauseBgm(); }}
                  className="gbtn gbtn-secondary animate-in slide-in-from-top-4 duration-700"
                  style={{ padding: '14px 14px', flexShrink: 0 }}
                  title={isMuted ? 'BGM 켜기' : 'BGM 끄기'}
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>
            </div>

            <div className="absolute bottom-0 md:bottom-6 w-full max-w-md md:max-w-2xl lg:max-w-4xl flex items-center justify-around px-6 md:px-16 z-50 transition-all py-3 md:py-4"
              style={{ paddingBottom: 'max(12px, calc(env(safe-area-inset-bottom) + 8px))' }}>
               <button className="flex flex-col items-center gap-1.5 p-1.5 transition-all active:scale-90">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(to bottom, var(--gc-blue-top), var(--gc-blue))', boxShadow: '0 3px 0 var(--gc-blue-floor)', padding: '6px' }}>
                    <Ico name="Home" size={28} />
                  </div>
                  <span className="font-bold text-[10px]" style={{ color: '#fff' }}>홈</span>
               </button>
               <button onClick={() => setShowMembersSheet(true)} className="flex flex-col items-center gap-1.5 p-1.5 transition-all active:scale-90">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(to bottom, #FFFEF8, #F5E5C4)', border: '1.5px solid var(--gc-tan)', boxShadow: '0 3px 0 var(--gc-gold-floor)', padding: '6px' }}>
                    <Ico name="Users" size={28} />
                  </div>
                  <span className="font-bold text-[10px]" style={{ color: '#fff' }}>멤버</span>
               </button>
               <button onClick={() => setShowRulesSheet(true)} className="flex flex-col items-center gap-1.5 p-1.5 transition-all active:scale-90">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(to bottom, #FFFEF8, #F5E5C4)', border: '1.5px solid var(--gc-tan)', boxShadow: '0 3px 0 var(--gc-gold-floor)', padding: '6px' }}>
                    <Ico name="Heart" size={28} />
                  </div>
                  <span className="font-bold text-[10px]" style={{ color: '#fff' }}>약속</span>
               </button>
               <button onClick={() => setShowKickoffSheet(true)} className="flex flex-col items-center gap-1.5 p-1.5 transition-all active:scale-90">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(to bottom, #FFFEF8, #F5E5C4)', border: '1.5px solid var(--gc-tan)', boxShadow: '0 3px 0 var(--gc-gold-floor)', padding: '6px' }}>
                    <Ico name="CalendarPlus" size={28} />
                  </div>
                  <span className="font-bold text-[10px]" style={{ color: '#fff' }}>일정</span>
               </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
