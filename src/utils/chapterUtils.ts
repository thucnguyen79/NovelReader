export function splitIntoChapters(text: string): { title: string; content: string }[] {
  // Try to split by common chapter patterns
  const chapterPatterns = [
    /^(Chương\s+\d+[^\n]*)/gim,
    /^(Chapter\s+\d+[^\n]*)/gim,
    /^(第[一二三四五六七八九十百千\d]+[章回节][^\n]*)/gim,
    /^(CHAPTER\s+\d+[^\n]*)/gim,
    /^(Bài\s+\d+[^\n]*)/gim,
  ];

  for (const pattern of chapterPatterns) {
    const parts = text.split(pattern);
    if (parts.length > 1) {
      const chapters: { title: string; content: string }[] = [];
      
      // parts[0] is preamble (text before the first match).
      if (parts[0].trim()) {
        chapters.push({ title: 'Mở đầu', content: parts[0].trim() });
      }
      
      for (let i = 1; i < parts.length; i += 2) {
        const chTitle = parts[i]?.trim() || `Chương ${chapters.length + 1}`;
        const chContent = parts[i + 1]?.trim() || '';
        
        if (chTitle || chContent) {
          chapters.push({ title: chTitle, content: chContent });
        }
      }
      if (chapters.length > 0) return chapters;
    }
  }

  // No chapter markers found — split by paragraphs into ~3000 char chunks
  if (text.length > 5000) {
    const paragraphs = text.split(/\n\s*\n/);
    const chapters: { title: string; content: string }[] = [];
    let currentContent = '';
    let chapterNum = 1;

    for (const para of paragraphs) {
      if (currentContent.length + para.length > 3000 && currentContent.length > 0) {
        chapters.push({ title: `Phần ${chapterNum}`, content: currentContent.trim() });
        currentContent = '';
        chapterNum++;
      }
      currentContent += (currentContent ? '\n\n' : '') + para;
    }
    if (currentContent.trim()) {
      chapters.push({ title: `Phần ${chapterNum}`, content: currentContent.trim() });
    }
    return chapters;
  }

  // Short text — single chapter
  return [{ title: 'Chương 1', content: text }];
}
