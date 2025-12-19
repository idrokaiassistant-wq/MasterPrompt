'use client';

import { useTranslations } from 'next-intl';
import { TopBar } from '@/components/TopBar';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePromptStore } from '@/store/promptStore';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { TemplateManager } from '@/components/TemplateManager';
import { Separator } from '@/components/ui/separator';

const defaultTemplates = [
  {
    id: 'code',
    titleKey: 'items.code.title',
    descriptionKey: 'items.code.description',
    promptKey: 'items.code.prompt',
  },
  {
    id: 'story',
    titleKey: 'items.story.title',
    descriptionKey: 'items.story.description',
    promptKey: 'items.story.prompt',
  },
  {
    id: 'article',
    titleKey: 'items.article.title',
    descriptionKey: 'items.article.description',
    promptKey: 'items.article.prompt',
  },
  {
    id: 'email',
    titleKey: 'items.email.title',
    descriptionKey: 'items.email.description',
    promptKey: 'items.email.prompt',
  },
  {
    id: 'analysis',
    titleKey: 'items.analysis.title',
    descriptionKey: 'items.analysis.description',
    promptKey: 'items.analysis.prompt',
  },
  {
    id: 'explain',
    titleKey: 'items.explain.title',
    descriptionKey: 'items.explain.description',
    promptKey: 'items.explain.prompt',
  },
];

export default function TemplatesPage() {
  const t = useTranslations('templatesPage');
  const { setInput } = usePromptStore();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale || 'uz';
  const shouldReduceMotion = useReducedMotion();

  const handleUseTemplate = (prompt: string) => {
    setInput(prompt);
    router.push(`/${locale}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="flex-1 md:ml-64 container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground">{t('description')}</p>
            </div>

            <TemplateManager />
            
            <Separator />

            <div>
                <h2 className="text-xl font-bold mb-4">{t('defaultTemplates')}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {defaultTemplates.map((template, index) => (
                    <motion.div
                        key={template.id}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={shouldReduceMotion ? { duration: 0 } : { delay: index * 0.1 }}
                    >
                        <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">{t(template.titleKey as any)}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            <p className="text-sm text-muted-foreground mb-4">
                            {t(template.descriptionKey as any)}
                            </p>
                            <Button
                            onClick={() => handleUseTemplate(t(template.promptKey as any))}
                            className="mt-auto"
                            >
                            {t('use')}
                            </Button>
                        </CardContent>
                        </Card>
                    </motion.div>
                    ))}
                </div>
            </div>
        </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}