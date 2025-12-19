'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

export function TipsSection() {
  const t = useTranslations('tips');
  const shouldReduceMotion = useReducedMotion();

  const tips = [
    { key: 'tip1' },
    { key: 'tip2' },
    { key: 'tip3' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-blue-500" />
        {t('title')}
      </h3>
      <div className="grid gap-4 md:grid-cols-3">
        {tips.map((tip, index) => (
          <motion.div
            key={tip.key}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t(tip.key)}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}




