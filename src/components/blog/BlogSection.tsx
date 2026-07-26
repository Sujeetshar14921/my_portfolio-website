import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BlogPost } from "@/types";
import BlogCard from "./BlogCard";
import Pagination from "../Pagination/pagination";
import Loader from "../Loader/loader";

interface BlogSectionProps {
  posts: BlogPost[];
}

const POSTS_PER_PAGE = 3;

export default function BlogSection({ posts }: BlogSectionProps) {
  const [activeTag, setActiveTag] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const allTags = useMemo(
    () => [...new Set(posts.flatMap((p) => p.tags))],
    [posts]
  );

  const filteredPosts = useMemo(() => {
    return activeTag === "all"
      ? posts
      : posts.filter((p) => p.tags.includes(activeTag));
  }, [posts, activeTag]);

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  const currentPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTag]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    document.getElementById("blog")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section
      id="blog"
      className="section-padding bg-white dark:bg-surface-900 transition-colors duration-300"
    >
      <div className="w-full md:px-12 lg:px-20">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
            / Blog
          </span>

          <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">
            Blog &amp; Journal
          </h2>

          <p className="mt-4 text-surface-500 dark:text-surface-400 max-w-xl">
            Thoughts on development, design, and the journey of building
            software.
          </p>
        </motion.div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-3 mb-10 pb-6 border-b border-surface-200 dark:border-white/10">
            <button
              onClick={() => setActiveTag("all")}
              className={`text-xs font-mono uppercase tracking-wider pb-1 border-b-2 transition-colors ${
                activeTag === "all"
                  ? "border-primary-600 dark:border-primary-400 text-surface-900 dark:text-white"
                  : "border-transparent text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
              }`}
            >
              All
            </button>

            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`text-xs font-mono uppercase tracking-wider pb-1 border-b-2 transition-colors ${
                  activeTag === tag
                    ? "border-primary-600 dark:border-primary-400 text-surface-900 dark:text-white"
                    : "border-transparent text-surface-400 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Blog Grid */}
        {currentPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {currentPosts.map((post, index) => (
                <BlogCard
                  key={post.id}
                  post={post}
                  index={(currentPage - 1) * POSTS_PER_PAGE + index}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-14 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center min-h-screen">
            <Loader/>
          </div>
        )}
      </div>
    </section>
  );
}