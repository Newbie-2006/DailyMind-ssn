/**
 * Bundled photography. Imported (not referenced by string) so Vite
 * fingerprints and serves them, and so a missing file fails the build
 * rather than the phone.
 */
import beachFamily from '../assets/photos/beach-family.jpg';
import cake from '../assets/photos/cake.jpg';
import cooking from '../assets/photos/cooking.jpg';
import dog from '../assets/photos/dog.jpg';
import festival from '../assets/photos/festival.jpg';
import garden from '../assets/photos/garden.jpg';
import hero from '../assets/photos/hero.jpg';
import kids from '../assets/photos/kids.jpg';
import lake from '../assets/photos/lake.jpg';
import mountains from '../assets/photos/mountains.jpg';
import reading from '../assets/photos/reading.jpg';
import thumbBeachFamily from '../assets/photos/thumbs/beach-family.jpg';
import thumbCake from '../assets/photos/thumbs/cake.jpg';
import thumbCooking from '../assets/photos/thumbs/cooking.jpg';
import thumbDog from '../assets/photos/thumbs/dog.jpg';
import thumbFestival from '../assets/photos/thumbs/festival.jpg';
import thumbGarden from '../assets/photos/thumbs/garden.jpg';
import thumbKids from '../assets/photos/thumbs/kids.jpg';
import thumbLake from '../assets/photos/thumbs/lake.jpg';
import thumbMountains from '../assets/photos/thumbs/mountains.jpg';
import thumbReading from '../assets/photos/thumbs/reading.jpg';
import avatarAaditya from '../assets/photos/avatar-aaditya.jpg';
import avatarPriya from '../assets/photos/avatar-priya.jpg';

export const photos = {
  beachFamily,
  cake,
  cooking,
  dog,
  festival,
  garden,
  hero,
  kids,
  lake,
  mountains,
  reading,
} as const;

/**
 * 320px square crops for the gallery grid and list thumbnails. Drawing a
 * 900px photo into a 128px tile costs a full-size decode on every one, which a
 * mid-range phone feels immediately.
 */
export const thumbs = {
  beachFamily: thumbBeachFamily,
  cake: thumbCake,
  cooking: thumbCooking,
  dog: thumbDog,
  festival: thumbFestival,
  garden: thumbGarden,
  kids: thumbKids,
  lake: thumbLake,
  mountains: thumbMountains,
  reading: thumbReading,
} as const;

export const avatars = {
  aaditya: avatarAaditya,
  priya: avatarPriya,
} as const;
