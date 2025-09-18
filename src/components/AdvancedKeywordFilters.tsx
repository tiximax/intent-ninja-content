import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X, Search } from "lucide-react";

interface FilterProps {
  onApplyFilters: (filters: KeywordFilters) => void;
  onClearFilters: () => void;
}

export interface KeywordFilters {
  minVolume: number;
  maxVolume: number;
  competition: string[];
  cpcRange: [number, number];
  difficulty: [number, number];
  intent: string[];
  location: string;
  language: string;
  includeQuestions: boolean;
  includeLocalKeywords: boolean;
  excludeWords: string[];
}

export function AdvancedKeywordFilters({ onApplyFilters, onClearFilters }: FilterProps) {
  const [filters, setFilters] = useState<KeywordFilters>({
    minVolume: 100,
    maxVolume: 100000,
    competition: [],
    cpcRange: [0, 10],
    difficulty: [0, 100],
    intent: [],
    location: "VN",
    language: "vi",
    includeQuestions: false,
    includeLocalKeywords: false,
    excludeWords: []
  });

  const [excludeWordsInput, setExcludeWordsInput] = useState("");

  const handleCompetitionChange = (competition: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      competition: checked 
        ? [...prev.competition, competition]
        : prev.competition.filter(c => c !== competition)
    }));
  };

  const handleIntentChange = (intent: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      intent: checked 
        ? [...prev.intent, intent]
        : prev.intent.filter(i => i !== intent)
    }));
  };

  const addExcludeWord = () => {
    if (excludeWordsInput.trim()) {
      setFilters(prev => ({
        ...prev,
        excludeWords: [...prev.excludeWords, excludeWordsInput.trim()]
      }));
      setExcludeWordsInput("");
    }
  };

  const removeExcludeWord = (word: string) => {
    setFilters(prev => ({
      ...prev,
      excludeWords: prev.excludeWords.filter(w => w !== word)
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const handleClear = () => {
    setFilters({
      minVolume: 100,
      maxVolume: 100000,
      competition: [],
      cpcRange: [0, 10],
      difficulty: [0, 100],
      intent: [],
      location: "VN",
      language: "vi",
      includeQuestions: false,
      includeLocalKeywords: false,
      excludeWords: []
    });
    setExcludeWordsInput("");
    onClearFilters();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Advanced Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Volume */}
        <div className="space-y-2">
          <Label>Search Volume Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min volume"
              value={filters.minVolume}
              onChange={(e) => setFilters(prev => ({ ...prev, minVolume: Number(e.target.value) }))}
            />
            <Input
              type="number"
              placeholder="Max volume"
              value={filters.maxVolume}
              onChange={(e) => setFilters(prev => ({ ...prev, maxVolume: Number(e.target.value) }))}
            />
          </div>
        </div>

        {/* Competition Level */}
        <div className="space-y-2">
          <Label>Competition Level</Label>
          <div className="flex gap-4">
            {['low', 'medium', 'high'].map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={`comp-${level}`}
                  checked={filters.competition.includes(level)}
                  onCheckedChange={(checked) => handleCompetitionChange(level, checked as boolean)}
                />
                <Label htmlFor={`comp-${level}`} className="capitalize">{level}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* CPC Range */}
        <div className="space-y-2">
          <Label>CPC Range: ${filters.cpcRange[0]} - ${filters.cpcRange[1]}</Label>
          <Slider
            value={filters.cpcRange}
            onValueChange={(value) => setFilters(prev => ({ ...prev, cpcRange: value as [number, number] }))}
            max={20}
            min={0}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Difficulty Range */}
        <div className="space-y-2">
          <Label>Keyword Difficulty: {filters.difficulty[0]} - {filters.difficulty[1]}</Label>
          <Slider
            value={filters.difficulty}
            onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty: value as [number, number] }))}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
        </div>

        {/* Search Intent */}
        <div className="space-y-2">
          <Label>Search Intent</Label>
          <div className="grid grid-cols-2 gap-2">
            {['informational', 'commercial', 'transactional', 'navigational'].map((intent) => (
              <div key={intent} className="flex items-center space-x-2">
                <Checkbox
                  id={`intent-${intent}`}
                  checked={filters.intent.includes(intent)}
                  onCheckedChange={(checked) => handleIntentChange(intent, checked as boolean)}
                />
                <Label htmlFor={`intent-${intent}`} className="capitalize">{intent}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Location & Language */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Location</Label>
            <Select value={filters.location} onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VN">Vietnam</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="UK">United Kingdom</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={filters.language} onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">Vietnamese</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-2">
          <Label>Additional Options</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-questions"
                checked={filters.includeQuestions}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeQuestions: checked as boolean }))}
              />
              <Label htmlFor="include-questions">Include question keywords</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-local"
                checked={filters.includeLocalKeywords}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeLocalKeywords: checked as boolean }))}
              />
              <Label htmlFor="include-local">Include local keywords</Label>
            </div>
          </div>
        </div>

        {/* Exclude Words */}
        <div className="space-y-2">
          <Label>Exclude Words</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add word to exclude..."
              value={excludeWordsInput}
              onChange={(e) => setExcludeWordsInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addExcludeWord()}
            />
            <Button size="sm" onClick={addExcludeWord}>
              Add
            </Button>
          </div>
          {filters.excludeWords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filters.excludeWords.map((word, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {word}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => removeExcludeWord(word)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleApply} className="flex-1">
            <Search className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
          <Button variant="outline" onClick={handleClear}>
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}