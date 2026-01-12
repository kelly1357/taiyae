import { useState, useEffect } from 'react';

export function useWikiContent(slug: string) {
  const [dbContent, setDbContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/wiki/${slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.Content) {
            setDbContent(data.Content);
          }
        }
      } catch (error) {
        console.error('Error fetching wiki content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [slug]);

  return { dbContent, loading };
}
