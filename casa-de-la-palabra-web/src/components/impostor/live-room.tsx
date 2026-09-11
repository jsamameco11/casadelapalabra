"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { IconUsers } from "@/components/impostor/icons";

interface Room {
  id: string;
  code: string;
  status: "lobby" | "in_progress" | "voting" | "revealed" | "closed";
  current_round: number;
  host_user_id: string;
  impostor_count: number;
  clue_rounds: number;
}

interface PlayerRow {
  id: string;
  user_id: string;
  display_name: string | null;
  status: string;
}

interface Card {
  is_impostor: boolean;
  word: string | null;
  category_name: string;
  hint_reference: string | null;
}

interface RevealResult {
  impostor_caught: boolean;
  impostor_player_ids: string[];
  most_voted_player_id: string | null;
  word: string;
  hint_reference: string | null;
  category_name: string;
  vote_counts: Record<string, number>;
}

export function LiveRoom({ roomId }: { roomId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [onlineNames, setOnlineNames] = useState<Set<string>>(new Set());
  const [card, setCard] = useState<Card | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [result, setResult] = useState<RevealResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const channelRef = useRef<RealtimeChannel | null>(null);

  const myPlayer = players.find((p) => p.user_id === userId) ?? null;
  const isHost = !!room && room.host_user_id === userId;

  const refreshRoom = useCallback(async () => {
    const { data } = await supabase.from("casa_impostor_rooms").select("*").eq("id", roomId).maybeSingle();
    if (!data) {
      setNotFound(true);
      return;
    }
    setRoom(data as Room);
  }, [roomId, supabase]);

  const refreshPlayers = useCallback(async () => {
    const { data } = await supabase
      .from("casa_impostor_players_public")
      .select("id, user_id, display_name, status")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true });
    setPlayers((data as PlayerRow[]) ?? []);
  }, [roomId, supabase]);

  const refreshVotes = useCallback(
    async (round: number) => {
      const { data } = await supabase
        .from("casa_impostor_votes_public")
        .select("voter_player_id")
        .eq("room_id", roomId)
        .eq("round", round);
      setVotedIds(new Set((data ?? []).map((v) => v.voter_player_id)));
    },
    [roomId, supabase]
  );

  const refreshCard = useCallback(async () => {
    const { data, error } = await supabase.rpc("casa_impostor_get_my_card", { p_room_id: roomId });
    if (!error) {
      const row = Array.isArray(data) ? data[0] : data;
      setCard(row as Card);
    }
  }, [roomId, supabase]);

  const refreshResult = useCallback(async () => {
    const { data, error } = await supabase.rpc("casa_impostor_get_reveal_result", { p_room_id: roomId });
    if (!error) {
      const row = Array.isArray(data) ? data[0] : data;
      setResult(row as RevealResult);
    }
  }, [roomId, supabase]);

  // Initial load + auth check.
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(`/juegos/impostor-biblico/sala/${roomId}`)}&reason=impostor`);
        return;
      }
      setUserId(user.id);
      await refreshRoom();
      await refreshPlayers();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // React to room status/round changes: refetch whatever each phase needs.
  useEffect(() => {
    if (!room) return;
    refreshPlayers();
    if (room.status === "in_progress" || room.status === "voting") {
      refreshCard();
      refreshVotes(room.current_round);
    }
    if (room.status === "revealed") {
      refreshResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status, room?.current_round]);

  // Realtime: DB changes on the room row (public-read, safe) + presence for
  // "who's online now" in the lobby.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`impostor-room-${roomId}`, { config: { presence: { key: userId } } })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "casa_impostor_rooms", filter: `id=eq.${roomId}` },
        (payload) => setRoom(payload.new as Room)
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ name: string }>();
        const names = new Set<string>();
        Object.values(state).forEach((entries) => entries.forEach((e) => names.add(e.name)));
        setOnlineNames(names);
      })
      .on("presence", { event: "join" }, () => {
        refreshPlayers();
      });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ name: myPlayer?.display_name ?? "Jugador" });
      }
    });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId]);

  async function startGame() {
    setBusy(true);
    setError("");
    const { error } = await supabase.rpc("casa_impostor_start_game", { p_room_id: roomId });
    setBusy(false);
    if (error) setError(error.message);
  }

  async function castVote() {
    if (!selectedSuspect) return;
    setBusy(true);
    setError("");
    const { error } = await supabase.rpc("casa_impostor_cast_vote", {
      p_room_id: roomId,
      p_voted_for_player_id: selectedSuspect,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (room) refreshVotes(room.current_round);
    if (room?.status === "in_progress") await refreshRoom();
  }

  async function reveal() {
    setBusy(true);
    setError("");
    const { error } = await supabase.rpc("casa_impostor_reveal", { p_room_id: roomId });
    setBusy(false);
    if (error) setError(error.message);
  }

  async function kick(playerId: string) {
    await supabase.rpc("casa_impostor_kick_player", { p_room_id: roomId, p_player_id: playerId });
    refreshPlayers();
  }

  async function closeRoom() {
    await supabase.rpc("casa_impostor_close_room", { p_room_id: roomId });
  }

  async function leaveRoom() {
    await supabase.rpc("casa_impostor_leave_room", { p_room_id: roomId });
    router.push("/juegos/impostor-biblico");
  }

  if (notFound) {
    return <Status message="Esta sala no existe." />;
  }
  if (!room || !userId) {
    return <Status message="Cargando sala…" />;
  }
  if (!myPlayer && room.status !== "closed") {
    return <Status message="No perteneces a esta sala." />;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Código de sala</p>
          <p className="font-display text-2xl font-medium tracking-wide">{room.code}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <IconUsers className="h-4 w-4" />
          {players.filter((p) => p.status !== "left" && p.status !== "kicked").length} jugadores
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {room.status === "lobby" && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-medium">Sala de espera</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Comparte el código con el grupo. Se necesitan al menos 3 jugadores.
          </p>
          <PlayerList players={players} onlineNames={onlineNames} hostId={room.host_user_id} isHost={isHost} onKick={kick} />
          {isHost ? (
            <button
              onClick={startGame}
              disabled={busy}
              className="mt-6 w-full rounded-full bg-primary py-3.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Iniciando…" : "Iniciar partida"}
            </button>
          ) : (
            <p className="mt-6 text-center text-sm text-muted-foreground">Esperando a que el anfitrión inicie…</p>
          )}
          <div className="mt-3 flex justify-center gap-4 text-xs text-muted-foreground">
            {isHost ? (
              <button onClick={closeRoom} className="hover:text-red-600">
                Cerrar sala
              </button>
            ) : (
              <button onClick={leaveRoom} className="hover:text-foreground">
                Salir de la sala
              </button>
            )}
          </div>
        </div>
      )}

      {(room.status === "in_progress" || room.status === "voting") && (
        <div className="mt-8">
          {card && (
            <div className="mb-6">
              {card.is_impostor ? (
                <div className="rounded-3xl border-2 border-accent bg-card p-8 text-center">
                  <p className="font-display text-xl font-medium text-accent">Eres el impostor</p>
                  <p className="mt-1 text-sm text-foreground/70">Categoría: {card.category_name}</p>
                </div>
              ) : (
                <div className="rounded-3xl border-2 border-primary bg-card p-8 text-center">
                  <p className="text-xs uppercase tracking-widest text-accent">{card.category_name}</p>
                  <p className="mt-2 font-display text-2xl font-medium">{card.word}</p>
                </div>
              )}
            </div>
          )}

          <PlayerList
            players={players}
            onlineNames={onlineNames}
            hostId={room.host_user_id}
            isHost={isHost}
            onKick={kick}
            votedIds={votedIds}
          />

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-center">¿A quién votas como impostor?</p>
            <div className="grid gap-2">
              {players
                .filter((p) => p.id !== myPlayer?.id && p.status !== "left" && p.status !== "kicked")
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedSuspect(p.id)}
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      selectedSuspect === p.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                    }`}
                  >
                    {p.display_name ?? "Jugador"}
                  </button>
                ))}
            </div>
            <button
              onClick={castVote}
              disabled={!selectedSuspect || busy}
              className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              Votar
            </button>
          </div>

          {isHost && (
            <button
              onClick={reveal}
              disabled={busy}
              className="mt-4 w-full rounded-full border border-border py-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              Revelar resultado
            </button>
          )}
        </div>
      )}

      {room.status === "revealed" && result && (
        <div className="mt-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Resultado</p>
          <h2 className="mt-2 font-display text-2xl font-medium">
            {result.impostor_caught ? "¡Descubrieron al impostor!" : "El impostor escapó"}
          </h2>
          <p className="mt-2 text-sm text-foreground/70">
            {result.impostor_player_ids.length === 1 ? "El impostor era" : "Los impostores eran"}:{" "}
            <strong>
              {players
                .filter((p) => result.impostor_player_ids.includes(p.id))
                .map((p) => p.display_name ?? "Jugador")
                .join(", ")}
            </strong>
          </p>
          <div className="mt-5 rounded-2xl bg-muted p-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{result.category_name}</p>
            <p className="mt-1 font-display text-xl font-medium">{result.word}</p>
            {result.hint_reference && <p className="mt-1 text-sm text-primary">{result.hint_reference}</p>}
          </div>

          {isHost ? (
            <div className="mt-8 flex flex-col gap-2">
              <button
                onClick={startGame}
                className="rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Siguiente ronda
              </button>
              <button onClick={closeRoom} className="rounded-full border border-border py-3 text-sm font-medium hover:bg-muted">
                Cerrar sala
              </button>
            </div>
          ) : (
            <p className="mt-8 text-sm text-muted-foreground">Esperando a que el anfitrión inicie otra ronda…</p>
          )}
        </div>
      )}

      {room.status === "closed" && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">Esta sala fue cerrada.</p>
          <Link href="/juegos/impostor-biblico" className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
            Volver
          </Link>
        </div>
      )}
    </div>
  );
}

function PlayerList({
  players,
  onlineNames,
  hostId,
  isHost,
  onKick,
  votedIds,
}: {
  players: PlayerRow[];
  onlineNames: Set<string>;
  hostId: string;
  isHost: boolean;
  onKick: (id: string) => void;
  votedIds?: Set<string>;
}) {
  return (
    <div className="space-y-2">
      {players
        .filter((p) => p.status !== "left" && p.status !== "kicked")
        .map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${onlineNames.has(p.display_name ?? "Jugador") ? "bg-primary" : "bg-border"}`} />
              <span className="text-sm">{p.display_name ?? "Jugador"}</span>
              {p.user_id === hostId && <span className="text-xs text-accent">Anfitrión</span>}
              {votedIds?.has(p.id) && <span className="text-xs text-primary">✓ votó</span>}
            </div>
            {isHost && p.user_id !== hostId && (
              <button onClick={() => onKick(p.id)} className="text-xs text-muted-foreground hover:text-red-600">
                Expulsar
              </button>
            )}
          </div>
        ))}
    </div>
  );
}

function Status({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
