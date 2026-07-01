import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-5 page-enter">
      <div className="text-7xl">🌿</div>
      <h1 className="text-3xl font-bold">Page Not Found</h1>
      <p className="text-muted-foreground max-w-sm">This page doesn't exist, but Bengaluru's air quality still needs your help!</p>
      <div className="flex gap-3">
        <Link to="/"><Button>🏠 Go Home</Button></Link>
        <Link to="/report"><Button variant="outline">📸 Report Issue</Button></Link>
      </div>
    </div>
  );
}
