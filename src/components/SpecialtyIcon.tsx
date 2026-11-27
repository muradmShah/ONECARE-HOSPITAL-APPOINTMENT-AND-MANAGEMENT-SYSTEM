import {
  HeartPulse,
  Sparkles,
  Brain,
  Bone,
  Baby,
  Flower2,
  Smile,
  Stethoscope,
  Ear,
  Eye,
  Wind,
  Activity,
} from 'lucide-react';
import type { SpecialtyItem } from '../data/peshawarData';

interface SpecialtyIconProps {
  iconKey: SpecialtyItem['iconKey'];
  className?: string;
}

export function SpecialtyIcon({ iconKey, className = 'w-5 h-5' }: SpecialtyIconProps) {
  const props = { className, strokeWidth: 1.75, 'aria-hidden': true as const };

  switch (iconKey) {
    case 'heart':
      return <HeartPulse {...props} />;
    case 'sparkles':
      return <Sparkles {...props} />;
    case 'brain':
      return <Brain {...props} />;
    case 'bone':
      return <Bone {...props} />;
    case 'baby':
      return <Baby {...props} />;
    case 'flower':
      return <Flower2 {...props} />;
    case 'smile':
      return <Smile {...props} />;
    case 'stethoscope':
      return <Stethoscope {...props} />;
    case 'ear':
      return <Ear {...props} />;
    case 'eye':
      return <Eye {...props} />;
    case 'wind':
      return <Wind {...props} />;
    case 'activity':
      return <Activity {...props} />;
  }
}
