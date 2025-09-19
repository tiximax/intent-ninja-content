import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Code, Copy, Edit } from "lucide-react";

interface ContentPreviewProps {
  content: string;
  title: string;
  keywords: string[];
  isEditable?: boolean;
  onContentChange?: (content: string) => void;
  contentFormat?: 'auto' | 'markdown' | 'html';
}

export function ContentPreview({ 
  content, 
  title, 
  keywords, 
  isEditable = false, 
  onContentChange,
  contentFormat = 'auto'
}: ContentPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Đã sao chép",
        description: "Nội dung đã được sao chép vào clipboard.",
      });
    } catch (err) {
      toast({
        title: "Lỗi sao chép",
        description: "Không thể sao chép nội dung.",
        variant: "destructive",
      });
    }
  };

  const handleSaveEdit = () => {
    if (onContentChange) {
      onContentChange(editContent);
    }
    setIsEditing(false);
    toast({
      title: "Đã lưu thay đổi",
      description: "Nội dung đã được cập nhật thành công.",
    });
  };

  const renderMarkdownAsHtml = (markdown: string) => {
    return markdown
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold mb-4 mt-6">{line.replace('# ', '')}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold mb-3 mt-5">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-medium mb-2 mt-4">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="ml-4 mb-1">{line.replace('- ', '')}</li>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="mb-3 leading-relaxed">{line}</p>;
      });
  };

  const isLikelyHtml = (txt: string) => /<\s*(h1|h2|h3|p|ul|ol|li|table|section|div|span|article)\b/i.test(txt);

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).length;
  };

  const getReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = getWordCount(text);
    return Math.ceil(words / wordsPerMinute);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {title || "Xem trước nội dung"}
          </CardTitle>
          <div className="flex gap-2">
            {isEditable && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4" />
                Chỉnh sửa
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
            >
              <Copy className="w-4 h-4" />
              Sao chép
            </Button>
          </div>
        </div>
        
        {content && (
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">
              {getWordCount(content)} từ
            </Badge>
            <Badge variant="secondary">
              {getReadingTime(content)} phút đọc
            </Badge>
            {keywords.length > 0 && (
              <Badge variant="secondary">
                {keywords.length} từ khóa
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {!content ? (
          <div className="text-center py-12 text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có nội dung để hiển thị</p>
            <p className="text-sm">Tạo nội dung để xem preview tại đây</p>
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-96 p-3 border rounded-md resize-none text-sm"
              placeholder="Chỉnh sửa nội dung..."
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} size="sm">
                Lưu thay đổi
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(content);
                }}
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="markdown" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Markdown
              </TabsTrigger>
            </TabsList>
            
          <TabsContent value="preview" className="mt-4">
              <div className="prose prose-sm max-w-none bg-background p-4 rounded-lg border min-h-96 overflow-y-auto">
                {(contentFormat === 'html' || (contentFormat === 'auto' && isLikelyHtml(content))) ? (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                  renderMarkdownAsHtml(content)
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="markdown" className="mt-4">
              <div className="bg-muted p-4 rounded-lg border min-h-96 overflow-y-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {content}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}