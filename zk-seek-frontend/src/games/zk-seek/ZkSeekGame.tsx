import { useState, useEffect, useRef } from 'react';
import { ZkSeekService } from './zkSeekService';
import { requestCache, createCacheKey } from '@/utils/requestCache';
import { useWallet } from '@/hooks/useWallet';
import { ZK_SEEK_CONTRACT } from '@/utils/constants';
import { getFundedSimulationSourceAddress } from '@/utils/simulationUtils';
import { devWalletService, DevWalletService } from '@/services/devWalletService';
import type { Game } from './bindings';

const createRandomSessionId = (): number => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    let value = 0;
    const buffer = new Uint32Array(1);
    while (value === 0) {
      crypto.getRandomValues(buffer);
      value = buffer[0];
    }
    return value;
  }

  return (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;
};

const zkSeekService = new ZkSeekService(ZK_SEEK_CONTRACT);

type GamePhase = 'create' | 'commit' | 'reveal' | 'resolve' | 'complete';

interface ZkSeekGameProps {
  userAddress: string;
  currentEpoch: number;
  availablePoints: bigint;
  initialXDR?: string | null;
  initialSessionId?: number | null;
  onStandingsRefresh: () => void;
  onGameComplete: () => void;
}

export function ZkSeekGame({
  userAddress,
  availablePoints,
  initialXDR,
  initialSessionId,
  onStandingsRefresh,
  onGameComplete
}: ZkSeekGameProps) {
  const DEFAULT_POINTS = '0.1';
  const { getContractSigner, walletType } = useWallet();

  // ── Core state ──
  const [sessionId, setSessionId] = useState<number>(() => createRandomSessionId());
  const [player1Address, setPlayer1Address] = useState(userAddress);
  const [player1Points, setPlayer1Points] = useState(DEFAULT_POINTS);
  const [gameState, setGameState] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickstartLoading, setQuickstartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('create');
  const [createMode, setCreateMode] = useState<'create' | 'import' | 'load'>('create');

  // ── Create phase state ──
  const [sceneId, setSceneId] = useState('1');
  const [exportedAuthEntryXDR, setExportedAuthEntryXDR] = useState<string | null>(null);
  const [importAuthEntryXDR, setImportAuthEntryXDR] = useState('');
  const [importSessionId, setImportSessionId] = useState('');
  const [importPlayer1, setImportPlayer1] = useState('');
  const [importPlayer1Points, setImportPlayer1Points] = useState('');
  const [importPlayer2Points, setImportPlayer2Points] = useState(DEFAULT_POINTS);
  const [importSceneId, setImportSceneId] = useState('1');
  const [loadSessionId, setLoadSessionId] = useState('');
  const [authEntryCopied, setAuthEntryCopied] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  const [xdrParsing, setXdrParsing] = useState(false);
  const [xdrParseError, setXdrParseError] = useState<string | null>(null);
  const [xdrParseSuccess, setXdrParseSuccess] = useState(false);

  // ── Commit phase state ──
  const [commitX, setCommitX] = useState('');
  const [commitY, setCommitY] = useState('');

  // ── Resolve phase state (admin) ──
  const [resolveTargetX, setResolveTargetX] = useState('');
  const [resolveTargetY, setResolveTargetY] = useState('');
  const [resolveSceneSalt, setResolveSceneSalt] = useState('');

  useEffect(() => {
    setPlayer1Address(userAddress);
  }, [userAddress]);

  useEffect(() => {
    if (createMode === 'import' && !importPlayer2Points.trim()) {
      setImportPlayer2Points(DEFAULT_POINTS);
    }
  }, [createMode, importPlayer2Points]);

  const POINTS_DECIMALS = 7;
  const isBusy = loading || quickstartLoading;
  const actionLock = useRef(false);
  const quickstartAvailable = walletType === 'dev'
    && DevWalletService.isDevModeAvailable()
    && DevWalletService.isPlayerAvailable(1)
    && DevWalletService.isPlayerAvailable(2);

  const runAction = async (action: () => Promise<void>) => {
    if (actionLock.current || isBusy) return;
    actionLock.current = true;
    try {
      await action();
    } finally {
      actionLock.current = false;
    }
  };

  // ── Phase determination from game state ──
  const determinePhase = (game: Game | null): GamePhase => {
    if (!game) return 'create';
    if (game.winner !== undefined && game.winner !== null) return 'complete';
    // Both revealed (x/y set) → resolve
    if (game.player1_x !== undefined && game.player1_x !== null &&
        game.player2_x !== undefined && game.player2_x !== null) return 'resolve';
    // Both committed → reveal
    if (game.player1_commitment !== undefined && game.player1_commitment !== null &&
        game.player2_commitment !== undefined && game.player2_commitment !== null) return 'reveal';
    return 'commit';
  };

  // ── Derived state ──
  const isPlayer1 = gameState?.player1 === userAddress;
  const isPlayer2 = gameState?.player2 === userAddress;

  const hasCommitted = isPlayer1
    ? gameState?.player1_commitment != null
    : isPlayer2
      ? gameState?.player2_commitment != null
      : false;

  const hasRevealed = isPlayer1
    ? gameState?.player1_x != null
    : isPlayer2
      ? gameState?.player2_x != null
      : false;

  const savedData = (gamePhase === 'reveal' || gamePhase === 'commit')
    ? ZkSeekService.loadSaltAndCoords(sessionId, userAddress)
    : null;

  // ── Helpers ──
  const parsePoints = (value: string): bigint | null => {
    try {
      const cleaned = value.replace(/[^\d.]/g, '');
      if (!cleaned || cleaned === '.') return null;
      const [whole = '0', fraction = ''] = cleaned.split('.');
      const paddedFraction = fraction.padEnd(POINTS_DECIMALS, '0').slice(0, POINTS_DECIMALS);
      return BigInt(whole + paddedFraction);
    } catch {
      return null;
    }
  };

  const handleStartNewGame = () => {
    if (gameState?.winner) onGameComplete();
    actionLock.current = false;
    setGamePhase('create');
    setSessionId(createRandomSessionId());
    setGameState(null);
    setLoading(false);
    setQuickstartLoading(false);
    setError(null);
    setSuccess(null);
    setCreateMode('create');
    setSceneId('1');
    setExportedAuthEntryXDR(null);
    setImportAuthEntryXDR('');
    setImportSessionId('');
    setImportPlayer1('');
    setImportPlayer1Points('');
    setImportPlayer2Points(DEFAULT_POINTS);
    setImportSceneId('1');
    setLoadSessionId('');
    setAuthEntryCopied(false);
    setShareUrlCopied(false);
    setXdrParsing(false);
    setXdrParseError(null);
    setXdrParseSuccess(false);
    setCommitX('');
    setCommitY('');
    setResolveTargetX('');
    setResolveTargetY('');
    setResolveSceneSalt('');
    setPlayer1Address(userAddress);
    setPlayer1Points(DEFAULT_POINTS);
  };

  // ── Polling ──
  const loadGameState = async () => {
    try {
      const game = await zkSeekService.getGame(sessionId);
      setGameState(game);
      if (game) {
        const phase = determinePhase(game);
        setGamePhase(phase);
      }
    } catch {
      setGameState(null);
    }
  };

  useEffect(() => {
    if (gamePhase !== 'create' && gamePhase !== 'complete') {
      loadGameState();
      const interval = setInterval(loadGameState, 5000);
      return () => clearInterval(interval);
    }
  }, [sessionId, gamePhase]);

  useEffect(() => {
    if (gamePhase === 'complete' && gameState?.winner) {
      onStandingsRefresh();
    }
  }, [gamePhase, gameState?.winner]);

  // ── Deep linking ──
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sceneFromUrl = urlParams.get('scene');

    if (initialXDR) {
      try {
        const parsed = zkSeekService.parseAuthEntry(initialXDR);
        zkSeekService.getGame(parsed.sessionId)
          .then((game) => {
            if (game) {
              setGameState(game);
              setGamePhase(determinePhase(game));
              setSessionId(parsed.sessionId);
            } else {
              setCreateMode('import');
              setImportAuthEntryXDR(initialXDR);
              setImportSessionId(parsed.sessionId.toString());
              setImportPlayer1(parsed.player1);
              setImportPlayer1Points((Number(parsed.player1Points) / 10_000_000).toString());
              setImportPlayer2Points('0.1');
              if (sceneFromUrl) setImportSceneId(sceneFromUrl);
            }
          })
          .catch(() => {
            setCreateMode('import');
            setImportAuthEntryXDR(initialXDR);
            setImportPlayer2Points('0.1');
            if (sceneFromUrl) setImportSceneId(sceneFromUrl);
          });
      } catch {
        setCreateMode('import');
        setImportAuthEntryXDR(initialXDR);
        setImportPlayer2Points('0.1');
        if (sceneFromUrl) setImportSceneId(sceneFromUrl);
      }
      return;
    }

    const authEntry = urlParams.get('auth');
    const urlSessionId = urlParams.get('session-id');

    if (authEntry) {
      try {
        const parsed = zkSeekService.parseAuthEntry(authEntry);
        zkSeekService.getGame(parsed.sessionId)
          .then((game) => {
            if (game) {
              setGameState(game);
              setGamePhase(determinePhase(game));
              setSessionId(parsed.sessionId);
            } else {
              setCreateMode('import');
              setImportAuthEntryXDR(authEntry);
              setImportSessionId(parsed.sessionId.toString());
              setImportPlayer1(parsed.player1);
              setImportPlayer1Points((Number(parsed.player1Points) / 10_000_000).toString());
              setImportPlayer2Points('0.1');
              if (sceneFromUrl) setImportSceneId(sceneFromUrl);
            }
          })
          .catch(() => {
            setCreateMode('import');
            setImportAuthEntryXDR(authEntry);
            setImportPlayer2Points('0.1');
            if (sceneFromUrl) setImportSceneId(sceneFromUrl);
          });
      } catch {
        setCreateMode('import');
        setImportAuthEntryXDR(authEntry);
        setImportPlayer2Points('0.1');
        if (sceneFromUrl) setImportSceneId(sceneFromUrl);
      }
    } else if (urlSessionId) {
      setCreateMode('load');
      setLoadSessionId(urlSessionId);
    } else if (initialSessionId != null) {
      setCreateMode('load');
      setLoadSessionId(initialSessionId.toString());
    }
  }, [initialXDR, initialSessionId]);

  // ── Auto-parse auth entry XDR ──
  useEffect(() => {
    if (createMode !== 'import' || !importAuthEntryXDR.trim()) {
      if (!importAuthEntryXDR.trim()) {
        setXdrParsing(false);
        setXdrParseError(null);
        setXdrParseSuccess(false);
        setImportSessionId('');
        setImportPlayer1('');
        setImportPlayer1Points('');
      }
      return;
    }

    const parseXDR = async () => {
      setXdrParsing(true);
      setXdrParseError(null);
      setXdrParseSuccess(false);
      try {
        const gameParams = zkSeekService.parseAuthEntry(importAuthEntryXDR.trim());
        if (gameParams.player1 === userAddress) {
          throw new Error('You cannot play against yourself. This auth entry was created by you (Player 1).');
        }
        setImportSessionId(gameParams.sessionId.toString());
        setImportPlayer1(gameParams.player1);
        setImportPlayer1Points((Number(gameParams.player1Points) / 10_000_000).toString());
        setXdrParseSuccess(true);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Invalid auth entry XDR';
        setXdrParseError(errorMsg);
        setImportSessionId('');
        setImportPlayer1('');
        setImportPlayer1Points('');
      } finally {
        setXdrParsing(false);
      }
    };

    const timeoutId = setTimeout(parseXDR, 500);
    return () => clearTimeout(timeoutId);
  }, [importAuthEntryXDR, createMode, userAddress]);

  // ====================================================================
  // Action Handlers
  // ====================================================================

  const handlePrepareTransaction = async () => {
    await runAction(async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const p1Points = parsePoints(player1Points);
        if (!p1Points || p1Points <= 0n) throw new Error('Enter a valid points amount');

        const parsedSceneId = parseInt(sceneId);
        if (isNaN(parsedSceneId) || parsedSceneId <= 0) throw new Error('Enter a valid scene ID');

        const signer = getContractSigner();
        const placeholderPlayer2Address = await getFundedSimulationSourceAddress([player1Address, userAddress]);

        const authEntryXDR = await zkSeekService.prepareStartGame(
          sessionId,
          player1Address,
          placeholderPlayer2Address,
          p1Points,
          p1Points,
          parsedSceneId,
          signer
        );

        setExportedAuthEntryXDR(authEntryXDR);
        setSuccess('Auth entry signed! Copy the auth entry XDR or share URL below and send it to Player 2.');

        // Poll for game creation by Player 2
        const pollInterval = setInterval(async () => {
          try {
            const game = await zkSeekService.getGame(sessionId);
            if (game) {
              clearInterval(pollInterval);
              setGameState(game);
              setExportedAuthEntryXDR(null);
              setSuccess('Game created! Player 2 has signed and submitted.');
              setGamePhase('commit');
              onStandingsRefresh();
              setTimeout(() => setSuccess(null), 2000);
            }
          } catch {}
        }, 3000);

        setTimeout(() => clearInterval(pollInterval), 300000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to prepare transaction');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleQuickStart = async () => {
    await runAction(async () => {
      try {
        setQuickstartLoading(true);
        setError(null);
        setSuccess(null);

        if (walletType !== 'dev') throw new Error('Quickstart only works with dev wallets.');
        if (!DevWalletService.isDevModeAvailable() || !DevWalletService.isPlayerAvailable(1) || !DevWalletService.isPlayerAvailable(2)) {
          throw new Error('Quickstart requires both dev wallets. Run "bun run setup".');
        }

        const p1Points = parsePoints(player1Points);
        if (!p1Points || p1Points <= 0n) throw new Error('Enter a valid points amount');

        const parsedSceneId = parseInt(sceneId);
        if (isNaN(parsedSceneId) || parsedSceneId <= 0) throw new Error('Enter a valid scene ID');

        const originalPlayer = devWalletService.getCurrentPlayer();
        let p1Addr = '', p2Addr = '';
        let p1Signer: ReturnType<typeof devWalletService.getSigner> | null = null;
        let p2Signer: ReturnType<typeof devWalletService.getSigner> | null = null;

        try {
          await devWalletService.initPlayer(1);
          p1Addr = devWalletService.getPublicKey();
          p1Signer = devWalletService.getSigner();
          await devWalletService.initPlayer(2);
          p2Addr = devWalletService.getPublicKey();
          p2Signer = devWalletService.getSigner();
        } finally {
          if (originalPlayer) await devWalletService.initPlayer(originalPlayer);
        }

        if (!p1Signer || !p2Signer) throw new Error('Failed to initialize dev wallet signers.');
        if (p1Addr === p2Addr) throw new Error('Quickstart requires two different dev wallets.');

        const qsSessionId = createRandomSessionId();
        setSessionId(qsSessionId);
        setPlayer1Address(p1Addr);

        const placeholder = await getFundedSimulationSourceAddress([p1Addr, p2Addr]);

        const authEntryXDR = await zkSeekService.prepareStartGame(
          qsSessionId, p1Addr, placeholder, p1Points, p1Points, parsedSceneId, p1Signer
        );

        const fullySignedTxXDR = await zkSeekService.importAndSignAuthEntry(
          authEntryXDR, p2Addr, p1Points, parsedSceneId, p2Signer
        );

        await zkSeekService.finalizeStartGame(fullySignedTxXDR, p2Addr, p2Signer);

        try {
          const game = await zkSeekService.getGame(qsSessionId);
          setGameState(game);
        } catch {}

        setGamePhase('commit');
        onStandingsRefresh();
        setSuccess('Quickstart complete! Both players signed. Now commit your coordinates.');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Quickstart failed');
      } finally {
        setQuickstartLoading(false);
      }
    });
  };

  const handleImportTransaction = async () => {
    await runAction(async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!importAuthEntryXDR.trim()) throw new Error('Enter auth entry XDR from Player 1');
        if (!importPlayer2Points.trim()) throw new Error('Enter your points amount');

        const p2Points = parsePoints(importPlayer2Points);
        if (!p2Points || p2Points <= 0n) throw new Error('Invalid Player 2 points');

        const parsedImportSceneId = parseInt(importSceneId);
        if (isNaN(parsedImportSceneId) || parsedImportSceneId <= 0) throw new Error('Enter a valid scene ID');

        const gameParams = zkSeekService.parseAuthEntry(importAuthEntryXDR.trim());
        setImportSessionId(gameParams.sessionId.toString());
        setImportPlayer1(gameParams.player1);
        setImportPlayer1Points((Number(gameParams.player1Points) / 10_000_000).toString());

        if (gameParams.player1 === userAddress) {
          throw new Error('You cannot play against yourself.');
        }

        const signer = getContractSigner();

        const fullySignedTxXDR = await zkSeekService.importAndSignAuthEntry(
          importAuthEntryXDR.trim(),
          userAddress,
          p2Points,
          parsedImportSceneId,
          signer
        );

        await zkSeekService.finalizeStartGame(fullySignedTxXDR, userAddress, signer);

        setSessionId(gameParams.sessionId);
        setSuccess('Game created! Both players signed.');
        setGamePhase('commit');

        setImportAuthEntryXDR('');
        setImportSessionId('');
        setImportPlayer1('');
        setImportPlayer1Points('');
        setImportPlayer2Points(DEFAULT_POINTS);

        await loadGameState();
        onStandingsRefresh();
        setTimeout(() => setSuccess(null), 2000);
      } catch (err) {
        let errorMessage = 'Failed to import and sign transaction';
        if (err instanceof Error) errorMessage = err.message;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    });
  };

  const handleLoadExistingGame = async () => {
    await runAction(async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const parsedSessionId = parseInt(loadSessionId.trim());
        if (isNaN(parsedSessionId) || parsedSessionId <= 0) throw new Error('Enter a valid session ID');

        const game = await requestCache.dedupe(
          createCacheKey('game-state', parsedSessionId),
          () => zkSeekService.getGame(parsedSessionId),
          5000
        );

        if (!game) throw new Error('Game not found');
        if (game.player1 !== userAddress && game.player2 !== userAddress) {
          throw new Error('You are not a player in this game');
        }

        setSessionId(parsedSessionId);
        setGameState(game);
        setLoadSessionId('');

        const phase = determinePhase(game);
        setGamePhase(phase);
        setSuccess('Game loaded!');
        setTimeout(() => setSuccess(null), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleSubmitCommitment = async () => {
    await runAction(async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const x = parseInt(commitX);
        const y = parseInt(commitY);
        if (isNaN(x) || isNaN(y) || x < 0 || y < 0) throw new Error('Enter valid X and Y coordinates (non-negative integers)');

        const salt = ZkSeekService.generateSalt();
        const commitment = ZkSeekService.computeCommitment(x, y, salt, userAddress);

        // Save BEFORE submitting — if tx fails, same salt retried; if tx succeeds but salt lost, player forfeits
        ZkSeekService.saveSaltAndCoords(sessionId, userAddress, salt, x, y);

        const signer = getContractSigner();
        await zkSeekService.submitCommitment(sessionId, userAddress, commitment, signer);

        setSuccess(`Commitment submitted for (${x}, ${y})! Salt saved locally.`);
        await loadGameState();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit commitment');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleReveal = async () => {
    await runAction(async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const data = ZkSeekService.loadSaltAndCoords(sessionId, userAddress);
        if (!data) throw new Error('No saved salt/coordinates found. If you cleared localStorage, the reveal cannot be completed.');

        const signer = getContractSigner();
        await zkSeekService.reveal(sessionId, userAddress, data.x, data.y, data.salt, signer);

        setSuccess(`Revealed coordinates (${data.x}, ${data.y})!`);
        await loadGameState();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reveal');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleResolveGame = async () => {
    await runAction(async () => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const tx = parseInt(resolveTargetX);
        const ty = parseInt(resolveTargetY);
        if (isNaN(tx) || isNaN(ty) || tx < 0 || ty < 0) throw new Error('Enter valid target X and Y');

        if (!resolveSceneSalt.trim()) throw new Error('Enter the scene salt (hex)');
        const saltBytes = new Uint8Array(resolveSceneSalt.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) ?? []);
        if (saltBytes.length !== 32) throw new Error('Scene salt must be exactly 32 bytes (64 hex characters)');

        // resolve_game requires admin auth, not player auth
        const { address: adminAddress, signer: adminSigner } = devWalletService.getAdminSigner();
        await zkSeekService.resolveGame(sessionId, tx, ty, saltBytes, adminAddress, adminSigner);

        setSuccess('Game resolved!');
        await loadGameState();
        onStandingsRefresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resolve game');
      } finally {
        setLoading(false);
      }
    });
  };

  // ── Clipboard ──
  const copyAuthEntryToClipboard = async () => {
    if (!exportedAuthEntryXDR) return;
    try {
      await navigator.clipboard.writeText(exportedAuthEntryXDR);
      setAuthEntryCopied(true);
      setTimeout(() => setAuthEntryCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const copyShareGameUrlWithAuthEntry = async () => {
    if (!exportedAuthEntryXDR) return;
    try {
      const params = new URLSearchParams({
        'game': 'zk-seek',
        'auth': exportedAuthEntryXDR,
        'scene': sceneId,
      });
      const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const copyShareGameUrlWithSessionId = async () => {
    if (!loadSessionId) return;
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?game=zk-seek&session-id=${loadSessionId}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  // ── Distance computation for complete phase ──
  const computeDistance = (px: number, py: number, targetX: number, targetY: number): number => {
    const dx = px - targetX;
    const dy = py - targetY;
    return dx * dx + dy * dy;
  };

  // ====================================================================
  // Render
  // ====================================================================

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-xl border-2 border-purple-200">
      <div className="flex items-center mb-6">
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
            ZK Seek
          </h2>
          <p className="text-sm text-gray-700 font-semibold mt-1">
            Commit-reveal coordinate game. Find the hidden target!
          </p>
          <p className="text-xs text-gray-500 font-mono mt-1">
            Session ID: {sessionId}
            {gameState && ` | Scene: ${gameState.scene_id}`}
            {gamePhase !== 'create' && ` | Phase: ${gamePhase}`}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl">
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
          <p className="text-sm font-semibold text-green-700">{success}</p>
        </div>
      )}

      {/* ============================================================ */}
      {/* CREATE PHASE                                                  */}
      {/* ============================================================ */}
      {gamePhase === 'create' && (
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 p-2 bg-gray-100 rounded-xl">
            <button
              onClick={() => { setCreateMode('create'); setExportedAuthEntryXDR(null); setLoadSessionId(''); }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${createMode === 'create' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Create & Export
            </button>
            <button
              onClick={() => { setCreateMode('import'); setExportedAuthEntryXDR(null); setLoadSessionId(''); }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${createMode === 'import' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Import Auth Entry
            </button>
            <button
              onClick={() => { setCreateMode('load'); setExportedAuthEntryXDR(null); }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${createMode === 'load' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Load Existing Game
            </button>
          </div>

          {/* Quickstart */}
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-yellow-900">Quickstart (Dev)</p>
                <p className="text-xs font-semibold text-yellow-800">
                  Creates and signs for both dev wallets in one click.
                </p>
              </div>
              <button
                onClick={handleQuickStart}
                disabled={isBusy || !quickstartAvailable}
                className="px-4 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-500 transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none"
              >
                {quickstartLoading ? 'Quickstarting...' : 'Quickstart Game'}
              </button>
            </div>
          </div>

          {/* ── CREATE MODE ── */}
          {createMode === 'create' ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Your Address (Player 1)</label>
                  <input
                    type="text"
                    value={player1Address}
                    onChange={(e) => setPlayer1Address(e.target.value.trim())}
                    placeholder="G..."
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 text-sm font-medium text-gray-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Your Points</label>
                    <input
                      type="text"
                      value={player1Points}
                      onChange={(e) => setPlayer1Points(e.target.value)}
                      placeholder="0.1"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 text-sm font-medium"
                    />
                    <p className="text-xs font-semibold text-gray-600 mt-1">
                      Available: {(Number(availablePoints) / 10000000).toFixed(2)} Points
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Scene ID</label>
                    <input
                      type="text"
                      value={sceneId}
                      onChange={(e) => setSceneId(e.target.value)}
                      placeholder="1"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 text-sm font-medium"
                    />
                    <p className="text-xs font-semibold text-gray-600 mt-1">
                      The pre-created scene to play on.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <p className="text-xs font-semibold text-blue-800">
                    Player 2 will specify their own address and points when they import your auth entry. The scene ID will be included in the share URL.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-gray-100 space-y-4">
                <p className="text-xs font-semibold text-gray-600">Session ID: {sessionId}</p>

                {!exportedAuthEntryXDR ? (
                  <button
                    onClick={handlePrepareTransaction}
                    disabled={isBusy}
                    className="w-full py-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                  >
                    {loading ? 'Preparing...' : 'Prepare & Export Auth Entry'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                      <p className="text-xs font-bold uppercase tracking-wide text-green-700 mb-2">
                        Auth Entry XDR (Player 1 Signed)
                      </p>
                      <div className="bg-white p-3 rounded-lg border border-green-200 mb-3">
                        <code className="text-xs font-mono text-gray-700 break-all">
                          {exportedAuthEntryXDR}
                        </code>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={copyAuthEntryToClipboard}
                          className="py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          {authEntryCopied ? 'Copied!' : 'Copy Auth Entry'}
                        </button>
                        <button
                          onClick={copyShareGameUrlWithAuthEntry}
                          className="py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          {shareUrlCopied ? 'Copied!' : 'Share URL'}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 text-center font-semibold">
                      Share with Player 2 to complete the game creation
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : createMode === 'import' ? (
            /* ── IMPORT MODE ── */
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
                <p className="text-sm font-semibold text-blue-800 mb-2">
                  Import Auth Entry from Player 1
                </p>
                <p className="text-xs text-gray-700 mb-4">
                  Paste the auth entry XDR. Session ID and Player 1 info will be auto-extracted. You must also specify the scene ID (from the share URL or Player 1).
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-2">
                      Auth Entry XDR
                      {xdrParsing && <span className="text-blue-500 text-xs animate-pulse">Parsing...</span>}
                      {xdrParseSuccess && <span className="text-green-600 text-xs">Parsed</span>}
                      {xdrParseError && <span className="text-red-600 text-xs">Failed</span>}
                    </label>
                    <textarea
                      value={importAuthEntryXDR}
                      onChange={(e) => setImportAuthEntryXDR(e.target.value)}
                      placeholder="Paste Player 1's signed auth entry XDR here..."
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl bg-white border-2 focus:outline-none focus:ring-4 text-xs font-mono resize-none transition-colors ${
                        xdrParseError ? 'border-red-300 focus:border-red-400 focus:ring-red-100' :
                        xdrParseSuccess ? 'border-green-300 focus:border-green-400 focus:ring-green-100' :
                        'border-blue-200 focus:border-blue-400 focus:ring-blue-100'
                      }`}
                    />
                    {xdrParseError && <p className="text-xs text-red-600 font-semibold mt-1">{xdrParseError}</p>}
                  </div>
                  {/* Auto-populated read-only fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Session ID (auto)</label>
                      <input type="text" value={importSessionId} readOnly placeholder="Auto-filled" className="w-full px-4 py-2 rounded-xl bg-gray-50 border-2 border-gray-200 text-xs font-mono text-gray-600 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">P1 Points (auto)</label>
                      <input type="text" value={importPlayer1Points} readOnly placeholder="Auto-filled" className="w-full px-4 py-2 rounded-xl bg-gray-50 border-2 border-gray-200 text-xs text-gray-600 cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Player 1 Address (auto)</label>
                    <input type="text" value={importPlayer1} readOnly placeholder="Auto-filled" className="w-full px-4 py-2 rounded-xl bg-gray-50 border-2 border-gray-200 text-xs font-mono text-gray-600 cursor-not-allowed" />
                  </div>
                  {/* User inputs */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Player 2 (You)</label>
                      <input type="text" value={userAddress} readOnly className="w-full px-4 py-2 rounded-xl bg-gray-50 border-2 border-gray-200 text-xs font-mono text-gray-600 cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Your Points *</label>
                      <input
                        type="text"
                        value={importPlayer2Points}
                        onChange={(e) => setImportPlayer2Points(e.target.value)}
                        placeholder="0.1"
                        className="w-full px-4 py-2 rounded-xl bg-white border-2 border-blue-200 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Scene ID *</label>
                      <input
                        type="text"
                        value={importSceneId}
                        onChange={(e) => setImportSceneId(e.target.value)}
                        placeholder="1"
                        className="w-full px-4 py-2 rounded-xl bg-white border-2 border-blue-200 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleImportTransaction}
                disabled={isBusy || !importAuthEntryXDR.trim() || !importPlayer2Points.trim() || !importSceneId.trim()}
                className="w-full py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-500 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none"
              >
                {loading ? 'Importing & Signing...' : 'Import & Sign Auth Entry'}
              </button>
            </div>
          ) : createMode === 'load' ? (
            /* ── LOAD MODE ── */
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                <p className="text-sm font-semibold text-green-800 mb-2">
                  Load Existing Game by Session ID
                </p>
                <p className="text-xs text-gray-700 mb-4">
                  Enter a session ID to rejoin an existing game. You must be one of the players.
                </p>
                <input
                  type="text"
                  value={loadSessionId}
                  onChange={(e) => setLoadSessionId(e.target.value)}
                  placeholder="Enter session ID"
                  className="w-full px-4 py-3 rounded-xl bg-white border-2 border-green-200 focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleLoadExistingGame}
                  disabled={isBusy || !loadSessionId.trim()}
                  className="py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-500 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none"
                >
                  {loading ? 'Loading...' : 'Load Game'}
                </button>
                <button
                  onClick={copyShareGameUrlWithSessionId}
                  disabled={!loadSessionId.trim()}
                  className="py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-500 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none"
                >
                  {shareUrlCopied ? 'Copied!' : 'Share Game'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ============================================================ */}
      {/* COMMIT PHASE                                                  */}
      {/* ============================================================ */}
      {gamePhase === 'commit' && gameState && (
        <div className="space-y-6">
          {/* Player status cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-5 rounded-xl border-2 ${isPlayer1 ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg' : 'border-gray-200 bg-white'}`}>
              <div className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">Player 1</div>
              <div className="font-mono text-sm font-semibold mb-2 text-gray-800">
                {gameState.player1.slice(0, 8)}...{gameState.player1.slice(-4)}
              </div>
              <div className="text-xs font-semibold text-gray-600">
                Points: {(Number(gameState.player1_points) / 10000000).toFixed(2)}
              </div>
              <div className="mt-3">
                {gameState.player1_commitment != null ? (
                  <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold shadow-md">
                    Committed
                  </div>
                ) : (
                  <div className="inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-xs font-bold">
                    Waiting...
                  </div>
                )}
              </div>
            </div>

            <div className={`p-5 rounded-xl border-2 ${isPlayer2 ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg' : 'border-gray-200 bg-white'}`}>
              <div className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">Player 2</div>
              <div className="font-mono text-sm font-semibold mb-2 text-gray-800">
                {gameState.player2.slice(0, 8)}...{gameState.player2.slice(-4)}
              </div>
              <div className="text-xs font-semibold text-gray-600">
                Points: {(Number(gameState.player2_points) / 10000000).toFixed(2)}
              </div>
              <div className="mt-3">
                {gameState.player2_commitment != null ? (
                  <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold shadow-md">
                    Committed
                  </div>
                ) : (
                  <div className="inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-xs font-bold">
                    Waiting...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Commitment form */}
          {(isPlayer1 || isPlayer2) && !hasCommitted && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl">
                <p className="text-sm font-bold text-indigo-900 mb-2">Submit Your Coordinates</p>
                <p className="text-xs text-gray-700 mb-4">
                  Choose your X and Y coordinates. A random salt will be generated and your commitment hash will be submitted on-chain. Your salt and coordinates are saved locally for the reveal phase.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">X Coordinate</label>
                    <input
                      type="number"
                      value={commitX}
                      onChange={(e) => setCommitX(e.target.value)}
                      placeholder="e.g., 300"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-indigo-200 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Y Coordinate</label>
                    <input
                      type="number"
                      value={commitY}
                      onChange={(e) => setCommitY(e.target.value)}
                      placeholder="e.g., 450"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-indigo-200 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                <p className="text-xs font-semibold text-yellow-800">
                  Your salt and coordinates are saved to localStorage BEFORE the transaction is submitted. Do not clear browser data before revealing, or the reveal will fail.
                </p>
              </div>

              <button
                onClick={handleSubmitCommitment}
                disabled={isBusy || !commitX.trim() || !commitY.trim()}
                className="w-full py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-500 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none"
              >
                {loading ? 'Committing...' : 'Submit Commitment'}
              </button>
            </div>
          )}

          {hasCommitted && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
              <p className="text-sm font-semibold text-blue-700">
                Your commitment is on-chain. Waiting for the other player to commit...
              </p>
              {savedData && (
                <p className="text-xs text-gray-600 mt-2">
                  Your saved coordinates: ({savedData.x}, {savedData.y})
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* REVEAL PHASE                                                  */}
      {/* ============================================================ */}
      {gamePhase === 'reveal' && gameState && (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 border-2 border-yellow-300 rounded-2xl text-center shadow-xl">
            <h3 className="text-2xl font-black text-gray-900 mb-3">
              Both Players Committed!
            </h3>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Now reveal your coordinates to prove your commitment.
            </p>

            {/* Player reveal status */}
            <div className="grid grid-cols-2 gap-4 my-4 text-left">
              <div className="p-3 bg-white/70 rounded-xl border border-yellow-200">
                <div className="text-xs font-bold uppercase text-gray-600 mb-1">Player 1</div>
                <div className="font-mono text-xs text-gray-700 mb-1">
                  {gameState.player1.slice(0, 8)}...{gameState.player1.slice(-4)}
                </div>
                {gameState.player1_x != null ? (
                  <div className="text-xs font-bold text-green-700">Revealed ({gameState.player1_x}, {gameState.player1_y})</div>
                ) : (
                  <div className="text-xs font-bold text-orange-600">Pending reveal</div>
                )}
              </div>
              <div className="p-3 bg-white/70 rounded-xl border border-yellow-200">
                <div className="text-xs font-bold uppercase text-gray-600 mb-1">Player 2</div>
                <div className="font-mono text-xs text-gray-700 mb-1">
                  {gameState.player2.slice(0, 8)}...{gameState.player2.slice(-4)}
                </div>
                {gameState.player2_x != null ? (
                  <div className="text-xs font-bold text-green-700">Revealed ({gameState.player2_x}, {gameState.player2_y})</div>
                ) : (
                  <div className="text-xs font-bold text-orange-600">Pending reveal</div>
                )}
              </div>
            </div>
          </div>

          {(isPlayer1 || isPlayer2) && !hasRevealed && (
            <div className="space-y-4">
              {savedData ? (
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                  <p className="text-sm font-bold text-green-900 mb-2">Ready to Reveal</p>
                  <p className="text-xs text-gray-700 mb-3">
                    Your saved coordinates: ({savedData.x}, {savedData.y}). Click below to reveal on-chain.
                  </p>
                  <button
                    onClick={handleReveal}
                    disabled={isBusy}
                    className="w-full py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-500 hover:from-yellow-600 hover:via-orange-600 hover:to-amber-600 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-500 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none"
                  >
                    {loading ? 'Revealing...' : 'Reveal Coordinates'}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl">
                  <p className="text-sm font-bold text-red-900 mb-2">Salt Not Found</p>
                  <p className="text-xs text-gray-700">
                    No saved salt/coordinates found in localStorage for this session. If you cleared your browser data, the reveal cannot be completed and the game may be stuck.
                  </p>
                </div>
              )}
            </div>
          )}

          {hasRevealed && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
              <p className="text-sm font-semibold text-blue-700">
                You've revealed! Waiting for the other player to reveal...
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* RESOLVE PHASE                                                 */}
      {/* ============================================================ */}
      {gamePhase === 'resolve' && gameState && (
        <div className="space-y-6">
          <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-300 rounded-2xl shadow-xl">
            <h3 className="text-2xl font-black text-gray-900 mb-3 text-center">
              Both Players Revealed
            </h3>
            <p className="text-sm font-semibold text-gray-700 mb-4 text-center">
              Waiting for the admin to reveal the target and resolve the game.
            </p>

            {/* Show revealed coordinates */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-white/70 rounded-xl border border-cyan-200">
                <div className="text-xs font-bold uppercase text-gray-600 mb-1">Player 1</div>
                <div className="font-mono text-xs text-gray-700 mb-1">
                  {gameState.player1.slice(0, 8)}...{gameState.player1.slice(-4)}
                </div>
                <div className="text-sm font-bold text-gray-900">
                  ({gameState.player1_x}, {gameState.player1_y})
                </div>
              </div>
              <div className="p-4 bg-white/70 rounded-xl border border-cyan-200">
                <div className="text-xs font-bold uppercase text-gray-600 mb-1">Player 2</div>
                <div className="font-mono text-xs text-gray-700 mb-1">
                  {gameState.player2.slice(0, 8)}...{gameState.player2.slice(-4)}
                </div>
                <div className="text-sm font-bold text-gray-900">
                  ({gameState.player2_x}, {gameState.player2_y})
                </div>
              </div>
            </div>
          </div>

          {/* Admin resolve controls (dev mode) */}
          {walletType === 'dev' && (
            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl">
              <p className="text-sm font-bold text-orange-900 mb-3">Admin: Resolve Game</p>
              <p className="text-xs text-gray-700 mb-4">
                Enter the target coordinates and scene salt to resolve. The contract verifies your target matches the scene's pre-committed hash.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target X</label>
                  <input
                    type="number"
                    value={resolveTargetX}
                    onChange={(e) => setResolveTargetX(e.target.value)}
                    placeholder="300"
                    min="0"
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-orange-200 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target Y</label>
                  <input
                    type="number"
                    value={resolveTargetY}
                    onChange={(e) => setResolveTargetY(e.target.value)}
                    placeholder="450"
                    min="0"
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-orange-200 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Scene Salt (hex)</label>
                  <input
                    type="text"
                    value={resolveSceneSalt}
                    onChange={(e) => setResolveSceneSalt(e.target.value)}
                    placeholder="abcd...64 hex chars"
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-orange-200 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 text-xs font-mono"
                  />
                </div>
              </div>
              <button
                onClick={handleResolveGame}
                disabled={isBusy || !resolveTargetX.trim() || !resolveTargetY.trim() || !resolveSceneSalt.trim()}
                className="w-full py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-500 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:transform-none"
              >
                {loading ? 'Resolving...' : 'Resolve Game'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* COMPLETE PHASE                                                */}
      {/* ============================================================ */}
      {gamePhase === 'complete' && gameState && (
        <div className="space-y-6">
          <div className="p-10 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-2xl text-center shadow-2xl">
            <h3 className="text-3xl font-black text-gray-900 mb-6">
              Game Complete!
            </h3>

            {/* Player results */}
            <div className="space-y-3 mb-6">
              <div className="p-4 bg-white/70 border border-green-200 rounded-xl text-left">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">Player 1</p>
                <p className="font-mono text-xs text-gray-700 mb-1">
                  {gameState.player1.slice(0, 8)}...{gameState.player1.slice(-4)}
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  Coordinates: ({gameState.player1_x ?? '?'}, {gameState.player1_y ?? '?'})
                  {gameState.player1_x != null && gameState.player2_x != null && (
                    <span className="text-xs text-gray-500 ml-2">
                      (dist&sup2; from revealed coords)
                    </span>
                  )}
                </p>
              </div>

              <div className="p-4 bg-white/70 border border-green-200 rounded-xl text-left">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-1">Player 2</p>
                <p className="font-mono text-xs text-gray-700 mb-1">
                  {gameState.player2.slice(0, 8)}...{gameState.player2.slice(-4)}
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  Coordinates: ({gameState.player2_x ?? '?'}, {gameState.player2_y ?? '?'})
                </p>
              </div>
            </div>

            {gameState.winner && (
              <div className="mt-6 p-5 bg-white border-2 border-green-200 rounded-xl shadow-lg">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-600 mb-2">Winner</p>
                <p className="font-mono text-sm font-bold text-gray-800">
                  {gameState.winner.slice(0, 8)}...{gameState.winner.slice(-4)}
                </p>
                {gameState.winner === userAddress && (
                  <p className="mt-3 text-green-700 font-black text-lg">You won!</p>
                )}
                {gameState.winner !== userAddress && (isPlayer1 || isPlayer2) && (
                  <p className="mt-3 text-gray-600 font-semibold">Better luck next time!</p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleStartNewGame}
            className="w-full py-4 rounded-xl font-bold text-gray-700 bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start New Game
          </button>
        </div>
      )}
    </div>
  );
}
