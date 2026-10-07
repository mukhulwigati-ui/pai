import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export type AuthUser = {
  id: number;
  identity_number: string;
  fullname: string;
  role: string;
};

type AuthResult =
  | {
      authorized: true;
      user: AuthUser;
      status: 200;
      message: string;
    }
  | {
      authorized: false;
      user: AuthUser | null;
      status: 401 | 403;
      message: string;
    };

function normalizeRole(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

/**
 * Mengambil identitas dari token login yang terverifikasi.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('JWT_SECRET belum tersedia.');
    return null;
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, secret);

    if (typeof decoded === 'string') {
      return null;
    }

    if (
      typeof decoded.id !== 'number' &&
      typeof decoded.id !== 'string'
    ) {
      return null;
    }

    const id = Number(decoded.id);
    const role = normalizeRole(decoded.role);

    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      !role
    ) {
      return null;
    }

    return {
      id,
      identity_number: String(
        decoded.identity_number ?? ''
      ).trim(),
      fullname: String(decoded.fullname ?? '').trim(),
      role,
    };
  } catch {
    return null;
  }
}

/**
 * Memastikan pengguna sudah login.
 */
export async function requireAuth(): Promise<AuthResult> {
  const user = await getAuthUser();

  if (!user) {
    return {
      authorized: false,
      user: null,
      status: 401,
      message: 'Anda belum login atau sesi telah berakhir.',
    };
  }

  return {
    authorized: true,
    user,
    status: 200,
    message: 'Authorized',
  };
}

/**
 * Memastikan pengguna memiliki salah satu peran yang diizinkan.
 */
export async function requireRoles(
  allowedRoles: readonly string[],
  deniedMessage = 'Akses ditolak. Anda tidak memiliki izin.'
): Promise<AuthResult> {
  const auth = await requireAuth();

  if (!auth.authorized) {
    return auth;
  }

  const roles = allowedRoles.map(normalizeRole);

  if (!roles.includes(auth.user.role)) {
    return {
      authorized: false,
      user: auth.user,
      status: 403,
      message: deniedMessage,
    };
  }

  return auth;
}

/**
 * Khusus administrator.
 */
export async function requireAdmin(): Promise<AuthResult> {
  return requireRoles(
    ['ADMIN'],
    'Akses ditolak. Fitur ini hanya dapat diakses oleh Administrator.'
  );
}

/**
 * Administrator dan guru PAI.
 *
 * Mendukung penamaan role GURU_PAI atau PAI_TEACHER.
 */
export async function requirePaiTeacher(): Promise<AuthResult> {
  return requireRoles(
    ['ADMIN', 'GURU_PAI', 'PAI_TEACHER'],
    'Akses ditolak. Fitur ini hanya dapat diakses oleh Administrator atau Guru PAI.'
  );
}