'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ============================================================================
// CONFIG
// ============================================================================

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://www.senyum.or.id';

// ============================================================================
// TYPES
// ============================================================================

interface CommentSectionProps {
  slug: string;
  initialComments?: any[];
}

interface CommentItem {
  id: string;

  post_id?: string | null;
  post_slug?: string | null;
  post_title?: string | null;

  name: string;
  message: string;

  status?: string;

  parent_id?: string | null;

  created_at: string;
  updated_at?: string | null;
}

// ============================================================================
// HELPER
// ============================================================================

function normalizeComment(comment: any): CommentItem {
  return {
    id:
      comment?.id ||
      `${Date.now()}-${Math.random()}`,

    post_id:
      comment?.post_id ??
      null,

    post_slug:
      comment?.post_slug ??
      comment?.slug ??
      null,

    post_title:
      comment?.post_title ??
      null,

    // Mendukung database lama + database baru
    name:
      comment?.name ||
      comment?.nama ||
      'Pengguna Google',

    message:
      comment?.message ||
      comment?.komentar ||
      '',

    status:
      comment?.status ||
      'approved',

    parent_id:
      comment?.parent_id ??
      null,

    created_at:
      comment?.created_at ||
      new Date().toISOString(),

    updated_at:
      comment?.updated_at ??
      null,
  };
}

function formatDate(dateString: string) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  } catch {
    return '';
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function CommentSection({
  slug,
  initialComments = [],
}: CommentSectionProps) {
  const router = useRouter();

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [user, setUser] =
    useState<User | null>(null);

  const [comments, setComments] =
    useState<CommentItem[]>(() =>
      initialComments.map(normalizeComment)
    );

  const [komentar, setKomentar] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [commentsLoading, setCommentsLoading] =
    useState(false);

  const [msg, setMsg] =
    useState('');

  const [msgType, setMsgType] =
    useState<'success' | 'error' | 'info' | ''>('');

  // ==========================================================================
  // NORMALISASI initialComments
  // ==========================================================================

  useEffect(() => {
    setComments(
      initialComments.map(normalizeComment)
    );
  }, [initialComments]);

  // ==========================================================================
  // AUTH
  // ==========================================================================

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setUser(
          session?.user ??
          null
        );
      } catch (error) {
        console.error(
          'Gagal membaca session Supabase:',
          error
        );
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    };

    checkUser();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!mounted) return;

          setUser(
            session?.user ??
            null
          );

          setAuthLoading(false);
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ==========================================================================
  // AMBIL KOMENTAR TERBARU
  // ==========================================================================

  const loadComments = async () => {
    if (!slug) return;

    try {
      setCommentsLoading(true);

      const response = await fetch(
        `/api/comment?slug=${encodeURIComponent(slug)}`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const data =
        await response.json();

      if (
        response.ok &&
        data.success &&
        Array.isArray(data.comments)
      ) {
        setComments(
          data.comments.map(
            normalizeComment
          )
        );
      }
    } catch (error) {
      console.error(
        'Gagal mengambil komentar:',
        error
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  // ==========================================================================
  // LOGIN GOOGLE
  // ==========================================================================

  const handleGoogleLogin =
    async () => {
      try {
        setMsg('');
        setMsgType('');

        // Ambil path artikel tanpa hash/token OAuth
        const pathname =
          window.location.pathname;

        const search =
          window.location.search;

        // Production selalu kembali ke senyum.or.id
        // tetapi tetap kembali ke artikel yang sedang dibaca
        const redirectTo =
          `${SITE_URL}${pathname}${search}`;

        const { error } =
          await supabase.auth.signInWithOAuth({
            provider: 'google',

            options: {
              redirectTo,

              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          });

        if (error) {
          throw error;
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Tidak diketahui';

        setMsg(
          `Gagal masuk dengan Google: ${message}`
        );

        setMsgType('error');
      }
    };

  // ==========================================================================
  // LOGOUT
  // ==========================================================================

  const handleLogout =
    async () => {
      try {
        setMsg('');
        setMsgType('');

        const { error } =
          await supabase.auth.signOut();

        if (error) {
          throw error;
        }

        setUser(null);

        router.refresh();
      } catch (error) {
        console.error(
          'Logout error:',
          error
        );

        setMsg(
          'Gagal keluar dari akun.'
        );

        setMsgType('error');
      }
    };

  // ==========================================================================
  // SUBMIT COMMENT
  // ==========================================================================

  const handleSubmit =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (!user) {
        setMsg(
          'Silakan masuk dengan Google terlebih dahulu.'
        );

        setMsgType('error');

        return;
      }

      const cleanedComment =
        komentar.trim();

      if (!cleanedComment) {
        setMsg(
          'Komentar tidak boleh kosong.'
        );

        setMsgType('error');

        return;
      }

      if (
        cleanedComment.length >
        3000
      ) {
        setMsg(
          'Komentar maksimal 3000 karakter.'
        );

        setMsgType('error');

        return;
      }

      setLoading(true);
      setMsg('');
      setMsgType('');

      try {
        // ================================================================
        // Ambil session terbaru
        // ================================================================

        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        if (!session) {
          setUser(null);

          setMsg(
            'Sesi login Anda telah berakhir. Silakan masuk kembali.'
          );

          setMsgType('error');

          return;
        }

        // ================================================================
        // Data Google
        // ================================================================

        const userNama =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Pengguna Google';

        const userEmail =
          user.email ||
          '';

        // ================================================================
        // POST COMMENT
        // ================================================================

        const response =
          await fetch('/api/comment', {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              // Access token dikirim agar API nantinya
              // dapat memverifikasi pengguna Google
              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
              slug,

              postId: slug,

              nama: userNama,

              email: userEmail,

              komentar:
                cleanedComment,
            }),
          });

        const responseData =
          await response.json();

        if (
          !response.ok ||
          !responseData.success
        ) {
          throw new Error(
            responseData.error ||
            'Komentar gagal dikirim.'
          );
        }

        // ================================================================
        // RESET TEXTAREA
        // ================================================================

        setKomentar('');

        // ================================================================
        // JIKA LANGSUNG APPROVED
        // ================================================================

        if (
          responseData.comment &&
          responseData.comment.status ===
            'approved'
        ) {
          const newComment =
            normalizeComment(
              responseData.comment
            );

          // Langsung tampil tanpa reload halaman
          setComments(
            (previousComments) => {
              const alreadyExists =
                previousComments.some(
                  (item) =>
                    item.id ===
                    newComment.id
                );

              if (alreadyExists) {
                return previousComments;
              }

              return [
                ...previousComments,
                newComment,
              ];
            }
          );

          setMsg(
            'Komentar Anda berhasil diterbitkan.'
          );

          setMsgType('success');
        } else {
          // ==============================================================
          // JIKA MASIH PENDING
          // ==============================================================

          setMsg(
            responseData.message ||
            'Komentar berhasil dikirim dan menunggu persetujuan.'
          );

          setMsgType('info');
        }

        // ================================================================
        // Sinkronisasi dengan database
        // ================================================================

        await loadComments();

        router.refresh();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan jaringan.';

        setMsg(message);

        setMsgType('error');
      } finally {
        setLoading(false);
      }
    };

  // ==========================================================================
  // USER INFO
  // ==========================================================================

  const userName =
    useMemo(() => {
      if (!user) return '';

      return (
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Pengguna Google'
      );
    }, [user]);

  const avatarUrl =
    useMemo(() => {
      if (!user) return '';

      return (
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        ''
      );
    }, [user]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <section className="mt-12 border-t border-gray-200 pt-8">

      {/* ================================================================ */}
      {/* TITLE */}
      {/* ================================================================ */}

      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight text-gray-950 uppercase">
          <span>💬</span>

          <span>
            Komentar ({comments.length})
          </span>
        </h3>

        {commentsLoading && (
          <span className="text-xs text-gray-400">
            Memperbarui...
          </span>
        )}
      </div>

      {/* ================================================================ */}
      {/* LOGIN INFO */}
      {/* ================================================================ */}

      {!authLoading && user && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-[#087F8C]/15 bg-[#087F8C]/5 px-4 py-3">

          <div className="flex min-w-0 items-center gap-3">

            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                referrerPolicy="no-referrer"
                className="h-8 w-8 shrink-0 rounded-full border border-[#087F8C]/20 object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#087F8C] text-xs font-bold text-white">
                {userName
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs text-gray-500">
                Masuk sebagai
              </p>

              <p className="truncate text-sm font-semibold text-gray-800">
                <span className="text-[#087F8C]">
                  {userName}
                </span>

                {user.email && (
                  <span className="font-normal text-gray-500">
                    {' '}
                    ({user.email})
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 text-xs font-bold text-gray-400 transition hover:text-red-600"
          >
            Keluar
          </button>
        </div>
      )}

      {/* ================================================================ */}
      {/* COMMENT LIST */}
      {/* ================================================================ */}

      <div className="mb-8 space-y-4">

        {comments.length === 0 ? (
          <div className="py-2">
            <p className="text-sm italic text-gray-400">
              Belum ada komentar. Jadilah yang pertama!
            </p>
          </div>
        ) : (
          comments.map(
            (comment) => (
              <article
                key={comment.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-4">

                  <div className="flex items-center gap-2">

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#087F8C]/10 text-xs font-bold text-[#087F8C]">
                      {comment.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#087F8C]">
                        {comment.name}
                      </p>

                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        Pengguna Google
                      </p>
                    </div>
                  </div>

                  <time className="shrink-0 text-[11px] text-gray-400">
                    {formatDate(
                      comment.created_at
                    )}
                  </time>
                </div>

                <p className="whitespace-pre-line break-words text-[14.5px] leading-relaxed text-gray-700">
                  {comment.message}
                </p>
              </article>
            )
          )
        )}

      </div>

      {/* ================================================================ */}
      {/* AUTH LOADING */}
      {/* ================================================================ */}

      {authLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white py-8 text-center text-xs text-gray-400">
          Memeriksa sesi pengguna...
        </div>
      ) : !user ? (

        // ====================================================================
        // BELUM LOGIN
        // ====================================================================

        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">

          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            Tinggalkan Tanggapan
          </h4>

          <p className="mx-auto max-w-md text-xs leading-relaxed text-gray-500">
            Silakan masuk menggunakan akun Google untuk
            memberikan komentar pada artikel ini.
          </p>

          {msg && (
            <p
              className={`text-xs font-semibold ${
                msgType === 'error'
                  ? 'text-red-600'
                  : 'text-[#087F8C]'
              }`}
            >
              {msg}
            </p>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mx-auto inline-flex items-center gap-3 rounded-xl border border-gray-300 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M21.35 12.19c0-.74-.07-1.45-.19-2.14H12v4.05h5.24a4.48 4.48 0 0 1-1.94 2.94v2.62h3.14c1.84-1.69 2.91-4.18 2.91-7.47Z"
              />

              <path
                fill="#34A853"
                d="M12 21.7c2.62 0 4.82-.87 6.43-2.04l-3.14-2.62c-.87.58-1.98.92-3.29.92-2.53 0-4.67-1.71-5.44-4.01H3.31v2.7A9.7 9.7 0 0 0 12 21.7Z"
              />

              <path
                fill="#FBBC05"
                d="M6.56 13.95A5.82 5.82 0 0 1 6.26 12c0-.68.12-1.34.3-1.95v-2.7H3.31A9.7 9.7 0 0 0 2.3 12c0 1.56.37 3.04 1.01 4.65l3.25-2.7Z"
              />

              <path
                fill="#EA4335"
                d="M12 6.04c1.43 0 2.7.49 3.71 1.45l2.78-2.78A9.33 9.33 0 0 0 12 2.3a9.7 9.7 0 0 0-8.69 5.05l3.25 2.7C7.33 7.75 9.47 6.04 12 6.04Z"
              />
            </svg>

            <span>
              Masuk dengan Google
            </span>
          </button>
        </div>
      ) : (

        // ====================================================================
        // SUDAH LOGIN
        // ====================================================================

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
            Tinggalkan Tanggapan
          </h4>

          {msg && (
            <div
              className={`rounded-lg px-4 py-3 text-xs font-semibold ${
                msgType === 'success'
                  ? 'border border-green-200 bg-green-50 text-green-700'
                  : msgType === 'error'
                  ? 'border border-red-200 bg-red-50 text-red-700'
                  : 'border border-[#087F8C]/20 bg-[#087F8C]/5 text-[#087F8C]'
              }`}
            >
              {msg}
            </div>
          )}

          <div>
            <textarea
              placeholder="Tulis opini, apresiasi, atau pertanyaan Anda mengenai artikel ini..."
              rows={5}
              maxLength={3000}
              value={komentar}
              onChange={(event) =>
                setKomentar(
                  event.target.value
                )
              }
              disabled={loading}
              required
              className="
                w-full
                resize-y
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                p-4
                text-sm
                font-medium
                leading-relaxed
                text-gray-800
                outline-none
                transition

                placeholder:text-gray-400

                focus:border-[#087F8C]
                focus:ring-2
                focus:ring-[#087F8C]/10

                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            />

            <div className="mt-1 text-right text-[11px] text-gray-400">
              {komentar.length}/3000
            </div>
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              komentar.trim().length < 2
            }
            className="
              rounded-xl
              bg-[#F15A24]
              px-6
              py-3
              text-xs
              font-bold
              uppercase
              tracking-wider
              text-white
              transition

              hover:bg-[#d94b18]

              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loading
              ? 'Mengirim...'
              : 'Kirim Komentar'}
          </button>
        </form>
      )}
    </section>
  );
}