import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    onRatingChange?: (rating: number) => void;
    interactive?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export default function StarRating({
    rating,
    maxRating = 7,
    onRatingChange,
    interactive = false,
    size = "md",
    className = "",
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState(0);

    const sizes = {
        sm: "w-3 h-3",
        md: "w-5 h-5",
        lg: "w-8 h-8",
    };

    const handleRatingClick = (newRating: number) => {
        if (interactive && onRatingChange) {
            onRatingChange(newRating);
        }
    };

    const currentRating = interactive ? (hoverRating || rating) : rating;

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {[...Array(maxRating)].map((_, i) => {
                const starValue = i + 1;
                const isFilled = starValue <= currentRating;

                return (
                    <button
                        key={i}
                        type="button"
                        title={`Note: ${starValue} / ${maxRating}`}
                        aria-label={`Noter ${starValue} sur ${maxRating}`}
                        disabled={!interactive}
                        onMouseEnter={() => interactive && setHoverRating(starValue)}
                        onMouseLeave={() => interactive && setHoverRating(0)}
                        onClick={() => handleRatingClick(starValue)}
                        className={`
                            transition-all duration-200 
                            ${interactive ? "hover:scale-125 cursor-pointer" : "cursor-default"}
                            ${isFilled ? "text-amber-400" : "text-slate-300"}
                        `}
                    >
                        <Star
                            className={sizes[size]}
                            fill={isFilled ? "currentColor" : "none"}
                            strokeWidth={2}
                        />
                    </button>
                );
            })}
        </div>
    );
}
