// Menyesuaikan langsung dengan nama variabel di screenshot Vercel Anda
const BLOG_ID = process.env.BLOGGER_BLOG_ID || process.env.BLOG_ID || "";
const API_KEY = process.env.BLOGGER_API_KEY || process.env.NEXT_PUBLIC_BLOGGER_API_KEY || ""; 

export async function getPosts() {
  // Jika key murni kosong, berikan log di runtime server Vercel
  if (!BLOG_ID || !API_KEY) {
    console.error("CRITICAL ERROR: BLOGGER_BLOG_ID atau BLOGGER_API_KEY tidak terbaca oleh Vercel!");
    return [];
  }

  const url = `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts?key=${API_KEY}&maxResults=50&fetchImages=true`;

  try {
    const res = await fetch(url, {
      cache: 'no-store', // Pastikan tidak mengunci cache kosong saat runtime
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Google API Error Status: ${res.status}. Response: ${errText}`);
      return [];
    }

    const data = await res.json();

    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((post: any) => {
      let imagesArray = [];
      if (post.images && post.images.length > 0) {
        imagesArray = post.images;
      } else {
        const match = post.content?.match(/<img[^>]+src="([^">]+)"/);
        if (match && match[1]) {
          imagesArray = [{ url: match[1] }];
        }
      }

      return {
        id: post.id,
        title: post.title,
        url: post.url,
        published: post.published,
        labels: post.labels || [],
        images: imagesArray,
        content: post.content || ''
      };
    });

  } catch (error) {
    console.error("Exception caught pada server-side fetching:", error);
    return [];
  }
}

export async function getPostByPath(path: string) {
  const posts = await getPosts();
  const foundPost = posts.find((post: any) => {
    try {
      const postPath = new URL(post.url).pathname;
      return postPath.replace(/^\/|\/$/g, '') === path.replace(/^\/|\/$/g, '');
    } catch (e) {
      return false;
    }
  });
  return foundPost || null;
}

// 3. FUNGSI BARU: Mengambil semua Halaman Statis (Pages) dari Blogger
export async function getPages() {
  if (!BLOG_ID || !API_KEY) return [];

  // Perhatikan endpoint menggunakan /pages, bukan /posts
  const url = `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/pages?key=${API_KEY}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache selama 1 jam
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) return [];

    return data.items.map((page: any) => ({
      id: page.id,
      title: page.title,
      url: page.url, // Contoh: https://www.guruonline.web.id/p/disclaimer.html
      published: page.published,
      content: page.content || ''
    }));
  } catch (error) {
    console.error("Gagal mengambil data Halaman Blogger:", error);
    return [];
  }
}

// 4. FUNGSI BARU: Mencari satu halaman spesifik berdasarkan Path (Misal: /p/disclaimer.html)
export async function getPageByPath(path: string) {
  const pages = await getPages();
  
  const foundPage = pages.find((page: any) => {
    try {
      const pagePath = new URL(page.url).pathname; // Mengambil /p/disclaimer.html
      return pagePath.replace(/^\/|\/$/g, '') === path.replace(/^\/|\/$/g, '');
    } catch (e) {
      return false;
    }
  });

  return foundPage || null;
}