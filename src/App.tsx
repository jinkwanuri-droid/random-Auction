import { useState, useEffect, useRef } from 'react';
import { Player, Team, Role } from './types';
import { INITIAL_TEAMS, MOCK_PLAYERS } from './data';
import { 
  Users, 
  Clock, 
  Play, 
  Gavel, 
  RefreshCw, 
  X, 
  Check, 
  Settings, 
  RotateCcw, 
  Coins, 
  Ban,
  Pause,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem('draft_teams');
      return saved ? JSON.parse(saved) : INITIAL_TEAMS;
    } catch {
      return INITIAL_TEAMS;
    }
  });
  const [unsoldIds, setUnsoldIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('draft_unsold_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(() => {
    try {
      const saved = localStorage.getItem('draft_current_player');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [auctionTime, setAuctionTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('draft_auction_time');
      return saved ? JSON.parse(saved) : 30;
    } catch {
      return 30;
    }
  });
  const [timer, setTimer] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('draft_timer');
      return saved ? JSON.parse(saved) : 30;
    } catch {
      return 30;
    }
  });
  const [timerActive, setTimerActive] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [inputPrice, setInputPrice] = useState<string>('');

  const [editingTeams, setEditingTeams] = useState<Team[]>([]);
  const [editingTime, setEditingTime] = useState(30);

  // States for dynamic shuffle animation
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingUnsold, setIsDrawingUnsold] = useState(false);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);
  
  // Local validation warning message inside modal
  const [modalWarning, setModalWarning] = useState<string>('');

  // 선수 영입 취소(초기화) 상태 추가
  const [resetDraftee, setResetDraftee] = useState<{ teamId: string; player: Player } | null>(null);

  // 실시간 경매 패널 화면 이동을 위한 ref
  const auctionPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timerActive && timer === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timer]);

  // Save states to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('draft_teams', JSON.stringify(teams));
    } catch (e) {
      console.error(e);
    }
  }, [teams]);

  useEffect(() => {
    try {
      localStorage.setItem('draft_unsold_ids', JSON.stringify(unsoldIds));
    } catch (e) {
      console.error(e);
    }
  }, [unsoldIds]);

  useEffect(() => {
    try {
      if (currentPlayer) {
        localStorage.setItem('draft_current_player', JSON.stringify(currentPlayer));
      } else {
        localStorage.removeItem('draft_current_player');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentPlayer]);

  useEffect(() => {
    try {
      localStorage.setItem('draft_auction_time', JSON.stringify(auctionTime));
    } catch (e) {
      console.error(e);
    }
  }, [auctionTime]);

  useEffect(() => {
    try {
      localStorage.setItem('draft_timer', JSON.stringify(timer));
    } catch (e) {
      console.error(e);
    }
  }, [timer]);

  const getPlayerStatus = (p: Player) => {
    if (currentPlayer?.id === p.id) return '경매중';
    
    for (const team of teams) {
      if (team.players.some(tp => tp.id === p.id)) {
        return team.name;
      }
    }
    
    if (unsoldIds.includes(p.id)) return '유찰';
    return '대기중';
  };

  const getEligiblePlayersCount = () => {
    return MOCK_PLAYERS.filter(p => getPlayerStatus(p) === '대기중').length;
  };

  const getUnsoldPlayersCount = () => {
    return MOCK_PLAYERS.filter(p => getPlayerStatus(p) === '유찰').length;
  };

  const scrollToAuctionPanel = () => {
    setTimeout(() => {
      auctionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const drawRandomPlayer = () => {
    const waitingList = MOCK_PLAYERS.filter(p => getPlayerStatus(p) === '대기중');
    const isUnsoldMode = waitingList.length === 0;
    const eligible = isUnsoldMode 
      ? MOCK_PLAYERS.filter(p => getPlayerStatus(p) === '유찰')
      : waitingList;

    if (eligible.length === 0 || isDrawing) return;

    setIsDrawing(true);
    setIsDrawingUnsold(isUnsoldMode);
    setCurrentPlayer(null);
    setTimerActive(false);
    setHighlightedPlayerId(null);

    const duration = 3000; // 3초로 대폭 단축하여 1.2배 이상 빠르게 결과 도달
    const startTime = Date.now();

    const shuffle = () => {
      const now = Date.now();
      const elapsed = now - startTime;

      if (elapsed >= duration) {
        // Complete the drawing!
        const finalEligible = MOCK_PLAYERS.filter(p => getPlayerStatus(p) === (isUnsoldMode ? '유찰' : '대기중'));
        if (finalEligible.length === 0) {
          setIsDrawing(false);
          setHighlightedPlayerId(null);
          return;
        }
        
        // Pick random
        const chosen = finalEligible[Math.floor(Math.random() * finalEligible.length)];
        
        if (isUnsoldMode) {
          setUnsoldIds((prev) => prev.filter(id => id !== chosen.id));
        }

        setCurrentPlayer(chosen);
        setHighlightedPlayerId(null);
        setIsDrawing(false);
        setTimer(auctionTime);
        setTimerActive(true);
        setSelectedTeamId('');
        setInputPrice('');
        setModalWarning('');
        scrollToAuctionPanel();
      } else {
        const currentEligible = MOCK_PLAYERS.filter(p => getPlayerStatus(p) === (isUnsoldMode ? '유찰' : '대기중'));
        if (currentEligible.length > 0) {
          const tempPlayer = currentEligible[Math.floor(Math.random() * currentEligible.length)];
          setHighlightedPlayerId(tempPlayer.id);
        }

        const progress = elapsed / duration;
        // Bounces / slows down progressively but faster
        const nextDelay = 25 + Math.pow(progress, 2.2) * 180;
        setTimeout(shuffle, nextDelay);
      }
    };

    shuffle();
  };

  const triggerManualNomination = (p: Player) => {
    if (isDrawing) return;
    const status = getPlayerStatus(p);
    if (status !== '대기중' && status !== '유찰') return;

    // Nominate immediately
    setCurrentPlayer(p);
    setTimer(auctionTime);
    setTimerActive(true);
    setSelectedTeamId('');
    setInputPrice('');
    setModalWarning('');
    scrollToAuctionPanel();
    
    // If it was in unsold, clear it from unsold map
    if (status === '유찰') {
      setUnsoldIds((prev) => prev.filter(id => id !== p.id));
    }
  };

  const resetTimer = () => {
    setTimer(auctionTime);
  };

  const handleAuctionResult = (status: 'SOLD' | 'UNSOLD') => {
    if (!currentPlayer) return;

    if (status === 'SOLD') {
      const price = inputPrice.trim() === '' ? 0 : parseInt(inputPrice, 10);
      if (isNaN(price) || price < 0) {
        setModalWarning('입찰 금액은 0 이상의 숫자여야 합니다.');
        return;
      }
      if (!selectedTeamId) {
        setModalWarning('낙찰 확정 버튼을 누르기 전에 팀을 선택해주세요.');
        return;
      }

      const targetTeam = teams.find(t => t.id === selectedTeamId);
      if (targetTeam) {
        // 중복 포지션 체크
        const isRoleTaken = targetTeam.players.some(p => p.role === currentPlayer.role);
        if (isRoleTaken) {
          setModalWarning(`${targetTeam.name}은(는) 이미 ${currentPlayer.role} 포지션의 선수를 영입하였습니다.`);
          return;
        }

        // 잔여 포인트 체크
        if (targetTeam.budget < price) {
          setModalWarning(`${targetTeam.name}의 잔여 포인트(${targetTeam.budget} P)가 입찰가(${price} P)보다 부족합니다.`);
          return;
        }
      }

      setTeams((prev) =>
        prev.map((team) => {
          if (team.id === selectedTeamId) {
            return {
              ...team,
              budget: team.budget - price,
              players: [...team.players, { ...currentPlayer, bidPrice: price }],
            };
          }
          return team;
        })
      );
    } else {
      // Mark as unsold
      setUnsoldIds((prev) => {
        if (!prev.includes(currentPlayer.id)) {
          return [...prev, currentPlayer.id];
        }
        return prev;
      });
    }

    setCurrentPlayer(null);
    setTimerActive(false);
    setModalWarning('');
  };

  const handleQuickAdd = (amount: number) => {
    const current = parseInt(inputPrice, 10) || 0;
    setInputPrice(String(current + amount));
  };

  const handleResetPlayerInfo = (teamId: string, player: Player) => {
    setTeams(prev => prev.map(t => {
      if (t.id === teamId) {
        const refundedBudget = t.budget + (player.bidPrice || 0);
        return {
          ...t,
          budget: refundedBudget,
          players: t.players.filter(p => p.id !== player.id)
        };
      }
      return t;
    }));
    setResetDraftee(null);
  };

  const openSettings = () => {
    setEditingTeams(teams);
    setEditingTime(auctionTime);
    setShowSettingsModal(true);
  };

  const saveSettings = () => {
    setTeams(editingTeams);
    setAuctionTime(editingTime);
    setShowSettingsModal(false);
  };

  const handleFullReset = () => {
    try {
      localStorage.removeItem('draft_teams');
      localStorage.removeItem('draft_unsold_ids');
      localStorage.removeItem('draft_current_player');
      localStorage.removeItem('draft_auction_time');
      localStorage.removeItem('draft_timer');
    } catch (e) {
      console.error(e);
    }
    
    setTeams(INITIAL_TEAMS);
    setUnsoldIds([]);
    setCurrentPlayer(null);
    setAuctionTime(30);
    setTimer(30);
    setTimerActive(false);
    setSelectedTeamId('');
    setInputPrice('');
    setModalWarning('');
    setShowResetConfirmModal(false);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-slate-200 selection:bg-[#5bff14] selection:text-black">
      
      {/* Top Sticky Header */}
      <header className="border-b border-white/5 bg-[#0a0a0c] sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-1 px-1.5 rounded bg-[#5bff14]/10 border border-[#5bff14]/30 text-[#5bff14]">
              <Gavel className="w-5 h-5" />
            </span>
            <span className="text-xl font-black tracking-tight uppercase bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              LoL 팀 경매 대시보드
            </span>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 text-sm font-bold">
            <span className="flex items-center gap-2 text-slate-400 select-none">
              <Users className="w-4 h-4 text-[#5bff14]" /> 지명 대기: <span className="text-white font-extrabold">{getEligiblePlayersCount()}</span>명
            </span>
            <button 
              onClick={openSettings} 
              className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/5 text-slate-300 md:px-4 py-2 rounded-xl border border-white/5 text-xs font-black cursor-pointer shadow-sm hover:bg-white/10"
            >
              <Settings className="w-4 h-4 text-[#5bff14]" /> 경매 구성 변경
            </button>
            <button 
              onClick={() => setShowResetConfirmModal(true)} 
              className="flex items-center gap-1.5 text-red-400 bg-red-500/5 hover:bg-red-500 hover:text-white transition-all md:px-4 py-2 rounded-xl border border-red-500/20 hover:border-transparent text-xs font-black cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 전체 초기화
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-10">
        
        {/* Main Grid: Left 70% (Teams list), Right 30% (Live Auction Console) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 가로 70% 영역 (참가 팀 영입 현황 - 2행으로 배치) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center bg-[#0d0e12]/50 p-4 rounded-2xl border border-white/5 shadow-sm">
              <h2 className="text-lg font-black text-white flex items-center gap-2.5 select-none">
                <span className="w-1.5 h-4 bg-[#5bff14] rounded-sm" />
                참가 팀 영입 현황
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#5bff14]/10 text-[#5bff14] border border-[#5bff14]/20 uppercase ml-2 tracking-wider">
                  기본 1000 P 시작
                </span>
              </h2>
            </div>

            {/* Teams Grid: exactly 2 rows for 6 teams (3 columns per row on desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => {
                const draftedCount = team.players.length;
                const isFull = draftedCount >= 5;
                const rolesOrder: Role[] = ['TOP', 'JGL', 'MID', 'BOT', 'SUP'];
                
                return (
                  <div 
                    key={team.id} 
                    className={`bg-[#121318] border rounded-xl p-4 flex flex-col justify-between group transition-all duration-300 relative overflow-hidden h-[290px] ${isFull ? 'border-purple-500/20 bg-[#121318]/90' : 'border-white/5 hover:border-[#5bff14]/30'}`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#5bff14]/5 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    
                    <div className="flex justify-between items-start shrink-0 relative z-10">
                      <div>
                        <h3 className="text-base font-black text-white tracking-tight leading-tight group-hover:text-[#5bff14] transition-colors">
                          {team.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                          영입 인원: <span className={`${isFull ? 'text-purple-400' : 'text-white'} font-extrabold`}>{draftedCount}</span> / 5명
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">남은 포인트</div>
                        <div className="text-lg font-black text-[#5bff14] mt-0.5 tracking-tight">{team.budget}</div>
                      </div>
                    </div>
                    
                    {/* Drafted Players Fixed 5 Slots */}
                    <div className="flex-1 space-y-1 py-2 relative z-10 mt-2 border-t border-white/5">
                      {rolesOrder.map((role) => {
                        const draftedPlayer = team.players.find(p => p.role === role);
                        const isSelected = !!draftedPlayer;
                        return (
                          <div 
                            key={role} 
                            onClick={() => {
                              if (draftedPlayer) {
                                setResetDraftee({ teamId: team.id, player: draftedPlayer });
                              }
                            }}
                            className={`flex items-center justify-between bg-black/30 rounded px-2 text-xs border border-white/5 transition-all h-[32px] ${
                              isSelected 
                                ? 'cursor-pointer hover:border-red-500/30 hover:bg-red-500/5 shadow-inner' 
                                : 'hover:border-white/10'
                            }`}
                            title={isSelected ? `${draftedPlayer.name} 영입 취소하기` : ''}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className={`text-[9px] font-normal tracking-wide px-1.5 py-0.5 rounded-sm shrink-0 leading-none ${
                                isSelected
                                  ? role === 'TOP' ? 'text-blue-400 bg-blue-500/15 border border-blue-500/20' :
                                    role === 'JGL' ? 'text-green-400 bg-green-500/15 border border-green-500/20' :
                                    role === 'MID' ? 'text-red-400 bg-red-400/15 border border-red-400/20' :
                                    role === 'BOT' ? 'text-yellow-400 bg-yellow-400/15 border border-yellow-400/20' :
                                    'text-purple-400 bg-purple-500/15 border border-purple-500/20'
                                  : 'text-slate-600 bg-white/5 border border-transparent'
                              }`}>
                                {role}
                              </span>
                              {draftedPlayer ? (
                                <span className="font-extrabold text-[13px] text-white truncate leading-none">{draftedPlayer.name}</span>
                              ) : (
                                <span className="text-slate-700 font-bold italic text-[9px] leading-none">미영입</span>
                              )}
                            </span>
                            {draftedPlayer ? (
                              <span className="text-[10px] text-[#5bff14] font-bold shrink-0 whitespace-nowrap ml-1 bg-[#5bff14]/5 px-1.5 py-0.5 rounded border border-[#5bff14]/15 leading-none font-sans">
                                {draftedPlayer.bidPrice !== undefined ? `${draftedPlayer.bidPrice} P` : '0 P'}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-800 font-bold shrink-0 whitespace-nowrap ml-1 leading-none">―</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 가로 30% 영역 (실시간 경매 진행 패널 - Sticky) */}
          <div ref={auctionPanelRef} className="lg:col-span-4 sticky top-20 z-20 space-y-4">
            <div 
              className={`rounded-2xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.65)] relative overflow-hidden flex flex-col justify-between transition-all duration-500 ${
                currentPlayer || isDrawing
                  ? 'bg-gradient-to-b from-[#1a213a] via-[#101321] to-[#090b10] border border-[#5bff14]/25 ring-1 ring-[#5bff14]/10 shadow-[0_0_35px_rgba(91,255,20,0.06)]'
                  : 'bg-gradient-to-b from-[#151722] via-[#0e0f16] to-[#06070a] border border-white/10'
              }`} 
              style={{ minHeight: '344px' }}
            >
              
              {/* Decorative ambient background */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
                currentPlayer || isDrawing
                  ? 'bg-[#5bff14]/10 scale-110'
                  : 'bg-indigo-500/5'
              }`} />

              {/* Title Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#5bff14] rounded-sm" />
                  <h3 className="text-xs font-black text-white tracking-wider uppercase">실시간 경매 입찰 현황</h3>
                </div>
                {currentPlayer && (
                  <button 
                    onClick={() => {
                      setTimerActive(false);
                      setCurrentPlayer(null);
                    }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer bg-white/5 hover:bg-white/10 p-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5"/> 경매 취소
                  </button>
                )}
              </div>

              {currentPlayer ? (
                <div className="space-y-4 mt-4 relative z-10">
                  {/* Selected Player profile layout */}
                  <div className="bg-gradient-to-br from-[#181a1f] to-black border border-white/5 rounded-xl p-4 text-center relative overflow-hidden flex flex-col justify-center min-h-[100px] shadow-inner">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-[#5bff14]/10 blur-2xl rounded-full pointer-events-none" />
                    
                    <span className="relative z-10 inline-block mx-auto px-3 py-0.5 rounded-full bg-[#5bff14]/10 border border-[#5bff14]/25 text-[#5bff14] text-[9px] font-black tracking-widest uppercase mb-1.5">
                      {currentPlayer.role} 지명
                    </span>
                    
                    <h3 className="relative z-10 text-2xl font-black text-white tracking-tight uppercase">
                      {currentPlayer.name}
                    </h3>
                    
                    <div className="relative z-10 flex justify-center items-center gap-2 text-slate-400 text-[11px] mt-1.5 font-semibold">
                      <span>현재: <strong className="text-white font-black">{currentPlayer.currentTier}</strong></span>
                      <span className="w-1 h-1 rounded-full bg-slate-600" />
                      <span>최고: <strong className="text-white font-black">{currentPlayer.peakTier}</strong></span>
                    </div>
                  </div>

                  {/* Countdown display & controls */}
                  <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center text-center">
                      <div className="text-left">
                        <span className="text-[9px] font-black tracking-widest text-[#5bff14] uppercase block">
                          입찰 카운트다운
                        </span>
                        <div className={`text-3xl font-black tracking-tighter mt-0.5 ${timer <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                          {timer}<span className="text-sm text-slate-500 font-black ml-0.5">초</span>
                        </div>
                      </div>
                      
                      {/* Tick action triggers */}
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => setTimerActive(!timerActive)}
                          className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-305 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {timerActive ? <Pause className="w-3 h-3 text-red-400" /> : <Play className="w-3 h-3 text-green-400" />}
                          {timerActive ? '정지' : '시작'}
                        </button>
                        <button 
                          onClick={resetTimer}
                          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="카운트 리셋"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 시간 밑에 점점 줄어드는 시간 상태바 추가 */}
                    <div className="mt-2.5 w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-white/5 relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                          timer <= 5 
                            ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse' 
                            : 'bg-gradient-to-r from-[#5bff14] to-emerald-500 shadow-[0_0_8px_rgba(91,255,20,0.3)]'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, (timer / auctionTime) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Warning box if any occurs */}
                  {modalWarning && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 flex items-start gap-2 relative z-10">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] font-bold text-red-400 leading-tight">{modalWarning}</span>
                    </div>
                  )}

                  {/* Auction Console Bid Input */}
                  <div className="bg-black/20 border border-white/5 rounded-xl p-3 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        낙찰 포인트 입력
                      </label>
                      <button
                        onClick={() => setInputPrice('')}
                        className="bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[10px] px-1.5 py-0.5 rounded border border-red-500/10 transition-colors font-black cursor-pointer"
                      >
                        초기화
                      </button>
                    </div>

                    <div className="relative">
                      <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5bff14]" />
                      <input 
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={inputPrice}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d+$/.test(val)) {
                            setInputPrice(val);
                            if(modalWarning) setModalWarning('');
                          }
                        }}
                        placeholder="최종 포인트를 입력하세요"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white font-black placeholder:text-slate-600 focus:outline-none focus:border-[#5bff14] focus:ring-0 transition-colors text-sm"
                      />
                    </div>

                    {/* Quick presets */}
                    <div className="grid grid-cols-4 gap-1">
                      {[10, 50, 100, 200].map(amt => (
                        <button
                          key={amt}
                          onClick={() => handleQuickAdd(amt)}
                          className="bg-white/5 hover:bg-white/10 text-white text-[9px] font-black py-1 rounded-md border border-white/5 tracking-tight transition-all cursor-pointer text-center"
                        >
                          +{amt}P
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Winner Selection Grid */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-0.5">
                      낙찰 적용 팀 선택
                    </label>
                    
                    <div className="grid grid-cols-3 gap-1">
                      {teams.map(t => {
                        const isSelected = selectedTeamId === t.id;
                        const priceNum = parseInt(inputPrice, 10) || 0;
                        const isAffordable = t.budget >= priceNum;
                        
                        // 중복 여부 확인
                        const isRoleTaken = t.players.some(p => p.role === currentPlayer.role);
                        
                        return (
                          <button
                            key={t.id}
                            disabled={isRoleTaken}
                            onClick={() => {
                              setSelectedTeamId(t.id);
                              if(modalWarning) setModalWarning('');
                            }}
                            className={`py-1.5 px-0.5 rounded-lg border text-center transition-all flex flex-col justify-center items-center relative overflow-hidden ${
                              isRoleTaken
                                ? 'border-dashed border-red-500/20 bg-red-500/5 text-slate-600 opacity-60 cursor-not-allowed'
                                : isSelected 
                                  ? 'border-[#5bff14] bg-[#5bff14]/10 text-white shadow-[0_0_10px_rgba(91,255,20,0.15)] cursor-pointer' 
                                  : 'border-white/5 bg-black/30 text-slate-400 hover:border-white/20 cursor-pointer'
                            }`}
                            title={isRoleTaken ? '이미 동일한 포지션의 선수가 영입된 팀입니다.' : ''}
                          >
                            <span className={`text-[10px] font-black tracking-tight truncate w-full block ${isRoleTaken ? 'text-slate-600' : 'text-slate-200'}`}>
                              {t.name}
                            </span>
                            {isRoleTaken ? (
                              <span className="text-[8px] font-bold mt-0.5 block text-red-500/70 leading-none">
                                {currentPlayer.role} 중복
                              </span>
                            ) : (
                              <span className={`text-[9px] font-extrabold mt-0.5 block leading-none ${isAffordable ? 'text-[#5bff14]' : 'text-red-500'}`}>
                                {t.budget}P
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Final submission actions */}
                  <div className="flex gap-2 border-t border-white/5 pt-4">
                    <button 
                      onClick={() => handleAuctionResult('UNSOLD')}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-extrabold py-2.5 rounded-xl transition-all border border-red-500/20 hover:border-red-500/45 cursor-pointer flex items-center justify-center gap-1 text-[11px]"
                    >
                      <Ban className="w-3.5 h-3.5" /> 유찰 처리
                    </button>
                    <button 
                      onClick={() => handleAuctionResult('SOLD')}
                      className="flex-[1.5] bg-[#5bff14] hover:bg-[#4ade10] text-black font-black py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(91,255,20,0.2)] hover:shadow-[0_0_25px_rgba(91,255,20,0.4)] text-[11px] cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4 font-black" /> 낙찰 확정
                    </button>
                  </div>
                </div>
              ) : isDrawing ? (
                /* Drawing State inside panel - 룰렛 연출 적용 */
                (() => {
                  const highlightedPlayer = MOCK_PLAYERS.find(p => p.id === highlightedPlayerId);
                  const waitingPlayers = MOCK_PLAYERS.filter(p => getPlayerStatus(p) === (isDrawingUnsold ? '유찰' : '대기중'));
                  
                  // 이전/이후 선수를 구해 폭포수처럼 쏟아지는 릴 테이프 시뮬레이션
                  const hIdx = waitingPlayers.findIndex(p => p.id === highlightedPlayerId);
                  const prevPlayer = hIdx !== -1 && waitingPlayers.length > 1
                    ? waitingPlayers[(hIdx - 1 + waitingPlayers.length) % waitingPlayers.length]
                    : null;
                  const nextPlayer = hIdx !== -1 && waitingPlayers.length > 2
                    ? waitingPlayers[(hIdx + 1) % waitingPlayers.length]
                    : null;

                  return (
                    <div className="flex-1 flex flex-col justify-between p-1 my-auto relative z-10 w-full animate-fade-in animate-duration-300">
                      {/* 룰렛 상단 상태 표기 */}
                      <div className="text-center mb-3">
                        {isDrawingUnsold ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                            유찰 선수 추첨 롤러 가동 중
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5bff14]/10 border border-[#5bff14]/25 text-[#5bff14] text-[10px] font-black tracking-widest uppercase shadow-[0_0_15px_rgba(91,255,20,0.1)]">
                            <span className="w-1.5 h-1.5 bg-[#5bff14] rounded-full animate-ping" />
                            추첨 롤러 가동 중
                          </span>
                        )}
                        <p className="text-slate-400 text-[11px] font-semibold mt-1">
                          {isDrawingUnsold ? "빛나는 선수를 재발견하고 있습니다" : "가장 눈부신 선수를 선별하고 있습니다"}
                        </p>
                      </div>

                      {/* 슬롯머신 디바이스 윈도우 */}
                      <div className="relative bg-[#070709] border border-white/5 rounded-2xl h-[190px] overflow-hidden flex flex-col justify-center items-center shadow-2xl">
                        {/* 아날로그 스캔라인 및 노이즈 */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,19,24,0)_96%,rgba(91,255,20,0.06)_98%)] bg-[size:100%_6px] pointer-events-none z-20 opacity-40" />
                        
                        {/* 횡방향 상하단 어두운 페이드 마스크 */}
                        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#121318] to-transparent pointer-events-none z-20" />
                        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#121318] to-transparent pointer-events-none z-20" />
                        
                        {/* 정중앙 지시선 가이드 브래킷 - 유찰 드로잉 유광 표시 */}
                        <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[64px] border-y pointer-events-none z-10 flex items-center justify-between px-2 ${
                          isDrawingUnsold 
                            ? 'border-amber-500/25 bg-amber-500/5' 
                            : 'border-[#5bff14]/20 bg-[#5bff14]/5'
                        }`}>
                          <div className="flex flex-col justify-between h-full py-1">
                            <span className={`w-2 h-[2px] shadow-sm ${isDrawingUnsold ? 'bg-amber-500 shadow-amber-500/50' : 'bg-[#5bff14] shadow-[#5bff14]/50'}`} />
                            <span className={`w-2 h-[2px] shadow-sm ${isDrawingUnsold ? 'bg-amber-500 shadow-amber-500/50' : 'bg-[#5bff14] shadow-[#5bff14]/50'}`} />
                          </div>
                          <div className="flex flex-col justify-between h-full py-1">
                            <span className={`w-2 h-[2px] shadow-sm ${isDrawingUnsold ? 'bg-amber-500 shadow-amber-500/50' : 'bg-[#5bff14] shadow-[#5bff14]/50'}`} />
                            <span className={`w-2 h-[2px] shadow-sm ${isDrawingUnsold ? 'bg-amber-500 shadow-amber-500/50' : 'bg-[#5bff14] shadow-[#5bff14]/50'}`} />
                          </div>
                        </div>

                        {/* 3줄 입체 롤링 타일 (참가자 슬라이더 슬롯 형태) */}
                        <div className="w-full text-center relative z-0 h-full flex flex-col justify-center items-center select-none overflow-hidden">
                          <AnimatePresence mode="popLayout">
                            {highlightedPlayer ? (
                              <motion.div
                                key={highlightedPlayer.id}
                                initial={{ y: 65, opacity: 0, filter: 'blur(4px)' }}
                                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                                exit={{ y: -65, opacity: 0, filter: 'blur(4px)' }}
                                transition={{ 
                                  type: "spring", 
                                  stiffness: 550, 
                                  damping: 15,
                                  mass: 0.6
                                }}
                                className="flex flex-col items-center justify-center w-full relative"
                              >
                                {/* [이전 타일] 위에 흐릿하게 스쳐 지나가는 후보 */}
                                {prevPlayer && (
                                  <div className="absolute -top-12 opacity-15 scale-90 filter blur-[1.5px] transition-all text-xs font-bold text-slate-400 truncate max-w-[180px] pointer-events-none">
                                    {prevPlayer.role} | {prevPlayer.name}
                                  </div>
                                )}

                                {/* [현재 집중 타일] 중앙 지명 후보 */}
                                <div className="flex flex-col items-center py-2">
                                  {/* 역할 포지션 뱃지 */}
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full mb-1 leading-none tracking-wider uppercase shadow-inner ${
                                    highlightedPlayer.role === 'TOP' ? 'text-blue-400 bg-blue-500/15 border border-blue-500/20' :
                                    highlightedPlayer.role === 'JGL' ? 'text-green-400 bg-green-500/15 border border-green-500/20' :
                                    highlightedPlayer.role === 'MID' ? 'text-red-400 bg-red-400/15 border border-red-400/20' :
                                    highlightedPlayer.role === 'BOT' ? 'text-yellow-400 bg-yellow-400/15 border border-yellow-400/20' :
                                    'text-purple-400 bg-purple-500/15 border border-purple-500/20'
                                  }`}>
                                    {highlightedPlayer.role}
                                  </span>
                                  
                                  {/* 선수명 */}
                                  <span className="text-2xl font-black text-white px-2 tracking-tight block truncate max-w-[240px] leading-tight uppercase drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]">
                                    {highlightedPlayer.name}
                                  </span>
                                  
                                  {/* 티어 정보 */}
                                  <span className="text-[10px] text-slate-400 font-extrabold mt-1 uppercase tracking-wider flex items-center gap-1.5">
                                    <span>현재 {highlightedPlayer.currentTier}</span>
                                    <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                    <span>최고 {highlightedPlayer.peakTier}</span>
                                  </span>
                                </div>

                                {/* [다음 타일] 아래에 흐릿하게 올라 대기하는 후보 */}
                                {nextPlayer && (
                                  <div className="absolute -bottom-12 opacity-15 scale-90 filter blur-[1.5px] transition-all text-xs font-bold text-slate-400 truncate max-w-[180px] pointer-events-none">
                                    {nextPlayer.role} | {nextPlayer.name}
                                  </div>
                                )}
                              </motion.div>
                            ) : (
                              <div className={`opacity-55 font-black text-xs animate-pulse tracking-widest flex items-center gap-2 ${isDrawingUnsold ? 'text-amber-400' : 'text-[#5bff14]'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isDrawingUnsold ? 'bg-amber-500' : 'bg-[#5bff14]'}`} />
                                {isDrawingUnsold ? "유찰 리스트 속도 정렬 중..." : "엔진 가동 및 속도 정렬 중"}
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* 하단 세부 통계 바 */}
                      <div className="mt-3 flex justify-between items-center px-1 text-[10px] text-slate-500 font-bold border-t border-white/5 pt-2 select-none">
                        <span>진행률 <strong className={`font-black ${isDrawingUnsold ? 'text-amber-400' : 'text-[#5bff14]'}`}>{isDrawingUnsold ? 'UNSOLD RECOVERY' : 'ACTIVE'}</strong></span>
                        <span className="text-slate-600 tracking-wider">{isDrawingUnsold ? 'RE-DRAFT ENGINE V3' : 'CYBERPUNK ENGINE V3'}</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* Empty state when no active player */
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto relative z-10 select-none">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                    <Gavel className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">진행 중인 경매 없음</h4>
                    <p className="text-slate-500 text-[11px] font-semibold leading-relaxed mt-1.5 max-w-[200px] mx-auto">
                      오른쪽 위의 <strong className="text-[#5bff14] font-black">무작위 선수 추첨</strong> 버튼을 누르거나 아래 명단에서 선수를 클릭해 경매를 시작해보세요.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lane-by-Lane Participant Roster */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-black flex items-center gap-2 text-white">
                <span className="w-1.5 h-4 bg-[#5bff14] rounded-sm" />
                라인별 대기 및 참가 인원
              </h2>
              <p className="text-xs text-slate-500 font-bold">
                지명 대기중인 선수를 클릭하면 해당 선수 즉시 지명 경매를 진행합니다.
              </p>
            </div>
            
            {/* Draw Button placed on top-right of the Lanes section */}
            <div className="shrink-0 w-full sm:w-auto">
              {getEligiblePlayersCount() > 0 ? (
                <button
                  onClick={drawRandomPlayer}
                  disabled={isDrawing}
                  className="w-full sm:w-auto relative overflow-hidden group bg-gradient-to-r from-[#5bff14] to-[#4ade10] hover:scale-[1.02] text-black font-black px-7 py-3 rounded-xl transition-all shadow-[0_0_25px_rgba(91,255,20,0.25)] hover:shadow-[0_0_40px_rgba(91,255,20,0.5)] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer text-sm"
                  style={{ outline: 'none' }}
                >
                  <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-shine" />
                  <RefreshCw className={`w-4 h-4 text-black ${isDrawing ? 'animate-spin' : ''}`} />
                  무작위 선수 추첨하기
                </button>
              ) : (
                <button
                  onClick={drawRandomPlayer}
                  disabled={getUnsoldPlayersCount() === 0 || isDrawing}
                  className={`w-full sm:w-auto relative overflow-hidden group hover:scale-[1.02] font-black px-7 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm ${
                    getUnsoldPlayersCount() > 0
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]'
                      : 'bg-[#18191e] text-slate-500 border border-white/5 opacity-55'
                  }`}
                  style={{ outline: 'none' }}
                >
                  {getUnsoldPlayersCount() > 0 && (
                    <span className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-shine" />
                  )}
                  <RefreshCw className={`w-4 h-4 ${getUnsoldPlayersCount() > 0 ? 'text-black' : 'text-slate-500'} ${isDrawing ? 'animate-spin' : ''}`} />
                  {getUnsoldPlayersCount() > 0 ? (
                    <span>유찰 선수 무작위 추첨하기 <span className="text-black bg-black/10 px-1.5 py-0.5 rounded ml-1 text-xs">{getUnsoldPlayersCount()}명</span></span>
                  ) : (
                    <span>전체 지명 완료 (추첨 종료)</span>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
            {(['TOP', 'JGL', 'MID', 'BOT', 'SUP'] as const).map(role => {
              const rolePlayers = MOCK_PLAYERS.filter(p => p.role === role);
              return (
                <div 
                  key={role} 
                  className="bg-[#121318] border border-white/5 rounded-xl p-3 flex flex-col"
                  style={{ height: 'auto' }} // Disable fixed heights for natural expansion
                >
                  <h4 className="text-[#5bff14] font-black text-sm mb-2.5 pb-2 border-b border-white/10 flex justify-between items-center px-0.5">
                    <span className="tracking-widest font-black text-base">{role}</span>
                    <span className="text-[9px] font-black text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                      {rolePlayers.length}명
                    </span>
                  </h4>
                  
                  <div className="space-y-1.5">
                    {rolePlayers.map(p => {
                      const status = getPlayerStatus(p);
                      const isHighlight = highlightedPlayerId === p.id;
                      const isWaiting = status === '대기중';
                      const isUnsold = status === '유찰';
                      const isDrafted = !isWaiting && !isUnsold && status !== '경매중';
                      
                      return (
                        <motion.div 
                          key={p.id} 
                          onClick={() => {
                            if (isWaiting || isUnsold) {
                              triggerManualNomination(p);
                            }
                          }}
                          animate={isHighlight ? { 
                            scale: 1.03, 
                            borderColor: '#5bff14', 
                            boxShadow: '0 0 20px rgba(91, 255, 20, 0.6)',
                            backgroundColor: 'rgba(91, 255, 20, 0.15)'
                          } : { 
                            scale: 1,
                            borderColor: isUnsold ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                            backgroundColor: isUnsold ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0,0,0,0.2)'
                          }}
                          transition={{ duration: 0.12 }}
                          className={`border rounded-lg p-2.5 flex justify-between items-center text-xs group ${
                            isWaiting || isUnsold ? 'hover:border-[#5bff14]/40 hover:bg-[#5bff14]/5 cursor-pointer' : 'opacity-65 select-none'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-1.5">
                            <div className={`font-black text-xs md:text-[13px] transition-colors truncate ${
                              isHighlight ? 'text-[#5bff14]' : 
                              isUnsold ? 'text-red-400 group-hover:text-red-300' : 
                              isDrafted ? 'text-slate-500' : 'text-white group-hover:text-[#5bff14]'
                            }`}>
                              {p.name}
                            </div>
                            <div className="text-[9px] text-slate-500 mt-0.5 truncate font-bold">
                              {p.currentTier} / {p.peakTier}
                            </div>
                          </div>
                          
                          <div className={`text-[8.5px] px-1.5 py-0.5 rounded font-black whitespace-nowrap shrink-0 transition-colors ${
                            isDrafted ? 'bg-[#5bff14]/10 text-slate-400 border border-white/5' :
                            isUnsold ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                            status === '경매중' ? 'bg-[#5bff14]/20 text-[#5bff14] border border-[#5bff14]/40 animate-pulse' :
                            'bg-white/5 text-slate-400 border border-white/5 group-hover:bg-[#5bff14]/10 group-hover:text-[#5bff14]'
                          }`}>
                            {isDrafted ? `${status.substring(0, 2)}` : status}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowSettingsModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#121318] border border-white/10 p-6 rounded-2xl w-full max-w-lg relative z-10 shadow-2xl overflow-hidden animate-none"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#5bff14] rounded-sm" />
                  경매 세부 설정
                </h3>
                <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
                  <X className="w-4 h-4"/>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 px-1 uppercase tracking-widest">
                    참가 팀 이름 편집 (콤팩트 2열 배치)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {editingTeams.map((t, idx) => (
                      <div key={t.id} className="flex items-center gap-2 bg-black/30 p-2 rounded-xl border border-white/5">
                        <span className="text-slate-400 text-[10px] font-black w-12 shrink-0 text-center bg-white/5 py-1 rounded leading-none whitespace-nowrap">
                          팀{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => setEditingTeams(prev => prev.map(pt => pt.id === t.id ? { ...pt, name: e.target.value } : pt))}
                          className="flex-1 bg-transparent border-none p-0 text-xs text-white font-black placeholder:text-slate-500 focus:outline-none focus:ring-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4 items-center">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 px-1 uppercase tracking-widest">
                      기본 카운트다운 타이머 (초)
                    </label>
                    <input
                      type="number"
                      value={editingTime}
                      onChange={(e) => setEditingTime(Number(e.target.value))}
                      className="w-full bg-black/30 border border-white/5 rounded-xl p-2 px-3 text-xs text-white font-bold placeholder:text-slate-600 focus:outline-none focus:border-[#5bff14]/50 focus:bg-black/40 transition-colors"
                    />
                  </div>
                  <div className="sm:pt-4">
                    <button 
                      onClick={saveSettings}
                      className="w-full bg-[#5bff14] hover:bg-[#4ade10] hover:scale-[1.01] text-black font-black py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(91,255,20,0.2)] hover:shadow-[0_0_25px_rgba(91,255,20,0.4)] cursor-pointer text-xs"
                    >
                      설정 변경 사항 저장
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Draftee Confirm Modal */}
      <AnimatePresence>
        {resetDraftee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => setResetDraftee(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#121318] border border-red-500/20 p-6 rounded-2xl w-full max-w-sm relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-550" />
              
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <h3 className="text-base font-black text-white tracking-tight">선수 영입 취소 확인</h3>
              </div>

              <div className="space-y-3 bg-black/30 p-4 rounded-xl border border-white/5 mb-6 text-xs">
                <p className="text-slate-350 font-semibold leading-relaxed">
                  선택하신 <strong className="text-red-400 font-extrabold">{resetDraftee.player.name}</strong> 선수의 영입을 취소하고 대기 명단으로 돌려보내시겠습니까?
                </p>
                <div className="text-[11px] text-slate-500 space-y-1.5 border-t border-white/5 pt-2.5 mt-2.5">
                  <div className="flex justify-between">
                    <span>대상 팀:</span>
                    <span className="text-white font-black">{teams.find(t => t.id === resetDraftee.teamId)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>환불되는 포인트:</span>
                    <span className="text-[#5bff14] font-black">{resetDraftee.player.bidPrice || 0} P</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setResetDraftee(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-350 font-bold py-2.5 rounded-xl transition-colors text-xs cursor-pointer"
                >
                  유지하기
                </button>
                <button 
                  onClick={() => handleResetPlayerInfo(resetDraftee.teamId, resetDraftee.player)}
                  className="flex-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-black py-2.5 rounded-xl transition-all border border-red-500/20 hover:border-transparent text-xs cursor-pointer shadow-lg"
                >
                  영입 취소 확정
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Reset Confirm Modal */}
      <AnimatePresence>
        {showResetConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => setShowResetConfirmModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#121318] border border-red-500/20 p-6 rounded-2xl w-full max-w-sm relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-550" />
              
              <div className="flex items-center gap-2 mb-4">
                <RotateCcw className="w-5 h-5 text-red-400 shrink-0" />
                <h3 className="text-base font-black text-white tracking-tight">경매 데이터 전체 초기화</h3>
              </div>

              <div className="space-y-3 bg-black/30 p-4 rounded-xl border border-white/5 mb-6 text-xs">
                <p className="text-slate-350 font-semibold leading-relaxed">
                  현재까지 진행된 <strong className="text-red-400 font-extrabold">모든 팀 정보, 영입 선수 기록, 대기 명단 상태</strong>가 완전히 처음 시작 상태로 초기화됩니다.
                </p>
                <p className="text-red-400/80 font-bold text-[11px] border-t border-white/5 pt-2.5">
                  ⚠️ 이 작업은 취소하거나 되돌릴 수 없습니다. 정말 모든 경매 기록을 지우시겠습니까?
                </p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowResetConfirmModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-350 font-bold py-2.5 rounded-xl transition-colors text-xs cursor-pointer"
                >
                  취소
                </button>
                <button 
                  onClick={handleFullReset}
                  className="flex-1 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-black py-2.5 rounded-xl transition-all border border-red-500/20 hover:border-transparent text-xs cursor-pointer shadow-lg"
                >
                  명단/기록 초기화
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(91, 255, 20, 0.4);
        }
        
        @keyframes shine {
          100% {
            transform: skewX(-12deg) translateX(100%);
          }
        }
        .group:hover .group-hover\\:animate-shine {
          animation: shine 0.75s ease-in-out;
        }
      `}</style>
    </div>
  );
}
