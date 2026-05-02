import { supabase, isSupabaseReady } from './supabase';

// ─── shape converters ────────────────────────────────────────────────────────

const toMember = (row) => ({
  id: row.id,
  name: row.name,
  role: row.role,
  generation: row.generation || '34기',
  phone: row.phone || '',
  snsLink: row.sns_link || '',
  photoUrl: row.photo_url || '',
  portfolioLinks: row.portfolio_links || [],
  workItems: row.work_items || [],
  workStyles: row.work_styles || [],
  styleReasons: row.style_reasons || {},
  researchTopics: row.research_topics || [],
  researchSubject: row.research_subject || '',
  schedule: row.schedule || { start: '오전', night: '비선호', place: '출퇴근' },
  pursuits: row.pursuits || '',
  avoid: row.avoid || '',
  intro: row.intro || '',
});

const fromMember = (member, teamId) => ({
  id: member.id,
  team_id: teamId,
  name: member.name,
  role: member.role,
  generation: member.generation,
  phone: member.phone || '',
  sns_link: member.snsLink || '',
  photo_url: member.photoUrl || '',
  portfolio_links: member.portfolioLinks || [],
  work_items: member.workItems || [],
  work_styles: member.workStyles || [],
  style_reasons: member.styleReasons || {},
  research_topics: member.researchTopics || [],
  research_subject: member.researchSubject || '',
  schedule: member.schedule || {},
  pursuits: member.pursuits || '',
  avoid: member.avoid || '',
  intro: member.intro || '',
  created_at: Date.now(),
});

// ─── public API ──────────────────────────────────────────────────────────────

export const getTeam = async (teamId) => {
  if (!isSupabaseReady) return null;
  const { data: t, error } = await supabase
    .from('align_teams').select('*').eq('id', teamId).single();
  if (error || !t) return null;

  const { data: rows } = await supabase
    .from('align_members').select('*').eq('team_id', teamId)
    .order('created_at', { ascending: true });

  return {
    id: t.id,
    name: t.name,
    category: t.category,
    targetSize: t.target_size,
    kickoff: t.kickoff || {},
    createdAt: t.created_at,
    members: (rows || []).map(toMember),
  };
};

export const createTeam = async (team) => {
  if (!isSupabaseReady) return;
  const { error } = await supabase.from('align_teams').insert({
    id: team.id,
    name: team.name,
    category: team.category,
    target_size: team.targetSize,
    kickoff: team.kickoff || {},
    created_at: team.createdAt || Date.now(),
  });
  if (error) console.error('createTeam:', error);
};

export const addMember = async (teamId, member) => {
  if (!isSupabaseReady) return;
  const { error } = await supabase.from('align_members').insert(fromMember(member, teamId));
  if (error) console.error('addMember:', error);
};

export const updateKickoff = async (teamId, kickoff) => {
  if (!isSupabaseReady) return;
  const { error } = await supabase
    .from('align_teams').update({ kickoff }).eq('id', teamId);
  if (error) console.error('updateKickoff:', error);
};

// Returns an unsubscribe fn. onMembersChange(members[]) / onKickoffChange(kickoff)
export const subscribeTeam = (teamId, { onMembersChange, onKickoffChange }) => {
  if (!isSupabaseReady) return () => {};

  const ch = supabase.channel(`team-${teamId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'align_members', filter: `team_id=eq.${teamId}` },
      async () => {
        const { data } = await supabase
          .from('align_members').select('*').eq('team_id', teamId)
          .order('created_at', { ascending: true });
        onMembersChange?.((data || []).map(toMember));
      }
    )
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'align_teams', filter: `id=eq.${teamId}` },
      ({ new: row }) => onKickoffChange?.(row.kickoff || {})
    )
    .subscribe();

  return () => supabase.removeChannel(ch);
};
