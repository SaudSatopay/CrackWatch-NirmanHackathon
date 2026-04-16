import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Target, Zap, Star, Award, ChevronRight, Brain, Shield, Coins, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ProfileCard({ profile }) {
  if (!profile) return null;
  const xpForNext = profile.xp_to_next_level || 1000;
  const xpProgress = Math.min(100, (profile.xp / xpForNext) * 100);

  return (
    <div className="bg-gradient-to-br from-[#4edea3]/[0.08] to-[#5de6ff]/[0.04] rounded-2xl p-5 border border-[#4edea3]/15">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#4edea3] to-[#5de6ff] flex items-center justify-center">
          <span className="text-2xl font-black text-black">{profile.level}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-white">{profile.name}</h3>
          <p className="text-[11px] text-white/40">Level {profile.level} · {profile.total_reports} reports</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-[#ffa94d]">
            <Coins className="w-4 h-4" />
            <span className="text-lg font-bold">{profile.coins}</span>
          </div>
          <p className="text-[9px] text-white/30">coins</p>
        </div>
      </div>

      {/* XP bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-[#4edea3] font-bold">{profile.xp} XP</span>
          <span className="text-white/30">{xpForNext} XP to level {profile.level + 1}</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-[#4edea3] to-[#5de6ff]"
            initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1 }} />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center bg-white/[0.03] rounded-lg py-2">
          <div className="text-lg font-bold text-white">{profile.streak_days}</div>
          <div className="text-[8px] text-white/30">🔥 Streak</div>
        </div>
        <div className="text-center bg-white/[0.03] rounded-lg py-2">
          <div className="text-lg font-bold text-white">{profile.achievements?.length || 0}</div>
          <div className="text-[8px] text-white/30">🏅 Badges</div>
        </div>
        <div className="text-center bg-white/[0.03] rounded-lg py-2">
          <div className="text-lg font-bold text-white">{profile.total_reports}</div>
          <div className="text-[8px] text-white/30">📸 Reports</div>
        </div>
      </div>
    </div>
  );
}

function Leaderboard({ data }) {
  if (!data?.length) return <p className="text-sm text-white/30 text-center py-6">Be the first on the leaderboard!</p>;
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-2">
      {data.map((entry, i) => (
        <motion.div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
          i < 3 ? 'bg-[#ffa94d]/[0.04] border border-[#ffa94d]/10' : 'bg-white/[0.02]'
        }`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
          <div className="w-8 text-center">
            {i < 3 ? <span className="text-xl">{medals[i]}</span> : <span className="text-sm text-white/30 font-bold">#{entry.rank}</span>}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{entry.name}</p>
            <p className="text-[10px] text-white/30">Lv.{entry.level} · {entry.total_reports} reports · 🔥{entry.streak_days}d</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#4edea3]">{entry.xp} XP</p>
            {entry.top_achievement && <p className="text-[9px] text-white/30">{entry.top_achievement}</p>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Challenges({ data }) {
  if (!data?.length) return <p className="text-sm text-white/30 text-center py-6">No challenges today</p>;

  return (
    <div className="space-y-2">
      {data.map((c, i) => (
        <motion.div key={c.id} className={`p-3 rounded-xl border ${
          c.completed ? 'bg-[#4edea3]/[0.04] border-[#4edea3]/15' : 'bg-white/[0.02] border-white/[0.04]'
        }`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-white">{c.name}</p>
            {c.completed ? <span className="text-[10px] text-[#4edea3] font-bold">✓ Done!</span> :
              <span className="text-[10px] text-white/30">{c.progress}/{c.target}</span>}
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#4edea3] to-[#5de6ff] transition-all"
              style={{ width: `${Math.min(100, (c.progress / c.target) * 100)}%` }} />
          </div>
          <div className="flex gap-3 mt-1.5 text-[9px] text-white/30">
            <span>+{c.xp} XP</span><span>+{c.coins} coins</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AIChallenge({ userId }) {
  const [round, setRound] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ played: 0, correct: 0 });

  const loadRound = async () => {
    setSelected(null); setResult(null); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/gamification/ai-challenge`);
      setRound(await res.json());
    } catch {}
    setLoading(false);
  };

  const submitAnswer = async (answer) => {
    setSelected(answer);
    try {
      const fd = new FormData();
      fd.append('user_id', userId);
      fd.append('answer', answer);
      fd.append('correct_answer', round.correct_answer);
      const res = await fetch(`${API_URL}/gamification/ai-challenge/answer`, { method: 'POST', body: fd });
      const data = await res.json();
      setResult(data);
      setStats({ played: data.total_played, correct: data.accuracy });
    } catch {}
  };

  useEffect(() => { loadRound(); }, []);

  if (loading) return <div className="text-center py-8"><div className="w-6 h-6 border-2 border-[#4edea3] border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      {round && (
        <>
          <div className="bg-white/[0.03] rounded-xl p-4">
            <p className="text-[10px] text-[#5de6ff] uppercase tracking-wider font-bold mb-2">🤖 What type of damage is this?</p>
            <p className="text-sm text-white font-medium leading-relaxed">"{round.scenario}"</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {round.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrect = result && opt === round.correct_answer;
              const isWrong = result && isSelected && !result.correct;
              return (
                <motion.button key={opt} onClick={() => !result && submitAnswer(opt)}
                  disabled={!!result}
                  className={`p-3 rounded-xl text-xs font-semibold text-left transition-all border ${
                    isCorrect ? 'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]' :
                    isWrong ? 'bg-[#ff6b6b]/10 border-[#ff6b6b]/30 text-[#ff6b6b]' :
                    isSelected ? 'bg-[#5de6ff]/10 border-[#5de6ff]/30 text-[#5de6ff]' :
                    'bg-white/[0.03] border-white/[0.04] text-white/70 hover:border-white/10'
                  }`}
                  whileTap={!result ? { scale: 0.97 } : {}}>
                  {opt}
                  {isCorrect && ' ✓'}
                  {isWrong && ' ✗'}
                </motion.button>
              );
            })}
          </div>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl text-center ${result.correct ? 'bg-[#4edea3]/[0.06]' : 'bg-[#ff6b6b]/[0.06]'}`}>
              <p className={`text-sm font-bold ${result.correct ? 'text-[#4edea3]' : 'text-[#ff6b6b]'}`}>
                {result.correct ? '🎉 Correct! +10 XP' : `❌ Wrong — it was ${result.correct_answer}`}
              </p>
              <p className="text-[10px] text-white/30 mt-1">Accuracy: {result.accuracy}% ({stats.played} played)</p>
            </motion.div>
          )}

          {result && (
            <motion.button onClick={loadRound} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full py-3 rounded-xl bg-white/[0.06] text-white/60 font-semibold text-sm">
              Next Round →
            </motion.button>
          )}
        </>
      )}
    </div>
  );
}

function Achievements({ data }) {
  if (!data?.length) return <p className="text-sm text-white/30 text-center py-6">No achievements yet. Start reporting!</p>;

  return (
    <div className="grid grid-cols-2 gap-2">
      {data.map((a, i) => (
        <motion.div key={i} className="p-3 rounded-xl bg-[#ffa94d]/[0.04] border border-[#ffa94d]/10 text-center"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
          <p className="text-lg mb-1">{a.name.split(' ')[0]}</p>
          <p className="text-[10px] font-bold text-white">{a.name.split(' ').slice(1).join(' ')}</p>
          <p className="text-[9px] text-white/30 mt-0.5">{a.desc}</p>
          <p className="text-[9px] text-[#4edea3] mt-1">+{a.xp} XP · +{a.coins} coins</p>
        </motion.div>
      ))}
    </div>
  );
}

export default function GamificationPage({ userName }) {
  const userId = userName || 'Citizen';
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/gamification/profile/${userId}`).then(r => r.json()).catch(() => null),
      fetch(`${API_URL}/gamification/leaderboard`).then(r => r.json()).catch(() => ({ leaderboard: [] })),
      fetch(`${API_URL}/gamification/challenges/${userId}`).then(r => r.json()).catch(() => ({ challenges: [] })),
      fetch(`${API_URL}/gamification/achievements`).then(r => r.json()).catch(() => ({ achievements: [] })),
    ]).then(([p, l, c, a]) => {
      setProfile(p);
      setLeaderboard(l?.leaderboard || []);
      setChallenges(c?.challenges || []);
      setAchievements(a?.achievements || []);
    });
  }, [userId]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'leaderboard', label: 'Rank', icon: Trophy },
    { id: 'challenges', label: 'Quests', icon: Target },
    { id: 'ai', label: 'AI Game', icon: Brain },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
          🏆 Pothole Hunter
        </h1>
        <p className="text-[12px] text-white/40 mt-1">Earn XP, coins & badges by reporting damage</p>
      </div>

      <div className="px-5 pb-8 space-y-4">
        {/* Tab selector */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03]">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                tab === t.id ? 'bg-[#4edea3]/10 text-[#4edea3]' : 'text-white/30'
              }`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <ProfileCard profile={profile} />
              <div>
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#ffa94d]" /> Your Achievements
                </h3>
                <Achievements data={profile?.achievements_detail || []} />
              </div>
            </motion.div>
          )}
          {tab === 'leaderboard' && (
            <motion.div key="lb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#ffa94d]" /> Top Pothole Hunters
              </h3>
              <Leaderboard data={leaderboard} />
            </motion.div>
          )}
          {tab === 'challenges' && (
            <motion.div key="ch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#5de6ff]" /> Today's Challenges
              </h3>
              <Challenges data={challenges} />
            </motion.div>
          )}
          {tab === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-400" /> AI Challenge Mode
              </h3>
              <p className="text-xs text-white/30 mb-4">Guess the damage type — earn XP for correct answers!</p>
              <AIChallenge userId={userId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
