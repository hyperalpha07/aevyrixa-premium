"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HelpCircle, MessageCircle, Package, Ruler, Send, X } from "lucide-react";

const STORAGE_KEY = "aevyrixa-chat-session";
const POLL_INTERVAL_MS = 7000;

type ChatMessage = {
  id: string;
  body: string;
  sender_type: "customer" | "admin";
  created_at: string;
};

type StoredSession = {
  conversationId: string;
  publicToken: string;
};

type Props = {
  enabled: boolean;
  label: string;
  placement: string;
  whatsappAlsoEnabled: boolean;
  whatsappUrl: string;
  supportPhone: string;
};

function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "conversationId" in parsed &&
      "publicToken" in parsed &&
      typeof (parsed as Record<string, unknown>).conversationId === "string" &&
      typeof (parsed as Record<string, unknown>).publicToken === "string"
    ) {
      return parsed as StoredSession;
    }
    return null;
  } catch {
    return null;
  }
}

function saveSession(session: StoredSession) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage not available
  }
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage not available
  }
}

export default function LiveChatWidget({
  enabled,
  label,
  placement,
  whatsappAlsoEnabled,
  whatsappUrl,
  supportPhone,
}: Props) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sendError, setSendError] = useState("");
  const [conversationClosed, setConversationClosed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = loadSession();
    if (stored) setSession(stored);
  }, []);

  // Load history when session is set and panel opens
  const loadHistory = useCallback(
    async (sess: StoredSession) => {
      try {
        const res = await fetch(
          `/api/support/conversations/${encodeURIComponent(sess.conversationId)}?token=${encodeURIComponent(sess.publicToken)}`,
          { cache: "no-store" }
        );

        if (res.status === 404) {
          clearSession();
          setSession(null);
          setMessages([]);
          return;
        }

        if (!res.ok) return;

        const data = (await res.json()) as {
          status?: string;
          messages?: ChatMessage[];
        };

        if (data.status === "closed") setConversationClosed(true);
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
          setTimeout(scrollToBottom, 50);
        }
      } catch {
        // network error — keep showing existing messages
      }
    },
    [scrollToBottom]
  );

  useEffect(() => {
    if (open && session) {
      setLoadingHistory(true);
      loadHistory(session).finally(() => setLoadingHistory(false));
    }
  }, [open, session, loadHistory]);

  // Polling for new messages
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);

    if (open && session) {
      pollRef.current = setInterval(() => {
        loadHistory(session).catch(() => null);
      }, POLL_INTERVAL_MS);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, session, loadHistory]);

  const hasAdminReply = messages.some((m) => m.sender_type === "admin");
  const hasMessages = messages.length > 0;

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      setSending(true);
      setSendError("");

      try {
        let currentSession = session;
        let firstMessageSent = false;

        if (!currentSession) {
          // Create conversation and include first message in same request
          const convRes = await fetch("/api/support/conversations", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              sourcePage: window.location.pathname,
              message: trimmed,
            }),
          });

          if (!convRes.ok) {
            setSendError("Could not start chat. Please try WhatsApp.");
            return;
          }

          const convData = (await convRes.json()) as {
            id: string;
            public_token: string;
            messages?: ChatMessage[];
          };

          currentSession = {
            conversationId: convData.id,
            publicToken: convData.public_token,
          };

          saveSession(currentSession);
          setSession(currentSession);

          if (Array.isArray(convData.messages) && convData.messages.length > 0) {
            setMessages((prev) => [...prev, ...convData.messages!]);
            firstMessageSent = true;
          }
        }

        if (!firstMessageSent) {
          const msgRes = await fetch(
            `/api/support/conversations/${encodeURIComponent(currentSession.conversationId)}/messages`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                body: trimmed,
                token: currentSession.publicToken,
              }),
            }
          );

          if (msgRes.status === 410) {
            setConversationClosed(true);
            setSendError("This conversation has been closed.");
            return;
          }

          if (!msgRes.ok) {
            setSendError("Failed to send. Please try again.");
            return;
          }

          const newMsg = (await msgRes.json()) as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
        }

        setInputText("");
        setTimeout(scrollToBottom, 50);
      } catch {
        setSendError("Network error. Please try again.");
      } finally {
        setSending(false);
      }
    },
    [session, sending, scrollToBottom]
  );

  const handleQuickAction = (action: "track" | "product" | "size" | "whatsapp") => {
    if (action === "track") {
      window.open("/track-order", "_blank", "noopener,noreferrer");
      return;
    }
    if (action === "whatsapp") {
      if (whatsappUrl) window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      else if (supportPhone) window.open(`tel:${supportPhone}`, "_self");
      return;
    }

    const starters: Record<string, string> = {
      product: "I need help choosing a product.",
      size: "I need help choosing the right size.",
    };

    const text = starters[action];
    if (text) {
      setInputText(text);
      inputRef.current?.focus();
    }
  };

  if (!enabled || (placement !== "homepage" && placement !== "all")) return null;

  const bottomClass = whatsappAlsoEnabled
    ? "bottom-[4.75rem] sm:bottom-[5.5rem]"
    : "bottom-6 sm:bottom-8";

  return (
    <>
      <div className={`fixed ${bottomClass} right-4 z-50 sm:right-6`}>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 rounded-full border border-white/20 bg-[#1a1a2e]/90 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.36)] backdrop-blur-xl transition hover:border-cyan-200/40 hover:bg-[#1e2240]"
        >
          <MessageCircle className="h-4 w-4 shrink-0 text-cyan-300" />
          <span>{label || "Need Help?"}</span>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-end p-4 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#0a0f1e] shadow-[0_24px_80px_rgba(0,0,0,0.72)] backdrop-blur-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
                <span className="text-sm font-semibold text-white">Aevyrixa Support</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close support panel"
                className="rounded-full p-1 text-white/50 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick actions (small chips, always visible) */}
            <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] px-4 py-3">
              <button
                onClick={() => handleQuickAction("track")}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition hover:border-cyan-200/30 hover:text-white"
              >
                <Package className="h-3 w-3 text-cyan-300" />
                Track Order
              </button>
              <button
                onClick={() => handleQuickAction("product")}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition hover:border-violet-200/30 hover:text-white"
              >
                <HelpCircle className="h-3 w-3 text-violet-300" />
                Product Help
              </button>
              <button
                onClick={() => handleQuickAction("size")}
                className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition hover:border-sky-200/30 hover:text-white"
              >
                <Ruler className="h-3 w-3 text-sky-300" />
                Size Help
              </button>
              {(whatsappUrl || supportPhone) && (
                <button
                  onClick={() => handleQuickAction("whatsapp")}
                  className="flex items-center gap-1 rounded-full border border-[#00D4C6]/25 bg-[#00D4C6]/[0.06] px-3 py-1.5 text-xs font-medium text-[#31E6D4]/85 transition hover:border-[#00D4C6]/45"
                >
                  <svg viewBox="0 0 24 24" className="h-3 w-3 fill-[#31E6D4]" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  WhatsApp
                </button>
              )}
            </div>

            {/* Message history */}
            <div className="flex max-h-72 min-h-[8rem] flex-col gap-2 overflow-y-auto px-4 py-3">
              {!hasMessages && !loadingHistory && (
                <p className="text-center text-xs leading-5 text-white/45">
                  Send a message and our support team will reply as soon as possible.
                </p>
              )}

              {loadingHistory && (
                <p className="text-center text-xs text-white/38">Loading…</p>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === "customer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${
                      msg.sender_type === "customer"
                        ? "rounded-br-sm bg-cyan-500/20 text-cyan-50"
                        : "rounded-bl-sm bg-white/[0.08] text-white/85"
                    }`}
                  >
                    {msg.sender_type === "admin" && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-300/60">
                        Support
                      </p>
                    )}
                    <p className="break-words">{msg.body}</p>
                  </div>
                </div>
              ))}

              {hasMessages && !hasAdminReply && !conversationClosed && (
                <p className="mt-1 text-center text-[11px] leading-5 text-white/38">
                  Thanks — our support team will reply here as soon as possible.
                  For urgent help, use WhatsApp.
                </p>
              )}

              {conversationClosed && (
                <p className="mt-1 text-center text-[11px] leading-5 text-amber-200/60">
                  This conversation has been closed.
                </p>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            {!conversationClosed && (
              <div className="border-t border-white/[0.08] px-4 py-3">
                {sendError && (
                  <p className="mb-2 text-[11px] text-rose-300/80">{sendError}</p>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(inputText).catch(() => null);
                      }
                    }}
                    placeholder="Type a message…"
                    rows={1}
                    className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder-white/35 outline-none focus:border-cyan-200/30 focus:ring-0"
                    style={{ maxHeight: "80px" }}
                  />
                  <button
                    onClick={() => sendMessage(inputText).catch(() => null)}
                    disabled={sending || !inputText.trim()}
                    aria-label="Send message"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#FF4DB8] to-[#FF3FA4] text-white shadow-[0_4px_16px_rgba(255,77,184,0.30)] transition hover:shadow-[0_4px_22px_rgba(255,77,184,0.45)] disabled:opacity-40"
                  >
                    {sending ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {conversationClosed && (
              <div className="border-t border-white/[0.08] px-5 py-3">
                <button
                  onClick={() => {
                    clearSession();
                    setSession(null);
                    setMessages([]);
                    setConversationClosed(false);
                    setSendError("");
                  }}
                  className="w-full rounded-full border border-white/10 bg-white/[0.04] py-2 text-xs font-medium text-white/60 transition hover:text-white"
                >
                  Start new conversation
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
