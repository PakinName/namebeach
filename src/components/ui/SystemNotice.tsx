'use client';
import { useResource } from '@/hooks/useResource';
export default function SystemNotice() {
  const { data } = useResource<{ announcement: string }>('/api/site');
  return data?.announcement ? <aside className="alert alert-info" style={{whiteSpace:'pre-wrap'}}>{data.announcement}</aside> : null;
}
