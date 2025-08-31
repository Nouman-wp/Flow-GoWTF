import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Characters and Enemies Data
const CHARACTERS = [
  {
    id: 'yuji',
    name: 'Yuji Itadori',
    avatar: 'https://static.beebom.com/wp-content/uploads/2024/04/jujutsu-kaisen-yuji_053166.jpg?w=1024',
    element: 'Fire',
    description:
      "A strong-willed student with superhuman strength and Sukuna's vessel.",
    stats: { hp: 120, attack: 85, defense: 75, speed: 80 },
    abilities: {
      special: { name: 'Divergent Fist', cost: 25, damage: 30 },
      ultimate: { name: 'Black Flash', damage: 60 },
    },
  },
  {
    id: 'megumi',
    name: 'Megumi Fushiguro',
    avatar:
      'https://m.media-amazon.com/images/I/51EzhSHfsZL._AC_UF1000,1000_QL80_.jpg',
    element: 'Dark',
    description:
      'A stoic sorcerer who summons powerful shikigami using shadows.',
    stats: { hp: 100, attack: 70, defense: 90, speed: 85 },
    abilities: {
      special: { name: 'Divine Dogs', cost: 20, damage: 25 },
      ultimate: { name: 'Mahoraga', damage: 80 },
    },
  },
  {
    id: 'nobara',
    name: 'Nobara Kugisaki',
    avatar:
      'https://a1cf74336522e87f135f-2f21ace9a6cf0052456644b80fa06d4f.ssl.cf2.rackcdn.com/images/characters/large/800/Nobara-Kugisaki.Jujutsu-Kaisen.webp',
    element: 'Earth',
    description:
      'A confident sorcerer who wields cursed tools and straw doll technique.',
    stats: { hp: 95, attack: 90, defense: 70, speed: 75 },
    abilities: {
      special: { name: 'Hairpin', cost: 30, damage: 35 },
      ultimate: { name: 'Resonance', damage: 70 },
    },
  },
  {
    id: 'gojo',
    name: 'Satoru Gojo',
    avatar: 'https://i.scdn.co/image/ab67616d00001e02469cb4f2e0a31eb0c2b5a320',
    element: 'Light',
    description:
      'The strongest jujutsu sorcerer with the Six Eyes and Limitless technique.',
    stats: { hp: 150, attack: 100, defense: 95, speed: 100 },
    abilities: {
      special: { name: 'Blue', cost: 35, damage: 40 },
      ultimate: { name: 'Hollow Purple', damage: 100 },
    },
  },
];

const ENEMIES = [
  {
    name: 'Mahito',
    avatar:
      'https://static1.srcdn.com/wordpress/wp-content/uploads/2023/12/mahito-grins-creepily-in-jujutsu-kaisen.jpg',
    element: 'Dark',
    stats: { hp: 110, attack: 80, defense: 70, speed: 85 },
  },
  {
    name: 'Sukuna',
    avatar:
      'https://static1.srcdn.com/wordpress/wp-content/uploads/2024/09/sukuna-mad-1.jpg?q=70&fit=contain&w=1200&h=628&dpr=1',
    element: 'Fire',
    stats: { hp: 200, attack: 120, defense: 100, speed: 95 },
  },
  {
    name: 'Jogo',
    avatar: 'https://media.japanesewithanime.com/uploads/jougo-jujutsu-taisen-ep06.jpg',
    element: 'Fire',
    stats: { hp: 130, attack: 95, defense: 60, speed: 90 },
  },
  {
    name: 'Hanami',
    avatar:
      'https://mir-s3-cdn-cf.behance.net/project_modules/fs/a5d792116043133.605a2e3f546b5.jpg',
    element: 'Earth',
    stats: { hp: 140, attack: 85, defense: 110, speed: 70 },
  },
  {
    name: 'Dagon',
    avatar:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7oqqEY74Nd5tOrPrkCDd0DQN1gZ9Wglh2zg&s',
    element: 'Water',
    stats: { hp: 120, attack: 90, defense: 80, speed: 85 },
  },
];

function useAudio(enabled) {
  const contextRef = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    if (!contextRef.current) {
      try {
        // WebAudio lazy init on first user interaction
        const onFirstInteract = () => {
          if (!contextRef.current) {
            contextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          document.removeEventListener('click', onFirstInteract);
        };
        document.addEventListener('click', onFirstInteract);
        return () => document.removeEventListener('click', onFirstInteract);
      } catch {
        // ignore
      }
    }
  }, [enabled]);

  const play = useCallback(
    (frequency, duration, type = 'sine', volume = 0.08) => {
      const ctx = contextRef.current;
      if (!ctx || !enabled) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = frequency;
        osc.type = type;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // ignore
      }
    },
    [enabled]
  );

  return { play };
}

function StatBar({ label, value, max, colorClass, blinkWhenFull }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-semibold">{value}/{max}</span>
      </div>
      <div className="h-2 w-full bg-gray-700 rounded-md overflow-hidden">
        <div
          className={`h-2 ${colorClass} rounded-md transition-all duration-300 relative ${
            blinkWhenFull && value >= max ? 'animate-pulse' : ''
          }`}
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>
    </div>
  );
}

function FighterCard({ side, fighter }) {
  return (
    <div className={`bg-gray-800/80 border border-white/10 rounded-2xl p-6 ${
      side === 'left' ? 'text-left' : 'text-right'
    }`}>
      <div className={`flex items-center ${side === 'left' ? '' : 'flex-row-reverse'}`}>
        <img
          src={fighter.avatar}
          alt={fighter.name}
          className={`w-20 h-20 rounded-full object-cover border-4 ${
            side === 'left' ? 'border-blue-500' : 'border-red-500'
          } ${side === 'left' ? 'mr-4' : 'ml-4'}`}
        />
        <div>
          <div className="text-xl font-bold text-white">{fighter.name}</div>
          <div className="text-emerald-400 text-xs uppercase tracking-wide">{fighter.element} Element</div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <StatBar label="Health" value={fighter.hp} max={fighter.maxHp} colorClass="bg-gradient-to-r from-rose-500 to-rose-400" />
        <StatBar label="Energy" value={fighter.energy} max={fighter.maxEnergy} colorClass="bg-gradient-to-r from-sky-500 to-sky-400" />
        <StatBar label="Ultimate" value={fighter.ultimate} max={fighter.maxUltimate} colorClass="bg-gradient-to-r from-amber-400 to-orange-400" blinkWhenFull />
      </div>
    </div>
  );
}

function ActionButtons({ canAct, onAttack, onBlock, onSpecial, onUltimate, specialName, specialCost, ultimateReady }) {
  const base = 'px-5 py-3 rounded-xl text-white font-semibold shadow hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-6">
      <button disabled={!canAct} onClick={onAttack} className={`${base} bg-gradient-to-br from-rose-600 to-rose-500`}>
        ⚔️ Attack
      </button>
      <button disabled={!canAct} onClick={onBlock} className={`${base} bg-gradient-to-br from-sky-600 to-sky-500`}>
        🛡️ Block
      </button>
      <button disabled={!canAct} onClick={onSpecial} className={`${base} bg-gradient-to-br from-violet-600 to-violet-500`}>
        ⚡ {specialName} <span className="text-white/80 font-normal ml-1">({specialCost} EN)</span>
      </button>
      <button disabled={!canAct || !ultimateReady} onClick={onUltimate} className={`${base} ${ultimateReady ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gray-600'}`}>
        🌟 Ultimate
      </button>
    </div>
  );
}

export default function JujutsuArena() {
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { play } = useAudio(soundEnabled);

  const [selected, setSelected] = useState(null);
  const [battleNumber, setBattleNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [turn, setTurn] = useState('player');
  const [isProcessing, setIsProcessing] = useState(false);
  const [log, setLog] = useState([]);
  const enemyTimeoutRef = useRef(null);

  const [player, setPlayer] = useState(null);
  const [enemy, setEnemy] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Hide intro after short delay
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 1600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => () => enemyTimeoutRef.current && clearTimeout(enemyTimeoutRef.current), []);

  const canAct = turn === 'player' && !isProcessing && !gameOver && player && enemy;

  const addLog = useCallback((message, type = 'system') => {
    setLog((l) => {
      const next = [...l, { message, type, id: crypto.randomUUID?.() || Math.random().toString(36) }];
      return next.slice(-12);
    });
  }, []);

  const pickEnemy = useCallback((n) => {
    const template = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
    const scale = 1 + (n - 1) * 0.15;
    const hp = Math.floor(template.stats.hp * scale);
    return {
      id: 'enemy',
      name: template.name,
      avatar: template.avatar,
      element: template.element,
      stats: {
        hp,
        attack: Math.floor(template.stats.attack * scale),
        defense: Math.floor(template.stats.defense * scale),
        speed: Math.floor(template.stats.speed * scale),
      },
      hp,
      maxHp: hp,
      energy: 100,
      maxEnergy: 100,
      ultimate: 0,
      maxUltimate: 100,
      isBlocking: false,
      combo: 0,
    };
  }, []);

  const startBattle = useCallback(() => {
    if (!selected) return;
    const hp = selected.stats.hp;
    const newPlayer = {
      ...selected,
      hp,
      maxHp: hp,
      energy: 100,
      maxEnergy: 100,
      ultimate: 0,
      maxUltimate: 100,
      isBlocking: false,
      combo: 0,
    };
    setPlayer(newPlayer);
    setEnemy(pickEnemy(battleNumber));
    setTurn('player');
    setIsProcessing(false);
    setGameOver(false);
    setWinner(null);
    setLog([]);
    addLog(`Battle ${battleNumber} begins! ${selected.name} vs ${ENEMIES[0].name}`, 'system');
    play(400, 0.2, 'square');
  }, [selected, battleNumber, pickEnemy, addLog, play]);

  const calculateDamage = useCallback((attacker, defender, kind) => {
    let base = attacker.stats.attack;
    let critical = false;
    if (kind === 'basic') {
      base = Math.floor(base * 0.8);
      if (Math.random() < 0.12) {
        critical = true;
        base = Math.floor(base * 1.6);
      }
    } else if (kind === 'special') {
      base = Math.floor(base * 1.3);
    } else if (kind === 'ultimate') {
      base = Math.floor(base * 2.2);
      critical = true;
    }
    // random variance
    const variance = 0.2;
    base = Math.floor(base * (1 + (Math.random() - 0.5) * variance * 2));
    // combo multiplier
    if (attacker.combo > 0) base = Math.floor(base * (1 + attacker.combo * 0.1));
    // defense reduction
    const reduction = defender.stats.defense / (defender.stats.defense + 100);
    const finalDamage = Math.max(1, Math.floor(base * (1 - reduction)));
    return { damage: finalDamage, critical };
  }, []);

  const updateAfterPlayer = useCallback(
    (nextPlayer, nextEnemy) => {
      setPlayer(nextPlayer);
      setEnemy(nextEnemy);
      // victory check
      if (nextEnemy.hp <= 0) {
        setTimeout(() => {
          setGameOver(true);
          setWinner('player');
          // score bonuses
          const survival = Math.floor((nextPlayer.hp / nextPlayer.maxHp) * 200);
          const combo = nextPlayer.combo * 50;
          const battleBonus = battleNumber * 100;
          setScore((s) => s + survival + combo + battleBonus);
          play(523, 0.15, 'sine');
          setTimeout(() => play(659, 0.15, 'sine'), 150);
          setTimeout(() => play(784, 0.15, 'sine'), 320);
        }, 350);
        return;
      }
      // enemy turn
      setTurn('enemy');
      enemyTimeoutRef.current = setTimeout(() => {
        // enemy AI
        setEnemy((e) => {
          setPlayer((p) => {
            if (!p || !e) return p;
            const rand = Math.random();
            let action = 'attack';
            if (e.ultimate >= e.maxUltimate && rand < 0.6) action = 'ultimate';
            else if (p.hp < 30 && rand < 0.3) action = 'block';
            else if (rand < 0.15) action = 'block';

            let np = { ...p, isBlocking: false };
            let ne = { ...e, isBlocking: false };
            if (action === 'attack') {
              const { damage } = calculateDamage(ne, np, 'basic');
              const taken = np.isBlocking ? Math.floor(damage * 0.5) : damage;
              np = {
                ...np,
                hp: Math.max(0, np.hp - taken),
              };
              ne = {
                ...ne,
                energy: Math.min(ne.maxEnergy, ne.energy + 12),
                ultimate: Math.min(ne.maxUltimate, ne.ultimate + 8),
              };
              addLog(`${ne.name} attacks for ${taken} damage!`, 'enemy');
              play(250, 0.15, 'square');
            } else if (action === 'block') {
              ne = {
                ...ne,
                isBlocking: true,
                energy: Math.min(ne.maxEnergy, ne.energy + 10),
                ultimate: Math.min(ne.maxUltimate, ne.ultimate + 5),
              };
              addLog(`${ne.name} prepares to counter!`, 'enemy');
              play(180, 0.12, 'sine');
            } else if (action === 'ultimate') {
              ne = { ...ne, ultimate: 0 };
              const { damage } = calculateDamage(ne, np, 'ultimate');
              const taken = np.isBlocking ? Math.floor(damage * 0.7) : damage;
              np = { ...np, hp: Math.max(0, np.hp - taken) };
              addLog(`${ne.name} unleashes their ultimate for ${taken} damage!`, 'enemy');
              play(180, 0.25, 'sawtooth');
            }
            // defeat check
            if (np.hp <= 0) {
              setTimeout(() => {
                setGameOver(true);
                setWinner('enemy');
                play(220, 0.25, 'sawtooth');
              }, 250);
            } else {
              // back to player turn
              setTurn('player');
              setIsProcessing(false);
            }
            return np;
          });
          return e;
        });
      }, 900);
    },
    [battleNumber, play, addLog, calculateDamage]
  );

  const onAttack = useCallback(() => {
    if (!canAct) return;
    setIsProcessing(true);
    setPlayer((p) => p);
    setEnemy((e) => e);
    if (!player || !enemy) return;
    let np = { ...player, isBlocking: false };
    let ne = { ...enemy, isBlocking: false };
    const { damage, critical } = calculateDamage(np, ne, 'basic');
    ne.hp = Math.max(0, ne.hp - damage);
    np.energy = Math.min(np.maxEnergy, np.energy + 15);
    np.ultimate = Math.min(np.maxUltimate, np.ultimate + 10);
    if (critical) {
      np.combo += 1;
      addLog(`Critical hit! ${np.name} deals ${damage} damage!`, 'player');
      play(300, 0.18, 'sawtooth');
    } else {
      addLog(`${np.name} attacks for ${damage} damage!`, 'player');
      play(300, 0.12, 'square');
    }
    updateAfterPlayer(np, ne);
  }, [canAct, player, enemy, calculateDamage, addLog, play, updateAfterPlayer]);

  const onBlock = useCallback(() => {
    if (!canAct) return;
    setIsProcessing(true);
    const np = {
      ...player,
      isBlocking: true,
      energy: Math.min(player.maxEnergy, player.energy + 10),
      ultimate: Math.min(player.maxUltimate, player.ultimate + 5),
    };
    addLog(`${player.name} prepares to defend!`, 'player');
    play(200, 0.12, 'sine');
    updateAfterPlayer(np, enemy);
  }, [canAct, player, enemy, addLog, play, updateAfterPlayer]);

  const onSpecial = useCallback(() => {
    if (!canAct) return;
    const cost = player.abilities.special.cost;
    if (player.energy < cost) return;
    setIsProcessing(true);
    const np = {
      ...player,
      isBlocking: false,
      energy: player.energy - cost,
      ultimate: Math.min(player.maxUltimate, player.ultimate + 15),
    };
    const ne = { ...enemy, isBlocking: false };
    const { damage } = calculateDamage(np, ne, 'special');
    ne.hp = Math.max(0, ne.hp - damage);
    addLog(`${player.abilities.special.name}! ${damage} damage!`, 'player');
    play(420, 0.18, 'triangle');
    updateAfterPlayer(np, ne);
  }, [canAct, player, enemy, calculateDamage, addLog, play, updateAfterPlayer]);

  const onUltimate = useCallback(() => {
    if (!canAct) return;
    if (player.ultimate < player.maxUltimate) return;
    setIsProcessing(true);
    const np = { ...player, isBlocking: false, ultimate: 0, combo: player.combo + 2 };
    const ne = { ...enemy, isBlocking: false };
    const { damage } = calculateDamage(np, ne, 'ultimate');
    ne.hp = Math.max(0, ne.hp - damage);
    addLog(`${player.abilities.ultimate.name}! Devastating ${damage} damage!`, 'player');
    play(220, 0.3, 'sawtooth');
    updateAfterPlayer(np, ne);
  }, [canAct, player, enemy, calculateDamage, addLog, play, updateAfterPlayer]);

  const nextBattle = useCallback(() => {
    setBattleNumber((n) => n + 1);
    setGameOver(false);
    setWinner(null);
    // small heal
    setPlayer((p) => {
      if (!p) return p;
      const healed = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.3));
      return { ...p, hp: healed, energy: p.maxEnergy, ultimate: 0, combo: 0, isBlocking: false };
    });
    setEnemy(pickEnemy(battleNumber + 1));
    setTurn('player');
    setIsProcessing(false);
    setLog([]);
    addLog(`Battle ${battleNumber + 1} begins!`, 'system');
    play(400, 0.2, 'square');
  }, [battleNumber, pickEnemy, addLog, play]);

  const restart = useCallback(() => {
    setBattleNumber(1);
    setScore(0);
    setTurn('player');
    setIsProcessing(false);
    setLog([]);
    setPlayer(null);
    setEnemy(null);
    setGameOver(false);
    setWinner(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === 'r' && gameOver) return restart();
      if (!canAct) return;
      switch (e.key.toLowerCase()) {
        case '1':
        case 'a':
          onAttack();
          break;
        case '2':
        case 'b':
          onBlock();
          break;
        case '3':
        case 's':
          onSpecial();
          break;
        case '4':
        case 'u':
          onUltimate();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canAct, gameOver, onAttack, onBlock, onSpecial, onUltimate, restart]);

  const showCharacterSelect = !player || !enemy;
  const ultimateReady = !!player && player.ultimate >= player.maxUltimate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950/60 to-gray-900 relative overflow-hidden">
      {/* Decorative background dots */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#ffffff0f,_transparent_1px)] [background-size:16px_16px] opacity-40" />

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate('/gamezone')} className="text-gray-300 hover:text-white transition-colors">
              ← Back to Game Zone
            </button>
            <button
              onClick={() => setSoundEnabled((s) => !s)}
              className={`px-3 py-1.5 rounded-lg text-sm border ${
                soundEnabled ? 'border-emerald-500 text-emerald-300' : 'border-gray-600 text-gray-400'
              }`}
            >
              {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-rose-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
              呪術廻戦 — Jujutsu Arena
            </h1>
            <p className="text-gray-300/80 mt-3">
              Choose your fighter and battle cursed spirits in turn-based combat.
            </p>
          </div>

          {/* Character Select */}
          {showCharacterSelect ? (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {CHARACTERS.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelected(ch)}
                    className={`text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all ${
                      selected?.id === ch.id ? 'ring-2 ring-violet-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img src={ch.avatar} alt={ch.name} className="w-20 h-20 rounded-xl object-cover border border-white/10" />
                      <div>
                        <div className="text-2xl font-bold text-white">{ch.name}</div>
                        <div className="text-violet-300 text-xs uppercase tracking-wider">{ch.element} Element</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mt-4 text-sm">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-gray-400">HP</div>
                        <div className="text-white font-bold">{ch.stats.hp}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-gray-400">ATK</div>
                        <div className="text-white font-bold">{ch.stats.attack}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-gray-400">DEF</div>
                        <div className="text-white font-bold">{ch.stats.defense}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-gray-400">SPD</div>
                        <div className="text-white font-bold">{ch.stats.speed}</div>
                      </div>
                    </div>
                    <div className="text-gray-300/80 mt-3 text-sm">{ch.description}</div>
                  </button>
                ))}
              </div>
              <div className="text-center mt-8">
                <button
                  onClick={startBattle}
                  disabled={!selected}
                  className={`px-8 py-3 rounded-xl text-white font-bold transition-all ${
                    selected
                      ? 'bg-gradient-to-r from-violet-600 to-sky-600 hover:scale-[1.02] shadow-lg shadow-violet-600/20'
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  ▶️ Enter Battle
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Battle Header */}
              <div className="text-center">
                <div className="text-2xl font-extrabold bg-gradient-to-r from-rose-400 to-violet-400 bg-clip-text text-transparent">
                  Battle #{battleNumber}
                </div>
                <div className="text-gray-300 mt-1">
                  Score: <span className="text-amber-300 font-bold">{Math.floor(score)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,320px)_1fr] gap-6 items-start">
                <FighterCard side="left" fighter={player} />

                {/* Combat Log */}
                <div className="bg-gray-800/70 border border-white/10 rounded-2xl p-4 max-h-[420px] overflow-y-auto">
                  <div className="text-center text-amber-300 font-bold mb-3">Battle Log</div>
                  <div className="space-y-2">
                    {log.map((entry) => (
                      <div
                        key={entry.id}
                        className={`px-3 py-2 rounded-lg text-sm border ${
                          entry.type === 'player'
                            ? 'bg-blue-500/10 border-blue-400/30 text-blue-200'
                            : entry.type === 'enemy'
                            ? 'bg-rose-500/10 border-rose-400/30 text-rose-200'
                            : 'bg-white/5 border-white/10 text-gray-300'
                        }`}
                      >
                        {entry.message}
                      </div>
                    ))}
                  </div>
                </div>

                <FighterCard side="right" fighter={enemy} />
              </div>

              {/* Actions */}
              <ActionButtons
                canAct={canAct}
                onAttack={onAttack}
                onBlock={onBlock}
                onSpecial={onSpecial}
                onUltimate={onUltimate}
                specialName={player?.abilities.special.name}
                specialCost={player?.abilities.special.cost}
                ultimateReady={ultimateReady}
              />

              {/* Tips */}
              <div className="text-center text-xs text-gray-400">Keyboard: 1/A Attack · 2/B Block · 3/S Special · 4/U Ultimate · R Restart</div>
            </div>
          )}
        </div>
      </div>

      {/* Intro Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_center,_#1a0a2e_0%,_#030712_100%)]"
          >
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-rose-400 via-violet-400 to-sky-400 bg-clip-text text-transparent tracking-widest">
                呪術廻戦
              </div>
              <div className="text-gray-300/80 mt-2 tracking-[0.35em] uppercase text-sm">Jujutsu Arena</div>
              <div className="w-72 h-2 bg-gray-700 rounded mt-8 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 animate-[loading_1.6s_ease-out_forwards]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900/90 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center"
            >
              <div
                className={`text-4xl font-black mb-4 ${
                  winner === 'player'
                    ? 'bg-gradient-to-r from-emerald-400 to-amber-300'
                    : 'bg-gradient-to-r from-rose-400 to-orange-300'
                } bg-clip-text text-transparent`}
              >
                {winner === 'player' ? 'Victory!' : 'Defeated'}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left text-gray-300 mb-6">
                <div className="flex items-center justify-between">
                  <span>Battle</span>
                  <span className="font-semibold">#{battleNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Score</span>
                  <span className="font-semibold">{Math.floor(score)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>XP Gained</span>
                  <span className="font-semibold">+{winner === 'player' ? 100 + battleNumber * 25 : 25}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {winner === 'player' && (
                  <button onClick={nextBattle} className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-sky-600 text-white font-semibold">
                    ▶️ Next Battle
                  </button>
                )}
                <button onClick={restart} className="px-6 py-3 rounded-xl bg-gray-700 text-white font-semibold">
                  🔄 New Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* local keyframes */}
      <style>{`
        @keyframes loading { from { width: 0% } to { width: 100% } }
        @keyframes shimmer { 0% { transform: translateX(-100%) } 100% { transform: translateX(100%) } }
      `}</style>
    </div>
  );
}


