'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { TopBar } from '@/components/TopBar';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { VoiceInput } from '@/components/VoiceInput';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

type Message = {
  role: 'user' | 'model';
  content: string;
};

export default function TeacherPage() {
  const t = useTranslations('teacherPage');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const botMessage: Message = { role: 'model', content: data.output };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      toast.error(tCommon('error'));
      console.error('Teacher API error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="flex-1 md:ml-64 container mx-auto px-4 py-8 pb-24 md:pb-8 h-[calc(100vh-4rem)] flex flex-col">
          <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col gap-4">
            {/* Header */}
            <div className="text-center space-y-2 mb-4">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {t('title')}
              </h1>
              <p className="text-muted-foreground">{t('description')}</p>
            </div>

            {/* Chat Area */}
            <Card className="flex-1 overflow-hidden flex flex-col bg-card/50 backdrop-blur-sm border-muted">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground opacity-50">
                    <Sparkles className="h-16 w-16 mb-4" />
                    <p className="text-lg font-medium">{t('welcome')}</p>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                      {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                          <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-muted/50 dark:bg-muted/30 border border-border rounded-tl-sm'
                          }`}
                      >
                        <div className="prose dark:prose-invert prose-sm max-w-none break-words">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 border border-blue-200 dark:border-blue-800">
                      <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="bg-muted/50 dark:bg-muted/30 border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Yozmoqda...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-background/50 border-t backdrop-blur-sm">
                <div className="flex gap-2 relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('inputPlaceholder')}
                    className="min-h-[50px] max-h-[150px] resize-none pr-24 bg-background"
                    rows={1}
                  />
                  <div className="absolute right-2 bottom-2 flex gap-2">
                    <VoiceInput
                      onListeningChange={setIsVoiceListening}
                      onInput={setInput}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={isLoading || !input.trim() || isVoiceListening}
                      size="icon"
                      className="h-8 w-8"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
