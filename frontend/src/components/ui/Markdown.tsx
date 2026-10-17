import ReactMarkdown from "react-markdown";
import { Link } from "react-router";

import { useI18n } from "@/i18n/context";
import { cn } from "@/utils/cn";

export function Markdown({ children, className }: { children: string; className?: string }) {
  const { path } = useI18n();
  return (
    <div className={cn("prose-travel", className)}>
      <ReactMarkdown
        skipHtml
        components={{
          a: ({ href = "", children: content }) =>
            href.startsWith("/") ? (
              <Link to={path(href)}>{content}</Link>
            ) : (
              <a href={href} target="_blank" rel="noreferrer noopener">
                {content}
              </a>
            ),
          h1: ({ children: content }) => <h2>{content}</h2>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function Paragraphs({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n{2,}/).filter(Boolean);
  return (
    <div className={cn("space-y-4", className)}>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
