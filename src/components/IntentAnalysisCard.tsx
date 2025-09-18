import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Brain, Info, Navigation, ShoppingCart, CreditCard, MapPin } from "lucide-react";

interface IntentData {
  type: "informational" | "navigational" | "commercial" | "transactional" | "local";
  confidence: number;
  keywords: string[];
  description: string;
}

interface IntentAnalysisCardProps {
  intents: IntentData[];
  isLoading?: boolean;
}

const intentConfig = {
  informational: {
    icon: Info,
    label: "Informational",
    color: "intent-info",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800"
  },
  navigational: {
    icon: Navigation,
    label: "Navigational", 
    color: "intent-nav",
    bgColor: "bg-teal-50 dark:bg-teal-950/20",
    borderColor: "border-teal-200 dark:border-teal-800"
  },
  commercial: {
    icon: ShoppingCart,
    label: "Commercial",
    color: "intent-commercial", 
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800"
  },
  transactional: {
    icon: CreditCard,
    label: "Transactional",
    color: "intent-transactional",
    bgColor: "bg-purple-50 dark:bg-purple-950/20", 
    borderColor: "border-purple-200 dark:border-purple-800"
  },
  local: {
    icon: MapPin,
    label: "Local",
    color: "intent-local",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800"
  }
};

export function IntentAnalysisCard({ intents, isLoading = false }: IntentAnalysisCardProps) {
  if (isLoading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Search Intent Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-4 bg-muted rounded w-12"></div>
                </div>
                <div className="h-2 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft hover:shadow-medium transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Search Intent Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {intents.map((intent, index) => {
            const config = intentConfig[intent.type];
            const IconComponent = config.icon;
            
            return (
              <div 
                key={intent.type}
                className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all hover:shadow-sm`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {intent.confidence}%
                  </Badge>
                </div>
                
                <Progress 
                  value={intent.confidence} 
                  className="mb-3 h-2"
                />
                
                <p className="text-sm text-muted-foreground mb-2">
                  {intent.description}
                </p>
                
                <div className="flex flex-wrap gap-1">
                  {intent.keywords.map((keyword, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-xs"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}