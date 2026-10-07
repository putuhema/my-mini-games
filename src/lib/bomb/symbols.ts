// Keypad glyphs: one icon per symbol name in convex/bomb.ts. Never labelled in the game,
// so players have to describe them ("the ghost", "the one like a jellyfish").
import type { KeypadSymbol } from '../../../convex/bomb';
import type { Icon } from '../icons/index.ts';

import AnchorIcon from 'phosphor-svelte/lib/AnchorIcon';
import AtomIcon from 'phosphor-svelte/lib/AtomIcon';
import ButterflyIcon from 'phosphor-svelte/lib/ButterflyIcon';
import CrownIcon from 'phosphor-svelte/lib/CrownIcon';
import EyeIcon from 'phosphor-svelte/lib/EyeIcon';
import GhostIcon from 'phosphor-svelte/lib/GhostIcon';
import LeafIcon from 'phosphor-svelte/lib/LeafIcon';
import MoonIcon from 'phosphor-svelte/lib/MoonIcon';
import PlanetIcon from 'phosphor-svelte/lib/PlanetIcon';
import SkullIcon from 'phosphor-svelte/lib/SkullIcon';
import SpiralIcon from 'phosphor-svelte/lib/SpiralIcon';
import SunIcon from 'phosphor-svelte/lib/SunIcon';
import TreeIcon from 'phosphor-svelte/lib/TreeIcon';
import CactusIcon from 'phosphor-svelte/lib/CactusIcon';
import FeatherIcon from 'phosphor-svelte/lib/FeatherIcon';
import FishIcon from 'phosphor-svelte/lib/FishIcon';
import FlaskIcon from 'phosphor-svelte/lib/FlaskIcon';
import FlowerIcon from 'phosphor-svelte/lib/FlowerIcon';
import HourglassIcon from 'phosphor-svelte/lib/HourglassIcon';
import KeyIcon from 'phosphor-svelte/lib/KeyIcon';
import PawPrintIcon from 'phosphor-svelte/lib/PawPrintIcon';
import BirdIcon from 'phosphor-svelte/lib/BirdIcon';
import SnowflakeIcon from 'phosphor-svelte/lib/SnowflakeIcon';
import UmbrellaIcon from 'phosphor-svelte/lib/UmbrellaIcon';
import YinyangIcon from 'phosphor-svelte/lib/YinyangIcon';
import AlienIcon from 'phosphor-svelte/lib/AlienIcon';
import BoneIcon from 'phosphor-svelte/lib/BoneIcon';
import PentagramIcon from 'phosphor-svelte/lib/PentagramIcon';

export const SYMBOL_ICON: Record<KeypadSymbol, Icon> = {
	anchor: AnchorIcon,
	atom: AtomIcon,
	butterfly: ButterflyIcon,
	crown: CrownIcon,
	eye: EyeIcon,
	ghost: GhostIcon,
	leaf: LeafIcon,
	moon: MoonIcon,
	planet: PlanetIcon,
	skull: SkullIcon,
	spiral: SpiralIcon,
	sun: SunIcon,
	tree: TreeIcon,
	cactus: CactusIcon,
	feather: FeatherIcon,
	fish: FishIcon,
	flask: FlaskIcon,
	flower: FlowerIcon,
	hourglass: HourglassIcon,
	key: KeyIcon,
	pawprint: PawPrintIcon,
	bird: BirdIcon,
	snowflake: SnowflakeIcon,
	umbrella: UmbrellaIcon,
	yinyang: YinyangIcon,
	alien: AlienIcon,
	bone: BoneIcon,
	pentagram: PentagramIcon,
};
