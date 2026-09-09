import React from "react";
import {
  Target,
  Flame,
  Zap,
  Rocket,
  Diamond,
  Crown,
  Sparkles,
  Award,
  Star,
  Trophy,
  Compass,
  Shield,
  Gift,
  HelpCircle,
} from "lucide-react";

const ICON_MAP = {
  target: Target,
  flame: Flame,
  zap: Zap,
  rocket: Rocket,
  diamond: Diamond,
  crown: Crown,
  sparkles: Sparkles,
  award: Award,
  star: Star,
  trophy: Trophy,
  compass: Compass,
  shield: Shield,
  gift: Gift,
  // Key mappings as fallbacks
  first_habit: Target,
  streak_3: Flame,
  streak_7: Zap,
  streak_14: Rocket,
  streak_30: Diamond,
  streak_60: Crown,
  streak_100: Sparkles,
  perfect_week: Award,
  level_5: Star,
  level_10: Trophy,
  level_20: Compass,
  level_30: Crown,
  streak_freeze_pack: Shield,
  custom_title_focus: Target,
  cyber_dark_theme: Sparkles,
  golden_badge_frame: Crown,
  deep_ai_analysis: Zap,
  titan_title: Award,
};

export default function GamificationIcon({ name, fallbackKey, size = 28, className = "" }) {
  const normalized = (name || "").toLowerCase().trim();
  const IconComponent =
    ICON_MAP[normalized] ||
    (fallbackKey && ICON_MAP[fallbackKey]) ||
    Trophy;

  return <IconComponent size={size} className={className} />;
}