'use client';
import { useState } from 'react';
import { BrainCircuit, Sparkles } from 'lucide-react';
import { categorizeReasonAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent } from '../ui/card';

export function AiCategorizerDialog() {
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<{ categorizedReason: string; explanation?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategorize = async () => {
    if (!reason.trim()) {
      setError('Please enter a reason to categorize.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    const response = await categorizeReasonAction(reason);
    if (response.success) {
      setResult(response.data!);
    } else {
      setError(response.message || 'An unknown error occurred.');
    }
    setIsLoading(false);
  };

  return (
    <Dialog onOpenChange={() => { setReason(''); setResult(null); setError(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BrainCircuit className="mr-2 h-4 w-4" />
          AI Reason Categorizer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI Reason Categorization Tool</DialogTitle>
          <DialogDescription>
            Enter a free-text visit reason to see its standardized category.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="e.g., 'Came to work on my thesis with a friend'"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button onClick={handleCategorize} disabled={isLoading} className="w-full">
            {isLoading ? 'Categorizing...' : 'Categorize'}
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {isLoading && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          )}
          {result && (
            <Card className="bg-secondary/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Suggested Category:</p>
                <Badge variant="default" className="text-base">{result.categorizedReason}</Badge>
                {result.explanation && (
                    <p className="text-xs text-muted-foreground mt-2 italic">"{result.explanation}"</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
