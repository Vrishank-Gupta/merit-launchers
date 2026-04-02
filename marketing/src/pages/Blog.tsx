import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Blog } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import { pageSeo } from "@/lib/seo";

export default function Blog() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Blog[]>("/blogs").then((data) => {
      setBlogs(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO {...pageSeo.blog} />
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-hero py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{pageSeo.blog.h1}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tips, strategies, and insights to help you ace your exams
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">No blog posts yet. Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.map((blog) => (
                  <Card key={blog.id} className="overflow-hidden hover:shadow-premium transition-shadow group">
                    {blog.featured_image && (
                      <div className="overflow-hidden">
                        <img
                          src={blog.featured_image}
                          alt={blog.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{blog.category}</span>
                      <h2 className="text-lg font-bold mt-3 mb-2 line-clamp-2">{blog.title}</h2>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {blog.meta_description || blog.content.replace(/<[^>]*>/g, "").slice(0, 120) + "..."}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{blog.author}</span>
                        {blog.publish_date && (
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(blog.publish_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to={`/blog/${blog.slug}`}>Read More <ArrowRight className="h-4 w-4 ml-1" /></Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
