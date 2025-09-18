import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Code, Globe } from "lucide-react";

interface ContentExporterProps {
  content: string;
  title: string;
  format?: 'markdown' | 'html' | 'txt' | 'json';
}

export function ContentExporter({ content, title, format = 'markdown' }: ContentExporterProps) {
  const [exportFormat, setExportFormat] = useState(format);
  const { toast } = useToast();

  const formatContent = (content: string, format: string): string => {
    switch (format) {
      case 'html':
        return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${content.substring(0, 160)}">
</head>
<body>
    <article>
        <h1>${title}</h1>
        ${content.split('\n').map(line => {
          if (line.startsWith('# ')) return `<h1>${line.replace('# ', '')}</h1>`;
          if (line.startsWith('## ')) return `<h2>${line.replace('## ', '')}</h2>`;
          if (line.startsWith('### ')) return `<h3>${line.replace('### ', '')}</h3>`;
          if (line.trim() === '') return '<br>';
          return `<p>${line}</p>`;
        }).join('\n')}
    </article>
</body>
</html>`;
      
      case 'txt':
        return `${title}\n${'='.repeat(title.length)}\n\n${content}`;
      
      case 'json':
        return JSON.stringify({
          title,
          content,
          wordCount: content.split(' ').length,
          exportedAt: new Date().toISOString(),
          format: 'json'
        }, null, 2);
      
      default: // markdown
        return `# ${title}\n\n${content}`;
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (!content.trim()) {
      toast({
        title: "Không có nội dung",
        description: "Vui lòng tạo nội dung trước khi xuất file.",
        variant: "destructive",
      });
      return;
    }

    const formattedContent = formatContent(content, exportFormat);
    const timestamp = new Date().toISOString().slice(0, 10);
    const safeTitleForFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const extensions = {
      markdown: 'md',
      html: 'html',
      txt: 'txt',
      json: 'json'
    };

    const mimeTypes = {
      markdown: 'text/markdown',
      html: 'text/html',
      txt: 'text/plain',
      json: 'application/json'
    };

    const filename = `${safeTitleForFilename}_${timestamp}.${extensions[exportFormat as keyof typeof extensions]}`;
    const mimeType = mimeTypes[exportFormat as keyof typeof mimeTypes];

    downloadFile(formattedContent, filename, mimeType);

    toast({
      title: "Xuất file thành công",
      description: `Đã tải xuống: ${filename}`,
    });
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'html':
        return <Code className="w-4 h-4" />;
      case 'txt':
        return <FileText className="w-4 h-4" />;
      case 'json':
        return <Globe className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Xuất Nội dung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Chọn định dạng:</label>
          <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as typeof exportFormat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markdown">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Markdown (.md)
                </div>
              </SelectItem>
              <SelectItem value="html">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  HTML (.html)
                </div>
              </SelectItem>
              <SelectItem value="txt">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Text (.txt)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  JSON (.json)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {getFormatIcon(exportFormat)}
            <span className="text-sm font-medium">Preview:</span>
          </div>
          <div className="text-xs text-muted-foreground font-mono bg-background p-2 rounded border max-h-32 overflow-y-auto">
            {formatContent(content.substring(0, 200) + "...", exportFormat).substring(0, 300)}...
          </div>
        </div>

        <Button onClick={handleExport} className="w-full" variant="default">
          <Download className="w-4 h-4" />
          Tải xuống {exportFormat.toUpperCase()}
        </Button>
      </CardContent>
    </Card>
  );
}