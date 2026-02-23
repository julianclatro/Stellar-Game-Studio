import {
  FlaskConical,
  Fingerprint,
  FileText,
  Wine,
  Sword,
  Briefcase,
  MessageSquare,
  Phone,
  Pill,
  Footprints,
  Camera,
  HelpCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  flask: FlaskConical,
  fingerprint: Fingerprint,
  'file-text': FileText,
  wine: Wine,
  sword: Sword,
  briefcase: Briefcase,
  'message-square': MessageSquare,
  phone: Phone,
  pill: Pill,
  footprints: Footprints,
  camera: Camera,
}

export function getClueIcon(iconString: string): LucideIcon {
  return iconMap[iconString] ?? HelpCircle
}
