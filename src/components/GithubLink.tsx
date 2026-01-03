import React from 'react';
import { Github } from 'lucide-react';

export const GithubLink: React.FC = () => {
  return (
    <a
      href="https://github.com/winglight/play-texas-cards"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed top-4 left-4 z-50 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all duration-300 shadow-lg group"
      title="View on GitHub"
    >
      <Github className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
    </a>
  );
};
