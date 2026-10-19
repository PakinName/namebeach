import { Fragment } from 'react';
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => part.startsWith('**') ? <strong key={index}>{part.slice(2,-2)}</strong> : part.startsWith('`') ? <code key={index}>{part.slice(1,-1)}</code> : <Fragment key={index}>{part}</Fragment>);
}
/** A deliberately small Markdown subset. Raw HTML is always rendered as text. */
export default function LessonArticle({ content }: { content: string }) {
  const blocks = content.split(/```/);
  return <div className="lesson-article">{blocks.map((block, index) => index % 2 ? <pre key={index}><code>{block.replace(/^\w*\n/, '')}</code></pre> : <div key={index}>{block.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <h4 key={i}>{inline(line.slice(4))}</h4>;
    if (line.startsWith('## ')) return <h3 key={i}>{inline(line.slice(3))}</h3>;
    if (line.startsWith('# ')) return <h2 key={i}>{inline(line.slice(2))}</h2>;
    if (/^[-*] /.test(line)) return <ul key={i}><li>{inline(line.slice(2))}</li></ul>;
    if (line.startsWith('> ')) return <blockquote key={i}>{inline(line.slice(2))}</blockquote>;
    return line ? <p key={i}>{inline(line)}</p> : <div className="article-break" key={i} />;
  })}</div>)}</div>;
}
