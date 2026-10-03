import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ============================================================================
// CONFIG
// ============================================================================

export const dynamic = 'force-dynamic';

const TABLE_NAME = 'senyum_comments';

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_COMMENT_LENGTH = 3000;
const MAX_SLUG_LENGTH = 500;
const MAX_TITLE_LENGTH = 500;

// ============================================================================
// TYPES
// ============================================================================

type CommentRequestBody = {
  slug?: unknown;
  postId?: unknown;
  postTitle?: unknown;
  nama?: unknown;
  email?: unknown;
  komentar?: unknown;
  parentId?: unknown;
};

// ============================================================================
// HELPERS
// ============================================================================

function cleanString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function isValidEmail(email: string): boolean {
  if (!email) return true;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

// ============================================================================
// GET
// Ambil komentar yang sudah APPROVED berdasarkan slug artikel
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const slug = cleanString(searchParams.get('slug'));

    // =========================================================================
    // VALIDASI
    // =========================================================================

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Slug artikel wajib diberikan.',
        },
        {
          status: 400,
        }
      );
    }

    if (slug.length > MAX_SLUG_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: 'Slug artikel tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================================
    // AMBIL KOMENTAR
    // =========================================================================

    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .select(`
        id,
        post_id,
        post_slug,
        post_title,
        name,
        message,
        status,
        parent_id,
        created_at,
        updated_at
      `)
      .eq('post_slug', slug)
      .eq('status', 'approved')
      .order('created_at', {
        ascending: true,
      });

    if (error) {
      console.error('GET comments Supabase error:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Gagal mengambil komentar.',
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        comments: data ?? [],
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('GET comment API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan pada server.',
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================================
// POST
// Kirim komentar baru
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // =========================================================================
    // PARSE BODY
    // =========================================================================

    let body: CommentRequestBody;

    try {
      body = (await request.json()) as CommentRequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Data komentar tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================================
    // NORMALISASI DATA
    // =========================================================================

    const slug = cleanString(body.slug);

    const postId =
      cleanString(body.postId) ||
      slug;

    const postTitle = cleanString(body.postTitle);

    const name = cleanString(body.nama);

    const email = cleanString(body.email).toLowerCase();

    const message = cleanString(body.komentar);

    const parentId = cleanString(body.parentId) || null;

    // =========================================================================
    // VALIDASI SLUG
    // =========================================================================

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: 'Artikel tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    if (slug.length > MAX_SLUG_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: 'Slug artikel terlalu panjang.',
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================================
    // VALIDASI POST TITLE
    // =========================================================================

    if (postTitle.length > MAX_TITLE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: 'Judul artikel terlalu panjang.',
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================================
    // VALIDASI NAMA
    // =========================================================================

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nama wajib diisi.',
        },
        {
          status: 400,
        }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nama minimal 2 karakter.',
        },
        {
          status: 400,
        }
      );
    }

    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Nama maksimal ${MAX_NAME_LENGTH} karakter.`,
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================================
    // VALIDASI EMAIL
    // =========================================================================

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format email tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email terlalu panjang.',
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================================
    // VALIDASI KOMENTAR
    // =========================================================================

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Komentar wajib diisi.',
        },
        {
          status: 400,
        }
      );
    }

    if (message.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Komentar terlalu pendek.',
        },
        {
          status: 400,
        }
      );
    }

    if (message.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Komentar maksimal ${MAX_COMMENT_LENGTH} karakter.`,
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================================
    // VALIDASI PARENT ID
    // ============================================================================

    if (parentId && !isValidUuid(parentId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ID komentar balasan tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================================
    // JIKA BALASAN, CEK KOMENTAR INDUK
    // =========================================================================

    if (parentId) {
      const {
        data: parentComment,
        error: parentError,
      } = await supabaseAdmin
        .from(TABLE_NAME)
        .select(`
          id,
          post_slug,
          status,
          parent_id
        `)
        .eq('id', parentId)
        .maybeSingle();

      if (parentError) {
        console.error(
          'Parent comment Supabase error:',
          parentError
        );

        return NextResponse.json(
          {
            success: false,
            error: 'Gagal memeriksa komentar yang dibalas.',
          },
          {
            status: 500,
          }
        );
      }

      if (!parentComment) {
        return NextResponse.json(
          {
            success: false,
            error: 'Komentar yang ingin dibalas tidak ditemukan.',
          },
          {
            status: 404,
          }
        );
      }

      if (parentComment.status !== 'approved') {
        return NextResponse.json(
          {
            success: false,
            error: 'Komentar tersebut belum dapat dibalas.',
          },
          {
            status: 400,
          }
        );
      }

      if (parentComment.post_slug !== slug) {
        return NextResponse.json(
          {
            success: false,
            error: 'Komentar induk tidak sesuai dengan artikel.',
          },
          {
            status: 400,
          }
        );
      }

      // Kita batasi hanya 1 tingkat balasan.
      // Reply terhadap reply akan diarahkan ke komentar utama.
      if (parentComment.parent_id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Balasan hanya dapat diberikan pada komentar utama.',
          },
          {
            status: 400,
          }
        );
      }
    }

    // =========================================================================
    // INSERT KE SUPABASE
    // ============================================================================

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(TABLE_NAME)
      .insert([
        {
          post_id: postId,

          post_slug: slug,

          post_title:
            postTitle ||
            null,

          name,

          email:
            email ||
            null,

          message,

          status: 'pending',

          parent_id:
            parentId ||
            null,
        },
      ])
      .select(`
        id,
        post_id,
        post_slug,
        post_title,
        name,
        message,
        status,
        parent_id,
        created_at
      `)
      .single();

    // =========================================================================
    // HANDLE INSERT ERROR
    // =========================================================================

    if (error) {
      console.error(
        'Supabase insert comment error:',
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Komentar gagal disimpan.',
        },
        {
          status: 500,
        }
      );
    }

    // =========================================================================
    // SUCCESS
    // ============================================================================

    return NextResponse.json(
      {
        success: true,

        message:
          'Komentar berhasil dikirim dan akan tampil setelah disetujui admin.',

        comment: data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      'POST comment API error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan pada server.',
      },
      {
        status: 500,
      }
    );
  }
}