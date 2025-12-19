'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function OutputSkeleton() {
  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-lg opacity-10" />
      <Card className="relative border-2 border-blue-500/20 shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-3 w-64" />
            </div>
            <div className="flex gap-2 shrink-0">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

