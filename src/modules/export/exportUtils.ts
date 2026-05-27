import { textToStorage } from '../shared/imageStore'

export function generateMarkdownBlob(content: string): Blob {
  const storageContent = textToStorage(content)
  return new Blob([storageContent], { type: 'text/markdown;charset=utf-8' });
}

export async function generateHtmlBlob(_content: string): Promise<Blob> {
  const previewElement = document.querySelector('.markdown-preview') as HTMLElement;
  if (!previewElement) {
    throw new Error('Preview element not found');
  }

  const styles: string[] = [];
  const styleSheets = document.styleSheets;
  for (let i = 0; i < styleSheets.length; i++) {
    try {
      const rules = styleSheets[i].cssRules;
      for (let j = 0; j < rules.length; j++) {
        styles.push(rules[j].cssText);
      }
    } catch {
      // cross-origin stylesheet, skip
    }
  }

  const theme = document.documentElement.getAttribute('data-theme') || 'light';

  const html = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${theme}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Exported Document</title>
<style>
:root {
  --app-bg: #ffffff;
  --app-text: #1e293b;
  --preview-bg: #ffffff;
  --preview-text: #334155;
  --preview-border: #e2e8f0;
  --link-color: #2563eb;
  --code-bg: #f1f5f9;
  --blockquote-bg: #f8fafc;
  --blockquote-border: #e2e8f0;
  --sidebar-bg: #ffffff;
  --sidebar-border: #e2e8f0;
  --sidebar-text: #64748b;
  --katex-color: #1e293b;
  --katex-background: #f1f5f9;
  --katex-error-color: #dc3545;
}
[data-theme="dark"] {
  --app-bg: #0f172a;
  --app-text: #e2e8f0;
  --preview-bg: #1e293b;
  --preview-text: #cbd5e1;
  --preview-border: #334155;
  --link-color: #60a5fa;
  --code-bg: #0f172a;
  --blockquote-bg: #1e293b;
  --blockquote-border: #334155;
  --sidebar-bg: #1e293b;
  --sidebar-border: #334155;
  --sidebar-text: #94a3b8;
  --katex-color: #e2e8f0;
  --katex-background: #1e293b;
  --katex-error-color: #dc3545;
}
${styles.join('\n')}
</style>
</head>
<body style="background-color: var(--preview-bg); color: var(--preview-text); padding: 2rem; max-width: 800px; margin: 0 auto;">
${previewElement.innerHTML}
</body>
</html>`;

  return new Blob([html], { type: 'text/html;charset=utf-8' });
}

export async function generatePdf(previewElement: HTMLElement, fileName: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html2pdf = (await import('html2pdf.js')).default as any;

  const options = {
    margin: [10, 10, 10, 10],
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
  };

  await html2pdf().from(previewElement).set(options).save();
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function isFileSystemAccessSupported(): boolean {
  return 'showSaveFilePicker' in window;
}

export const FORMAT_EXTENSIONS: Record<string, string> = {
  md: '.md',
  html: '.html',
  pdf: '.pdf',
};

export const FORMAT_MIME_TYPES: Record<string, string> = {
  md: 'text/markdown',
  html: 'text/html',
  pdf: 'application/pdf',
};
