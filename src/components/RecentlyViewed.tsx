import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

interface RecentItem {
  id: string;
  title: string;
  updated_at: string;
  seo_score: number | null;
  snippet?: string;
}

export default function RecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);

  const load = () => {
    try {
      const raw = localStorage.getItem('recent-contents');
      const list: RecentItem[] = raw ? JSON.parse(raw) : [];
      setItems(list);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'recent-contents') load();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  if (items.length === 0) return null;

  return (
    <Card data-testid="recently-viewed-card">
      <CardHeader>
        <CardTitle>Đã xem gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.slice(0, 5).map((it) => (
            <li key={it.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium truncate" title={it.title}>{it.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(it.updated_at).toLocaleDateString('vi-VN')}
                </div>
              </div>
              {typeof it.seo_score === 'number' && (
                <Badge variant="outline" className="text-xs">SEO {it.seo_score}%</Badge>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
