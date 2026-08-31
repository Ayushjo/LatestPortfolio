'use client';

import { GitHubCalendar } from "react-github-calendar";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Github, ExternalLink } from "lucide-react";

const GitHubCalendarComponent = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const gitHubTheme = {
    light: ['#ebedf0', '#9be9a8', '#40c460', '#30a14e', '#216e39'],
    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  };

  const colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';

  return (
    <section className="w-full py-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <Github className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              GitHub Activity
            </h2>
          </div>
          <a
            href="https://github.com/Ayushjo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            @Ayushjo
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          <div className="overflow-x-auto scrollbar-hide flex justify-center">
            {mounted ? (
              <GitHubCalendar
                key={colorScheme}
                username="Ayushjo"
                blockSize={16}
                blockMargin={4}
                fontSize={14}
                colorScheme={colorScheme}
                theme={gitHubTheme}
                throwOnError={false}
                errorMessage="Unable to load GitHub activity."
                labels={{
                  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                  totalCount: '{{count}} contributions',
                }}
              />
            ) : (
              <div className="flex items-center justify-center py-16 gap-2">
                <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default GitHubCalendarComponent;
