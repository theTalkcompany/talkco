import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { getAllQuotes, addQuote, deleteQuote, type Quote } from "@/data/quotes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

const AdminQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [newText, setNewText] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    setLoading(true);
    const fetchedQuotes = await getAllQuotes();
    setQuotes(fetchedQuotes);
    setLoading(false);
  };

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !newAuthor.trim()) {
      toast({ title: "Error", description: "Please fill in both quote and author fields." });
      return;
    }

    setSubmitting(true);
    const success = await addQuote(newText.trim(), newAuthor.trim());
    
    if (success) {
      toast({ title: "Success", description: "Quote added successfully!" });
      setNewText("");
      setNewAuthor("");
      await loadQuotes();
    } else {
      toast({ title: "Error", description: "Failed to add quote. Please try again." });
    }
    setSubmitting(false);
  };

  const handleDeleteQuote = async (quote: Quote) => {
    if (!confirm(`Are you sure you want to delete this quote by ${quote.author}?`)) {
      return;
    }

    const success = await deleteQuote(quote.text);
    if (success) {
      toast({ title: "Success", description: "Quote deleted successfully!" });
      await loadQuotes();
    } else {
      toast({ title: "Error", description: "Failed to delete quote. Please try again." });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Quote
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddQuote} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quote Text</label>
              <Textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter the inspirational quote..."
                rows={3}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Author</label>
              <Input
                type="text"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="Enter the author's name..."
                disabled={submitting}
              />
            </div>
            <Button type="submit" disabled={submitting || !newText.trim() || !newAuthor.trim()}>
              {submitting ? "Adding..." : "Add Quote"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Quotes ({quotes.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading quotes...</p>
          ) : quotes.length === 0 ? (
            <p className="text-muted-foreground">No quotes found. Add your first quote above!</p>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote, index) => (
                <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <blockquote className="text-lg mb-2">"{quote.text}"</blockquote>
                    <cite className="text-sm text-muted-foreground">— {quote.author}</cite>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteQuote(quote)}
                    className="ml-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQuotes;