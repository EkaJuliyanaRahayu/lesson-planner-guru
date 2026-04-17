import { Check } from "lucide-react";
import { STAGES, STAGE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStage: number;
  completedStages: string[];
}

export default function StepIndicator({ currentStage, completedStages }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STAGES.map((stage, i) => {
        const isCompleted = completedStages.includes(stage);
        const isActive = i === currentStage;
        return (
          <div key={stage} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                  isCompleted && "bg-step-completed text-primary-foreground",
                  isActive && !isCompleted && "bg-step-active text-primary-foreground",
                  !isActive && !isCompleted && "bg-step-pending text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : i + 1}
              </div>
              <span className={cn("text-xs mt-1 font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                {STAGE_LABELS[stage].title.split("(")[1]?.replace(")", "") || stage.toUpperCase()}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={cn("w-12 h-0.5 mx-1 mt-[-16px]", isCompleted ? "bg-step-completed" : "bg-step-pending")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
