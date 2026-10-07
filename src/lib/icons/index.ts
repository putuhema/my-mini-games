// Icon registry. Phosphor icons (filled weight reads closest to Duolingo's chunky glyphs)
// plus a few custom ones. Import per-file so dev doesn't load the whole set.
import type { Component, ComponentProps } from 'svelte';
import type { Category, Reaction } from '../../../convex/board';

import ArrowBendUpLeftIcon from 'phosphor-svelte/lib/ArrowBendUpLeftIcon';
import BalloonIcon from 'phosphor-svelte/lib/BalloonIcon';
import BookOpenTextIcon from 'phosphor-svelte/lib/BookOpenTextIcon';
import CameraIcon from 'phosphor-svelte/lib/CameraIcon';
import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
import ChatCircleDotsIcon from 'phosphor-svelte/lib/ChatCircleDotsIcon';
import ChatTeardropDotsIcon from 'phosphor-svelte/lib/ChatTeardropDotsIcon';
import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
import DoorOpenIcon from 'phosphor-svelte/lib/DoorOpenIcon';
import EnvelopeSimpleOpenIcon from 'phosphor-svelte/lib/EnvelopeSimpleOpenIcon';
import FireIcon from 'phosphor-svelte/lib/FireIcon';
import FlagCheckeredIcon from 'phosphor-svelte/lib/FlagCheckeredIcon';
import HandHeartIcon from 'phosphor-svelte/lib/HandHeartIcon';
import HeartIcon from 'phosphor-svelte/lib/HeartIcon';
import HouseIcon from 'phosphor-svelte/lib/HouseIcon';
import LadderSimpleIcon from 'phosphor-svelte/lib/LadderSimpleIcon';
import LinkIcon from 'phosphor-svelte/lib/LinkIcon';
import LockSimpleIcon from 'phosphor-svelte/lib/LockSimpleIcon';
import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
import MoonIcon from 'phosphor-svelte/lib/MoonIcon';
import PaintBrushIcon from 'phosphor-svelte/lib/PaintBrushIcon';
import PencilSimpleLineIcon from 'phosphor-svelte/lib/PencilSimpleLineIcon';
import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
import QuestionIcon from 'phosphor-svelte/lib/QuestionIcon';
import SmileyIcon from 'phosphor-svelte/lib/SmileyIcon';
import SmileyMeltingIcon from 'phosphor-svelte/lib/SmileyMeltingIcon';
import SparkleIcon from 'phosphor-svelte/lib/SparkleIcon';
import StarIcon from 'phosphor-svelte/lib/StarIcon';
import TargetIcon from 'phosphor-svelte/lib/TargetIcon';
import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
import TrophyIcon from 'phosphor-svelte/lib/TrophyIcon';
import XIcon from 'phosphor-svelte/lib/XIcon';
import MicrophoneIcon from 'phosphor-svelte/lib/MicrophoneIcon';
import StopIcon from 'phosphor-svelte/lib/StopIcon';
import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
import PauseIcon from 'phosphor-svelte/lib/PauseIcon';
import BellIcon from 'phosphor-svelte/lib/BellIcon';
import BellSlashIcon from 'phosphor-svelte/lib/BellSlashIcon';
import BellRingingIcon from 'phosphor-svelte/lib/BellRingingIcon';
import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
import LightningIcon from 'phosphor-svelte/lib/LightningIcon';
import MountainsIcon from 'phosphor-svelte/lib/MountainsIcon';
import SpeakerHighIcon from 'phosphor-svelte/lib/SpeakerHighIcon';
import SpeakerSlashIcon from 'phosphor-svelte/lib/SpeakerSlashIcon';
import BombIcon from 'phosphor-svelte/lib/BombIcon';
import BookOpenIcon from 'phosphor-svelte/lib/BookOpenIcon';
import ArrowsLeftRightIcon from 'phosphor-svelte/lib/ArrowsLeftRightIcon';
import SealCheckIcon from 'phosphor-svelte/lib/SealCheckIcon';
import HeadsetIcon from 'phosphor-svelte/lib/HeadsetIcon';
import SnakeIcon from './SnakeIcon.svelte';

export type IconProps = ComponentProps<typeof HeartIcon>;
export type Icon = Component<IconProps>;

export {
	BombIcon,
	BookOpenIcon,
	ArrowsLeftRightIcon,
	SealCheckIcon,
	HeadsetIcon,
	SpeakerSlashIcon,
	SpeakerHighIcon,
	MountainsIcon,
	LightningIcon,
	MicrophoneIcon,
	StopIcon,
	PlayIcon,
	PauseIcon,
	BellIcon,
	BellSlashIcon,
	BellRingingIcon,
	ArrowCounterClockwiseIcon,
	ArrowBendUpLeftIcon,
	BookOpenTextIcon,
	CaretDownIcon,
	ChatCircleDotsIcon,
	ChatTeardropDotsIcon,
	CheckIcon,
	DoorOpenIcon,
	EnvelopeSimpleOpenIcon,
	FireIcon,
	FlagCheckeredIcon,
	HeartIcon,
	LadderSimpleIcon,
	LinkIcon,
	LockSimpleIcon,
	MagnifyingGlassIcon,
	PaintBrushIcon,
	PencilSimpleLineIcon,
	PlusIcon,
	QuestionIcon,
	SnakeIcon,
	StarIcon,
	TargetIcon,
	TrashIcon,
	TrophyIcon,
	XIcon
};

/** Icon + colour family for each question category. */
export const CATEGORY_ICON: Record<Category, { icon: Icon; tone: string }> = {
	fun: { icon: BalloonIcon, tone: 'orange' },
	deep: { icon: MoonIcon, tone: 'purple' },
	memory: { icon: CameraIcon, tone: 'blue' },
	future: { icon: HouseIcon, tone: 'green' },
	ladder: { icon: LadderSimpleIcon, tone: 'gold' },
	snake: { icon: SnakeIcon, tone: 'red' },
	finale: { icon: FlagCheckeredIcon, tone: 'gold' },
	custom: { icon: HeartIcon, tone: 'pink' },
	guess: { icon: TargetIcon, tone: 'purple' }
};

/** Icon, colour family and label for each reaction. */
/** Icon, colour family, label and a phrase ("sent a hug") for each reaction. */
export const REACTION_ICON: Record<
	Reaction,
	{ icon: Icon; tone: string; label: string; phrase: string }
> = {
	love: { icon: HeartIcon, tone: 'red', label: 'Love it', phrase: 'love' },
	laugh: { icon: SmileyIcon, tone: 'gold', label: 'Haha', phrase: 'a laugh' },
	aww: { icon: SmileyMeltingIcon, tone: 'purple', label: 'Aww', phrase: 'an aww' },
	wow: { icon: SparkleIcon, tone: 'blue', label: 'Wow', phrase: 'a wow' },
	fire: { icon: FireIcon, tone: 'orange', label: 'Fire', phrase: 'fire' },
	hug: { icon: HandHeartIcon, tone: 'pink', label: 'Hug', phrase: 'a hug' }
};

export function reactionIcon(key: string | undefined) {
	return key && key in REACTION_ICON ? REACTION_ICON[key as Reaction] : undefined;
}
