import {
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  ArrowRight01Icon,
  ArrowRight02Icon,
  BotIcon,
  BubbleChatIcon,
  Calendar01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  CodeIcon,
  Copy01Icon,
  Database01Icon,
  Delete03Icon,
  Edit02Icon,
  FavouriteIcon,
  File02Icon,
  FloppyDiskIcon,
  GithubIcon,
  GlobeIcon,
  LayoutGridIcon,
  Linkedin01Icon,
  Loading03Icon,
  LockIcon,
  Logout01Icon,
  Mail01Icon,
  Menu01Icon,
  MultiplicationSignIcon,
  PlayIcon,
  PlusSignIcon,
  QuotesIcon,
  SentIcon,
  Share01Icon,
  Shield01Icon,
  SparklesIcon,
  StarIcon,
  Table01Icon,
  Tick01Icon,
  TwitterIcon,
  UserIcon,
  Wifi01Icon,
  ZapIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import React from 'react'

export type IconProps = Omit<React.ComponentPropsWithoutRef<typeof HugeiconsIcon>, 'icon'>

function createIcon(icon: IconSvgElement, displayName: string) {
  const Icon = ({ ref, ...props }: IconProps & { ref?: React.Ref<SVGSVGElement> }) => (
    <HugeiconsIcon ref={ref} icon={icon} {...props} />
  )

  Icon.displayName = displayName
  return Icon
}

export const Star = createIcon(StarIcon, 'Star')
export const ArrowLeft = createIcon(ArrowLeft01Icon, 'ArrowLeft')
export const ArrowRight = createIcon(ArrowRight01Icon, 'ArrowRight')
export const Calendar = createIcon(Calendar01Icon, 'Calendar')
export const Clock = createIcon(Clock01Icon, 'Clock')
export const User = createIcon(UserIcon, 'User')
export const Check = createIcon(Tick01Icon, 'Check')
export const CheckCircle = createIcon(CheckmarkCircle02Icon, 'CheckCircle')
export const Copy = createIcon(Copy01Icon, 'Copy')
export const Plus = createIcon(PlusSignIcon, 'Plus')
export const Trash2 = createIcon(Delete03Icon, 'Trash2')
export const Edit2 = createIcon(Edit02Icon, 'Edit2')
export const Save = createIcon(FloppyDiskIcon, 'Save')
export const X = createIcon(MultiplicationSignIcon, 'X')
export const Loader2 = createIcon(Loading03Icon, 'Loader2')
export const Menu = createIcon(Menu01Icon, 'Menu')
export const Github = createIcon(GithubIcon, 'Github')
export const Send = createIcon(SentIcon, 'Send')
export const Bot = createIcon(BotIcon, 'Bot')
export const Wifi = createIcon(Wifi01Icon, 'Wifi')
export const Mail = createIcon(Mail01Icon, 'Mail')
export const Lock = createIcon(LockIcon, 'Lock')
export const MessageSquare = createIcon(BubbleChatIcon, 'MessageSquare')
export const FileText = createIcon(File02Icon, 'FileText')
export const Sparkles = createIcon(SparklesIcon, 'Sparkles')
export const Twitter = createIcon(TwitterIcon, 'Twitter')
export const Linkedin = createIcon(Linkedin01Icon, 'Linkedin')
export const Heart = createIcon(FavouriteIcon, 'Heart')
export const Zap = createIcon(ZapIcon, 'Zap')
export const Shield = createIcon(Shield01Icon, 'Shield')
export const Globe = createIcon(GlobeIcon, 'Globe')
export const Database = createIcon(Database01Icon, 'Database')
export const Layout = createIcon(LayoutGridIcon, 'Layout')
export const Code2 = createIcon(CodeIcon, 'Code2')
export const Play = createIcon(PlayIcon, 'Play')
export const Table = createIcon(Table01Icon, 'Table')
export const ChevronLeft = createIcon(ArrowLeft02Icon, 'ChevronLeft')
export const ChevronRight = createIcon(ArrowRight02Icon, 'ChevronRight')
export const Quote = createIcon(QuotesIcon, 'Quote')
export const LogOut = createIcon(Logout01Icon, 'LogOut')
export const Share2 = createIcon(Share01Icon, 'Share2')
