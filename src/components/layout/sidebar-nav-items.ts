
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Sparkles, FileQuestion, CalendarDays, Calendar, CalendarCheck,
  BookOpenCheck, Music2, BookOpen, Globe, History, ClipboardList, UploadCloud,
  UserCog, SpellCheck, Languages, Calculator as CalculatorIcon, BellRing, Settings
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  exactMatch?: boolean;
}

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard, exactMatch: true },
  { title: "Task Reminders", href: "/tasks", icon: BellRing },
  { title: "AI Assistant", href: "/ai-assistant", icon: Sparkles },
  { title: "Question Generator", href: "/question-generator", icon: FileQuestion },
  { title: "Day Planner", href: "/day-planner", icon: CalendarDays },
  { title: "Month Planner", href: "/month-planner", icon: Calendar },
  { title: "Year Planner", href: "/year-planner", icon: CalendarCheck },
  { title: "NEET Guidelines", href: "/neet-guidelines", icon: BookOpenCheck },
  { title: "Music Player", href: "/music-player", icon: Music2, disabled: true }, // Example of disabled
  { title: "NCERT Viewer", href: "/ncert-viewer", icon: BookOpen },
  { title: "Web Browser", href: "/browser", icon: Globe },
  { title: "Activity History", href: "/activity-history", icon: History },
  { title: "Custom Tasks", href: "/custom-tasks", icon: ClipboardList },
  { title: "Files &amp; Uploads", href: "/files", icon: UploadCloud },
  { title: "Dictionary", href: "/dictionary", icon: SpellCheck },
  { title: "Translator", href: "/translate", icon: Languages },
  { title: "Calculator", href: "/calculator", icon: CalculatorIcon },
  { title: "Profile Settings", href: "/profile", icon: Settings }, // Using Settings icon for Profile
];
