import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Target, Zap, Star, Award, Brain, Shield, Coins, User, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function ProfileCard({ profile }) {
  if (!profile) return null;
  const xpForNext = profile.xp_to_next_level || 1000;
  const xpPct = Math.min(100, (profile.xp / xpForNext) * 100);

  return (
    <div className="bg-gradient-to-br from-[#4edea3]/[0.08] to-[#5de6ff]/[0.04] rounded-2xl p-5 border border-[#4edea3]/15">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4edea3] to-[#5de6ff] flex items-center justify-center shadow-lg shadow-[#4edea3]/20">
          <span className="text-3xl font-black text-black" style={{ fontFamily: 'Space Grotesk' }}>{profile.level}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{profile.name}</h3>
          <p className="text-xs text-white/40">Level {profile.level} · {profile.total_reports} reports</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-[#ffa94d]">
            <Coins className="w-5 h-5" />
            <span className="text-2xl font-bold">{profile.coins}</span>
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[#4edea3] font-bold">{profile.xp} XP</span>
          <span className="text-white/25">{xpForNext} to Lv.{profile.level + 1}</span>
        </div>
        <div className="w-full h-3 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-[#4edea3] to-[#5de6ff]"
            initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1.2 }} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: profile.streak_days, label: 'Day Streak', icon: '🔥' },
          { value: profile.achievements?.length || 0, label: 'Badges', icon: '🏅' },
          { value: profile.total_reports, label: 'Reports', icon: '📸' },
        ].map((s, i) => (
          <div key={i} className="text-center bg-white/[0.04] rounded-xl py-3">
            <span className="text-base">{s.icon}</span>
            <div className="text-xl font-bold text-white mt-1">{s.value}</div>
            <div className="text-[9px] text-white/30 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AllAchievements({ earned, allAchievements }) {
  return (
    <div className="space-y-3 mt-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <Award className="w-4 h-4 text-[#ffa94d]" /> Achievements
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        {allAchievements.map((a, i) => {
          const isEarned = earned?.includes(a.id);
          return (
            <motion.div key={a.id} className={`p-3.5 rounded-xl text-center border transition-all ${
              isEarned ? 'bg-[#ffa94d]/[0.06] border-[#ffa94d]/15' : 'bg-white/[0.015] border-white/[0.03] opacity-40'
            }`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: isEarned ? 1 : 0.4, scale: 1 }} transition={{ delay: i * 0.03 }}>
              <p className="text-2xl mb-1">{a.name.split(' ')[0]}</p>
              <p className="text-[11px] font-bold text-white">{a.name.split(' ').slice(1).join(' ')}</p>
              <p className="text-[9px] text-white/30 mt-1 leading-relaxed">{a.desc}</p>
              {isEarned && <p className="text-[9px] text-[#4edea3] mt-1.5 font-bold">✓ Earned</p>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Leaderboard({ data }) {
  if (!data?.length) return <p className="text-sm text-white/30 text-center py-10">No players yet. Be the first!</p>;
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-2.5">
      {/* Top 3 podium */}
      {data.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-4 pt-4">
          {[data[1], data[0], data[2]].map((e, i) => {
            const heights = ['h-20', 'h-28', 'h-16'];
            const order = [1, 0, 2];
            return (
              <motion.div key={order[i]} className="text-center flex-1" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
                <p className="text-2xl mb-1">{medals[order[i]]}</p>
                <p className="text-[11px] font-bold text-white truncate">{e.name.split(' ')[0]}</p>
                <p className="text-[10px] text-[#4edea3] font-bold">{e.xp} XP</p>
                <div className={`${heights[i]} bg-gradient-to-t from-[#4edea3]/10 to-transparent rounded-t-xl mt-2 flex items-end justify-center pb-2`}>
                  <span className="text-[9px] text-white/30">Lv.{e.level}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      {data.map((entry, i) => (
        <motion.div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
          i < 3 ? 'bg-[#ffa94d]/[0.03]' : 'bg-white/[0.02]'
        }`} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
          <div className="w-7 text-center shrink-0">
            {i < 3 ? <span className="text-lg">{medals[i]}</span> : <span className="text-xs text-white/25 font-bold">#{entry.rank}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
            <p className="text-[10px] text-white/25">{entry.total_reports} rpts · 🔥{entry.streak_days}d</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-[#4edea3]">{entry.xp}</p>
            <p className="text-[9px] text-white/20">Lv.{entry.level}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Challenges({ data }) {
  if (!data?.length) return <p className="text-sm text-white/30 text-center py-10">No challenges today</p>;

  return (
    <div className="space-y-3">
      {data.map((c, i) => (
        <motion.div key={c.id} className={`p-4 rounded-xl border ${
          c.completed ? 'bg-[#4edea3]/[0.04] border-[#4edea3]/15' : 'bg-white/[0.02] border-white/[0.04]'
        }`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-sm font-semibold text-white">{c.name}</p>
            {c.completed ? <span className="text-xs text-[#4edea3] font-bold px-2 py-0.5 rounded-full bg-[#4edea3]/10">✓ Done</span> :
              <span className="text-xs text-white/30">{c.progress}/{c.target}</span>}
          </div>
          <div className="w-full h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#4edea3] to-[#5de6ff] transition-all duration-700"
              style={{ width: `${Math.min(100, (c.progress / c.target) * 100)}%` }} />
          </div>
          <div className="flex gap-4 mt-2 text-[10px] text-white/25">
            <span>🎯 +{c.xp} XP</span><span>💰 +{c.coins} coins</span>
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
  const [score, setScore] = useState({ played: 0, accuracy: 0 });

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
      setScore({ played: data.total_played, accuracy: data.accuracy });
    } catch {}
  };

  useEffect(() => { loadRound(); }, []);

  if (loading) return <div className="text-center py-16"><div className="w-8 h-8 border-2 border-[#4edea3] border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-4">
      {score.played > 0 && (
        <div className="flex gap-3 mb-2">
          <div className="flex-1 bg-white/[0.03] rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-[#4edea3]">{score.accuracy}%</div>
            <div className="text-[9px] text-white/25">Accuracy</div>
          </div>
          <div className="flex-1 bg-white/[0.03] rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white">{score.played}</div>
            <div className="text-[9px] text-white/25">Played</div>
          </div>
        </div>
      )}

      {round && (
        <>
          <div className="bg-gradient-to-br from-violet-500/[0.06] to-[#5de6ff]/[0.04] rounded-xl p-5 border border-violet-500/10">
            <p className="text-[10px] text-violet-400 uppercase tracking-wider font-bold mb-3">🤖 Identify the damage</p>
            <p className="text-base text-white font-medium leading-relaxed">"{round.scenario}"</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {round.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrect = result && opt === round.correct_answer;
              const isWrong = result && isSelected && !result.correct;
              return (
                <motion.button key={opt} onClick={() => !result && submitAnswer(opt)} disabled={!!result}
                  className={`p-4 rounded-xl text-sm font-semibold text-left transition-all border ${
                    isCorrect ? 'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]' :
                    isWrong ? 'bg-[#ff6b6b]/10 border-[#ff6b6b]/30 text-[#ff6b6b]' :
                    isSelected ? 'bg-[#5de6ff]/10 border-[#5de6ff]/30 text-[#5de6ff]' :
                    'bg-white/[0.03] border-white/[0.04] text-white/60 active:bg-white/[0.06]'
                  }`} whileTap={!result ? { scale: 0.97 } : {}}>
                  {opt} {isCorrect && '✓'} {isWrong && '✗'}
                </motion.button>
              );
            })}
          </div>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl text-center ${result.correct ? 'bg-[#4edea3]/[0.06]' : 'bg-[#ff6b6b]/[0.06]'}`}>
              <p className={`text-lg font-bold ${result.correct ? 'text-[#4edea3]' : 'text-[#ff6b6b]'}`}>
                {result.correct ? '🎉 Correct!' : '❌ Wrong!'}
              </p>
              <p className="text-xs text-white/40 mt-1">
                {result.correct ? '+50 XP earned' : `Answer was: ${result.correct_answer}`}
              </p>
            </motion.div>
          )}

          {result && (
            <motion.button onClick={loadRound} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4edea3] to-[#10b981] text-[#002113] font-bold text-sm">
              Next Round →
            </motion.button>
          )}
        </>
      )}
    </div>
  );
}

export default function GamificationPage({ userName }) {
  const userId = userName || 'Citizen';
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]);

  useEffect(() => {
    const encodedId = encodeURIComponent(userId);
    Promise.all([
      fetch(`${API_URL}/gamification/profile/${encodedId}`).then(r => r.json()).catch(() => null),
      fetch(`${API_URL}/gamification/leaderboard`).then(r => r.json()).catch(() => ({ leaderboard: [] })),
      fetch(`${API_URL}/gamification/challenges/${encodedId}`).then(r => r.json()).catch(() => ({ challenges: [] })),
      fetch(`${API_URL}/gamification/achievements`).then(r => r.json()).catch(() => ({ achievements: [] })),
    ]).then(([p, l, c, a]) => {
      setProfile(p);
      setLeaderboard(l?.leaderboard || []);
      setChallenges(c?.challenges || []);
      setAllAchievements(a?.achievements || []);
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
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
          🏆 Pothole Hunter
        </h1>
        <p className="text-xs text-white/40 mt-1">Earn XP, coins & badges by reporting damage</p>
      </div>

      <div className="px-5 pb-8">
        {/* Tab selector */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl text-xs font-bold transition-all border ${
                tab === t.id
                  ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/20'
                  : 'bg-white/[0.03] text-white/40 border-transparent active:bg-white/[0.06]'
              }`}>
              <t.icon className="w-5 h-5" />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ProfileCard profile={profile} />
              <AllAchievements earned={profile?.achievements} allAchievements={allAchievements} />
            </motion.div>
          )}
          {tab === 'leaderboard' && (
            <motion.div key="lb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Leaderboard data={leaderboard} />
            </motion.div>
          )}
          {tab === 'challenges' && (
            <motion.div key="ch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-[#5de6ff]" /> Today's Challenges
              </h3>
              <Challenges data={challenges} />
              {/* Tip card to fill space */}
              <div className="bg-gradient-to-br from-violet-500/[0.04] to-[#5de6ff]/[0.03] rounded-xl p-5 border border-violet-500/10 mt-4">
                <p className="text-xs text-violet-400 font-bold mb-2">💡 Pro Tips</p>
                <ul className="space-y-2 text-xs text-white/40">
                  <li>• Report potholes in different areas to earn the 🔍 Inspector badge</li>
                  <li>• Upload 3 reports in 1 hour for ⚡ Fast Reporter achievement</li>
                  <li>• Maintain a daily streak for bonus XP multipliers</li>
                  <li>• Verify other reports to earn the ✅ Verifier badge</li>
                </ul>
              </div>
            </motion.div>
          )}
          {tab === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-violet-400" /> AI Challenge
                </h3>
                <span className="text-xs text-white/25">Test your knowledge</span>
              </div>
              <AIChallenge userId={userId} />
              {/* How it works card */}
              <div className="bg-white/[0.02] rounded-xl p-5 border border-white/[0.04] mt-2">
                <p className="text-xs text-white/40 font-bold mb-3">How it works</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { step: '1', title: 'Read', desc: 'AI describes a damage scenario' },
                    { step: '2', title: 'Guess', desc: 'Pick the correct damage type' },
                    { step: '3', title: 'Earn', desc: '+50 XP for correct answers' },
                  ].map(s => (
                    <div key={s.step} className="text-center">
                      <div className="w-8 h-8 rounded-full bg-[#4edea3]/10 text-[#4edea3] text-sm font-bold flex items-center justify-center mx-auto mb-2">{s.step}</div>
                      <p className="text-xs font-semibold text-white">{s.title}</p>
                      <p className="text-[10px] text-white/25 mt-0.5">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
