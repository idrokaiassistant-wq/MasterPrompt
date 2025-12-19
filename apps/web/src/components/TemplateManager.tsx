'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePromptStore } from '@/store/promptStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRouter, useParams } from 'next/navigation';

type Template = {
  id: string;
  title: string;
  prompt: string;
};

export function TemplateManager() {
  const t = useTranslations('templatesPage');
  const tCommon = useTranslations('common');
  const { templates, addTemplate, updateTemplate, deleteTemplate, setInput } = usePromptStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale || 'uz';

  const handleUseTemplate = (prompt: string) => {
    setInput(prompt);
    router.push(`/${locale}`);
  };


  const handleOpenDialog = (template: Template | null = null) => {
    setCurrentTemplate(template);
    if (template) {
      setTitle(template.title);
      setPrompt(template.prompt);
    } else {
      setTitle('');
      setPrompt('');
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!title || !prompt) {
      // Maybe show a toast notification here
      return;
    }
    if (currentTemplate) {
      updateTemplate(currentTemplate.id, { title, prompt });
    } else {
      addTemplate({ title, prompt });
    }
    setIsDialogOpen(false);
  };

  return (
    <div>
        <div className='flex justify-between items-center mb-4'>
            <h2 className="text-xl font-bold">{t('yourTemplates')}</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="h-4 w-4 mr-2" />
                {t('addTemplate')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>
                    {currentTemplate ? t('editTemplate') : t('addTemplate')}
                </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">{t('templateTitle')}</Label>
                    <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('templateTitlePlaceholder')}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="prompt">{t('templatePrompt')}</Label>
                    <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('templatePromptPlaceholder')}
                    rows={6}
                    />
                </div>
                </div>
                <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">{tCommon('cancel')}</Button>
                </DialogClose>
                <Button onClick={handleSave}>{tCommon('save')}</Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        </div>

      {templates.length === 0 ? (
        <p className="text-muted-foreground">{t('noUserTemplates')}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{template.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {template.prompt.substring(0, 100)}{template.prompt.length > 100 && '...'}
                </p>
                <div className="flex justify-between items-center mt-auto">
                  <Button onClick={() => handleUseTemplate(template.prompt)}>
                    {t('use')}
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTemplate(template.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
