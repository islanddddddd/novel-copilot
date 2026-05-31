import JSZip from 'jszip';
import type { Novel, Chapter } from './types';

/**
 * 导出单个章节为文本内容
 */
export function exportChapterContent(chapter: Chapter, includeTitle: boolean = false): string {
  const lines: string[] = [];
  if (includeTitle) {
    lines.push(chapter.title);
    lines.push('');
  }
  chapter.paragraphs.forEach((p) => {
    if (p.userText.trim()) {
      lines.push(p.userText);
    }
  });
  return lines.join('\n');
}

/**
 * 导出整个小说为合并文本
 */
export function exportNovelMerged(novel: Novel): string {
  const sections: string[] = [];
  novel.chapters.forEach((chapter, index) => {
    if (index > 0) sections.push('\n\n');
    sections.push(chapter.title);
    sections.push('');
    chapter.paragraphs.forEach((p) => {
      if (p.userText.trim()) {
        sections.push(p.userText);
      }
    });
  });
  return sections.join('\n');
}

/**
 * 触发浏览器下载
 */
export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 下载 Blob 为文件
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 导出小说（分章或合并）
 */
export async function exportNovel(novel: Novel, mode: 'split' | 'merged', format: 'txt' | 'md'): Promise<void> {
  const ext = format === 'txt' ? '.txt' : '.md';

  if (mode === 'split') {
    // 分章导出：压缩为 zip
    const zip = new JSZip();
    novel.chapters.forEach((chapter, index) => {
      const content = exportChapterContent(chapter, false);
      const filename = `第${index + 1}章 ${chapter.title}${ext}`;
      zip.file(filename, content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${novel.title}.zip`);
  } else {
    // 合并导出：单个文件
    const content = exportNovelMerged(novel);
    const filename = `${novel.title}${ext}`;
    downloadFile(content, filename);
  }
}

/**
 * 读取文件内容
 */
export function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * 解析导入的文件内容为段落数组
 */
export function parseImportContent(content: string): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
