import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, type Blog } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import DOMPurify from "dompurify";
import SEO from "@/components/SEO";
import { buildBlogPostSeo } from "@/lib/seo";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.get<Blog>(`/blogs/${slug}`).then((data) => {
      setBlog(data);
      setLoading(false);
      api.post(`/blogs/${data.id}/view`).catch(() => {});
    }).catch(() => {
      setBlog(null);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Blog Not Found</h1>
            <Link to="/blog" className="text-primary underline">Back to Blog</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO {...buildBlogPostSeo({
        title: blog.title,
        description: blog.meta_description,
        slug: blog.slug,
        featuredImage: blog.featured_image,
      })} />
      <Navbar />
      <main className="flex-1">
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          <Link to="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          {blog.featured_image && (
            <img src={blog.featured_image} alt={blog.title} className="w-full max-h-[400px] object-cover rounded-xl mb-6" />
          )}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{blog.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1"><User className="h-4 w-4" />{blog.author}</span>
            {blog.publish_date && (
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(blog.publish_date).toLocaleDateString()}</span>
            )}
            <span className="flex items-center gap-1"><Tag className="h-4 w-4" />{blog.category}</span>
          </div>
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {blog.tags.map((tag) => (
                <span key={tag} className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}
          <div
            className="prose prose-lg max-w-none prose-headings:text-foreground prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-img:rounded-xl prose-img:shadow-card"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content) }}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
}
