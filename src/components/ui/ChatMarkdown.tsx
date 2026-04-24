// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMarkdownProps {
  content: string;
}

/**
 * Clean markdown content before rendering:
 * - Remove code fences that wrap tables (model sometimes does ```\n| ... |\n```)
 * - Ensure tables have blank lines before/after for proper parsing
 */
function cleanMarkdown(text: string): string {
  // Remove code fences that contain table-like content
  let cleaned = text.replace(/```[\s\S]*?```/g, (match) => {
    const inner = match.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
    // If the code block contains pipe-separated table rows, unwrap it
    if (inner.match(/^\s*\|.*\|/m)) {
      return '\n' + inner.trim() + '\n';
    }
    return match;
  });

  // Ensure tables have blank lines before them for remark-gfm to parse
  cleaned = cleaned.replace(/([^\n])\n(\|[^\n]+\|)\n(\|[\s-:]+\|)/g, '$1\n\n$2\n$3');

  return cleaned;
}

export default function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="chat-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="my-3 max-w-full overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="text-left">{children}</th>
          ),
          td: ({ children }) => (
            <td>{children}</td>
          ),
        }}
      >
        {cleanMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
