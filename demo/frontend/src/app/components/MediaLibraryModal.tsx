import { useState, useRef, useCallback, useEffect } from 'react';
import { X, CloudUpload, Play, Search, ChevronDown } from 'lucide-react';
import { authFetch } from '../utils/auth';

type Tab = 'videos' | 'images' | 'uploads';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToProject?: (item: StockItem) => void;
}

interface StockItem {
  importUrl: string;
  name: string;
  cdnUrl: string;
  previewUrl: string;
  height: number;
  width: number;
  thumbnailUrl?: string;
  tags: string[];
  durationMs?: number | null;
  description?: string | null;
  createdAt?: string | null;
}

interface UploadedItem {
  id: string;
  file: File;
  type: 'video' | 'image';
  thumbnail: string;
  progress: number;
  done: boolean;
  serverUrl?: string;
}

interface MyMediaItem {
  id: string;
  type: 'video' | 'image';
  name: string;
  url: string;
  thumbnailUrl?: string;
  durationMs?: number;
  uploadedAt: number;
}

// ── Stock data (S3-hosted, sourced from Pixabay) ──
const FALLBACK_VIDEOS: StockItem[] = [{"importUrl": "pixabay/videos/343929", "name": "cute birds, wildlife, beak, nature, bird, songbird, woods, ai generated", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/cute_birds_wildlife_beak.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/cute_birds_wildlife_beak.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/cute_birds_wildlife_beak.jpg", "tags": ["cute birds", "wildlife", "beak", "nature", "bird", "songbird", "woods", "ai generated"], "durationMs": 6000}, {"importUrl": "pixabay/videos/343865", "name": "ocean, sea, water, waves, spume, splash, spray, seascape, beach, coast, seashore, surf, foam, coastline, scenery, scenic, travel, leisure, vacation, ai generated", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/ocean_sea_water.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/ocean_sea_water.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/ocean_sea_water.jpg", "tags": ["ocean", "sea", "water", "waves", "spume", "splash", "spray", "seascape", "beach", "coast", "seashore", "surf", "foam", "coastline", "scenery", "scenic", "travel", "leisure", "vacation", "ai generated"], "durationMs": 8000}, {"importUrl": "pixabay/videos/343972", "name": "boy, child, kid, youth, gaming, gamer, controller, console, joystick, technology, play, entertainment, fun, toy, laughing, happy, cartoon, anime, ai generated", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/boy_child_kid.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/boy_child_kid.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/boy_child_kid.jpg", "tags": ["boy", "child", "kid", "youth", "gaming", "gamer", "controller", "console", "joystick", "technology", "play", "entertainment", "fun", "toy", "laughing", "happy", "cartoon", "anime", "ai generated"], "durationMs": 7000}, {"importUrl": "pixabay/videos/343599", "name": "garden, nature, plants, shrub, summer, colorful, bushes, landscape, flowers, bloom, backyard, trees, lanterns, lamp, evening, fireflies, sunset, mood, ai generated", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/garden_nature_plants.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/garden_nature_plants.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/garden_nature_plants.jpg", "tags": ["garden", "nature", "plants", "shrub", "summer", "colorful", "bushes", "landscape", "flowers", "bloom", "backyard", "trees", "lanterns", "lamp", "evening", "fireflies", "sunset", "mood", "ai generated"], "durationMs": 5000}, {"importUrl": "pixabay/videos/228847", "name": "waterfall, mountain stream, flow, stone, moss, forest, nature, japan", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/waterfall_mountain_stream_flow.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/waterfall_mountain_stream_flow.mp4", "height": 3840, "width": 2160, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/waterfall_mountain_stream_flow.jpg", "tags": ["waterfall", "mountain stream", "flow", "stone", "moss", "forest", "nature", "japan"], "durationMs": 20000}, {"importUrl": "pixabay/videos/338904", "name": "beach, nature, sea, sand, ocean, water, seascape, seashore, coast, landscape, aerial, drone, outdoors, wave, coastline", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/beach_nature_sea.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/beach_nature_sea.mp4", "height": 2160, "width": 3840, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/beach_nature_sea.jpg", "tags": ["beach", "nature", "sea", "sand", "ocean", "water", "seascape", "seashore", "coast", "landscape", "aerial", "drone", "outdoors", "wave", "coastline"], "durationMs": 23000}, {"importUrl": "pixabay/videos/343366", "name": "silverback, gorilla, ape, primate, animal, mammal, wildlife, nature, powerful, imposing, large, africa, dominant, forest, jungle, habitat, eating, ai generated", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/silverback_gorilla_ape.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/silverback_gorilla_ape.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/silverback_gorilla_ape.jpg", "tags": ["silverback", "gorilla", "ape", "primate", "animal", "mammal", "wildlife", "nature", "powerful", "imposing", "large", "africa", "dominant", "forest", "jungle", "habitat", "eating", "ai generated"], "durationMs": 7000}, {"importUrl": "pixabay/videos/343136", "name": "person, human, alone, walking, forest, nature, moss, trees, landscape, woods, path, trail, mist, fantasy, dream, surreal, magic, mystical, fairytale, cloak, cape, hood, ai generated", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/person_human_alone.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/person_human_alone.mp4", "height": 1920, "width": 1080, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/person_human_alone.jpg", "tags": ["person", "human", "alone", "walking", "forest", "nature", "moss", "trees", "landscape", "woods", "path", "trail", "mist", "fantasy", "dream", "surreal", "magic", "mystical", "fairytale", "cloak", "cape", "hood", "ai generated"], "durationMs": 6000}, {"importUrl": "pixabay/videos/287510", "name": "forest, nature, moss, trees, woods, path, landscape, environment, stream, water", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/forest_nature_moss.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/forest_nature_moss.mp4", "height": 2160, "width": 3840, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/forest_nature_moss.jpg", "tags": ["forest", "nature", "moss", "trees", "woods", "path", "landscape", "environment", "stream", "water"], "durationMs": 16000}, {"importUrl": "pixabay/videos/333600", "name": "flowers, red plum, winter flowers, snowstorm, snow, japan", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/flowers_red_plum_winter_flowers.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/flowers_red_plum_winter_flowers.mp4", "height": 2160, "width": 3840, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/flowers_red_plum_winter_flowers.jpg", "tags": ["flowers", "red plum", "winter flowers", "snowstorm", "snow", "japan"], "durationMs": 24000}, {"importUrl": "", "name": "sea, ocean, seagulls, birds, sunset, dusk, beach, paradise, flight, nature", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/sea_ocean_seagulls.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/sea_ocean_seagulls.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/sea_ocean_seagulls.jpg", "tags": ["sea", " ocean"], "durationMs": 20000}, {"importUrl": "", "name": "coral, reef, underwater, nature, bioluminescent, ocean, sea, tropical, glow, environment, calm, relaxing, loop, seamless, animated wallpaper, depth, waves, ai generated", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/coral_reef_underwater.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/coral_reef_underwater.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/coral_reef_underwater.jpg", "tags": ["coral", " reef"], "durationMs": 9000}, {"importUrl": "", "name": "bioluminescence, beach, waves, sea, ocean, loop, seamless loop, animated wallpaper, night, stars, galaxy, milky way, glow, blue, light, water, shore, reflection, nature, dream, maldives, mexico, puerto rico, jamaica, thailand, ai generated", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/bioluminescence_beach_waves.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/bioluminescence_beach_waves.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/bioluminescence_beach_waves.jpg", "tags": ["bioluminescence", " beach"], "durationMs": 20000}, {"importUrl": "", "name": "boa vista, cape verde, nature, sea, ocean, shore, seashore, beach, waves, water, surf, outdoors, sand, turquoise, travel, relaxing, meditation", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/boa_vista_cape_verde_nature.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/boa_vista_cape_verde_nature.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/boa_vista_cape_verde_nature.jpg", "tags": ["boa vista", " cape verde"], "durationMs": 80000}, {"importUrl": "", "name": "clouds, sky, sunlight, forest, nature, river, light, rays, landscape, cinematic, heaven, atmosphere, peaceful, serene, dramatic, view, scenic, mist, water, reflection, travel, background, calm, environment, aerial, ai generated", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/clouds_sky_sunlight.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/clouds_sky_sunlight.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/clouds_sky_sunlight.jpg", "tags": ["clouds", " sky"], "durationMs": 39000}, {"importUrl": "", "name": "travel, burjkalifa, dubai, uae, emirate, arab, burj-al-arab, burj khalifa, tourists, architecture, building, modern, skyscraper, city, landmark, historical, sunrise, skyline, landscape, urban, cityscape", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/travel_burjkalifa_dubai.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/travel_burjkalifa_dubai.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/travel_burjkalifa_dubai.jpg", "tags": ["travel", " burjkalifa"], "durationMs": 25000}, {"importUrl": "", "name": "aurora, borealis, arctic, polar, night, sky, nature, stars, clouds, ocean, ice, reflection, water, auroral, lights, northern, atmosphere, celestial, nightscape, landscape, ai generated", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/aurora_borealis_arctic.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/aurora_borealis_arctic.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/aurora_borealis_arctic.jpg", "tags": ["aurora", " borealis"], "durationMs": 30000}, {"importUrl": "", "name": "wave, breaking, sea, ocean, water, coast, slow motion, slowmo", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/wave_breaking_sea.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/wave_breaking_sea.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/wave_breaking_sea.jpg", "tags": ["wave", " breaking"], "durationMs": 40000}, {"importUrl": "", "name": "sunset, sea, sun, evening atmosphere, nature, landscape", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/sunset_sea_sun.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/sunset_sea_sun.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/sunset_sea_sun.jpg", "tags": ["sunset", " sea"], "durationMs": 21000}, {"importUrl": "", "name": "alps, sunrise, fog, sea of fog, clouds, landscape, switzerland, nature", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/alps_sunrise_fog.mp4", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/alps_sunrise_fog.mp4", "height": 1080, "width": 1920, "thumbnailUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/videos/thumbs/alps_sunrise_fog.jpg", "tags": ["alps", " sunrise"], "durationMs": 46000}];

const FALLBACK_IMAGES: StockItem[] = [{"importUrl": "pixabay/images/10204848", "name": "river, lake, water, shore, outdoors, forest, trees, night sky, landscape, fog, mountains, dream, surreal, magic, mood, night, moon, nature, mystical, fairytale, sky, mysterious", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/river_lake.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/river_lake.jpg", "height": 1280, "width": 1280, "tags": ["river", "lake", "water", "shore", "outdoors", "forest", "trees", "night sky", "landscape", "fog", "mountains", "dream", "surreal", "magic", "mood", "night", "moon", "nature", "mystical", "fairytale", "sky", "mysterious"], "durationMs": null}, {"importUrl": "pixabay/images/10204849", "name": "sheep, cartoon, humor, funny, rural, farm, meadow, drawing, flowers, educational, lamb, nature, october, wool, landscape, pasture, cute, fauna, comic, wildlife", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/sheep_cartoon.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/sheep_cartoon.jpg", "height": 1280, "width": 1280, "tags": ["sheep", "cartoon", "humor", "funny", "rural", "farm", "meadow", "drawing", "flowers", "educational", "lamb", "nature", "october", "wool", "landscape", "pasture", "cute", "fauna", "comic", "wildlife"], "durationMs": null}, {"importUrl": "pixabay/images/10204847", "name": "kitten, cat, pet, animal, watercolor, painting, cute, portrait, adorable, fluffy, young, educational, nature, feline, sweet, fur, cub, artistic, cuteness, charm", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/kitten_cat.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/kitten_cat.jpg", "height": 1280, "width": 1280, "tags": ["kitten", "cat", "pet", "animal", "watercolor", "painting", "cute", "portrait", "adorable", "fluffy", "young", "educational", "nature", "feline", "sweet", "fur", "cub", "artistic", "cuteness", "charm"], "durationMs": null}, {"importUrl": "pixabay/images/10202905", "name": "sea eagle, raptor, nature, japan, snow, winter, feathers, hokkaido, drift ice, flight, rausu, bird of prey, wings, falconry, beak, ice, haliaeetus albicilla, predator, bird, flying", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/sea_eagle_raptor.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/sea_eagle_raptor.jpg", "height": 914, "width": 1280, "tags": ["sea eagle", "raptor", "nature", "japan", "snow", "winter", "feathers", "hokkaido", "drift ice", "flight", "rausu", "bird of prey", "wings", "falconry", "beak", "ice", "haliaeetus albicilla", "predator", "bird", "flying"], "durationMs": null}, {"importUrl": "pixabay/images/10198535", "name": "butterfly, flower, nature, wings, season, summer, yellow, orange, macro, focus, colorful, insect, garden, natural, elegant, blooming, green, vibrant", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/butterfly_flower_18.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/butterfly_flower_18.jpg", "height": 850, "width": 1280, "tags": ["butterfly", "flower", "nature", "wings", "season", "summer", "yellow", "orange", "macro", "focus", "colorful", "insect", "garden", "natural", "elegant", "blooming", "green", "vibrant"], "durationMs": null}, {"importUrl": "pixabay/images/10207539", "name": "butterfly, insect, nature, wings, flower, yellow, orange, outdoor, natural science, macro, beauty, ecosystem, fauna, flora, entomology, close-up, biodiversity, blossom", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/butterfly_insect.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/butterfly_insect.jpg", "height": 923, "width": 1280, "tags": ["butterfly", "insect", "nature", "wings", "flower", "yellow", "orange", "outdoor", "natural science", "macro", "beauty", "ecosystem", "fauna", "flora", "entomology", "close-up", "biodiversity", "blossom"], "durationMs": null}, {"importUrl": "pixabay/images/10204944", "name": "digital, head, wireframe, intelligence, human, brain, face, network, connectivity, lines, points, data, abstract, technology, futuristic, science, artificial intelligence, neural, computation, mind, thought, processing", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/digital_head.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/digital_head.jpg", "height": 1280, "width": 888, "tags": ["digital", "head", "wireframe", "intelligence", "human", "brain", "face", "network", "connectivity", "lines", "points", "data", "abstract", "technology", "futuristic", "science", "artificial intelligence", "neural", "computation", "mind", "thought", "processing"], "durationMs": null}, {"importUrl": "pixabay/images/10202030", "name": "music, piano, treble clef, notes, sheet music, drawing, sketch, charcoal, melody, harmony, keys, instrument, classical, rhythm, artistic, composition, symphony, pencil, texture, vintage, ai generated", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/music_piano.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/music_piano.jpg", "height": 1280, "width": 859, "tags": ["music", "piano", "treble clef", "notes", "sheet music", "drawing", "sketch", "charcoal", "melody", "harmony", "keys", "instrument", "classical", "rhythm", "artistic", "composition", "symphony", "pencil", "texture", "vintage", "ai generated"], "durationMs": null}, {"importUrl": "pixabay/images/10205472", "name": "dawn, mountains, sea, boats, clouds, forests, sunrise, calm, nature, light, scenic, morning, blue, tranquility, view, horizon, reflection, adventure, silence, weather, landscape", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/dawn_mountains.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/dawn_mountains.jpg", "height": 720, "width": 1280, "tags": ["dawn", "mountains", "sea", "boats", "clouds", "forests", "sunrise", "calm", "nature", "light", "scenic", "morning", "blue", "tranquility", "view", "horizon", "reflection", "adventure", "silence", "weather", "landscape"], "durationMs": null}, {"importUrl": "pixabay/images/10205893", "name": "flower power, spring magic, blossoms, spring, sunny, light, radiant, nature, bloom, garden, tree, bud, leaves", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/flower_power_spring_magic.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/flower_power_spring_magic.jpg", "height": 960, "width": 1280, "tags": ["flower power", "spring magic", "blossoms", "spring", "sunny", "light", "radiant", "nature", "bloom", "garden", "tree", "bud", "leaves"], "durationMs": null}, {"importUrl": "pixabay/images/10202037", "name": "sailboat, boat, ocean, sea, night sky, stars, moon, coast, palm trees, horizon, sky, nature, water surface, sailing, mood, sunset, caribbean, copy space, vacation, west island", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/sailboat_boat.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/sailboat_boat.jpg", "height": 1280, "width": 1280, "tags": ["sailboat", "boat", "ocean", "sea", "night sky", "stars", "moon", "coast", "palm trees", "horizon", "sky", "nature", "water surface", "sailing", "mood", "sunset", "caribbean", "copy space", "vacation", "west island"], "durationMs": null}, {"importUrl": "pixabay/images/10202668", "name": "lupine, leaf, green, garden, texture, detail, nature, light, shadow, macro, foliage, close-up, summer, outdoor, sunlight, fresh, vibrant, tranquility, botanical, beauty", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/lupine_leaf.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/lupine_leaf.jpg", "height": 1280, "width": 853, "tags": ["lupine", "leaf", "green", "garden", "texture", "detail", "nature", "light", "shadow", "macro", "foliage", "close-up", "summer", "outdoor", "sunlight", "fresh", "vibrant", "tranquility", "botanical", "beauty"], "durationMs": null}, {"importUrl": "pixabay/images/10202657", "name": "bleeding heart, pink, flower, in spring, ornamental plant, leaves, botany, nature, macro, spring blossoms, early, perennial, home garden, romance, delicate, japanese plant, april, detail, bud", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/bleeding_heart_pink.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/bleeding_heart_pink.jpg", "height": 853, "width": 1280, "tags": ["bleeding heart", "pink", "flower", "in spring", "ornamental plant", "leaves", "botany", "nature", "macro", "spring blossoms", "early", "perennial", "home garden", "romance", "delicate", "japanese plant", "april", "detail", "bud"], "durationMs": null}, {"importUrl": "pixabay/images/10204384", "name": "ocean, rocky coast, blue sky, woman, hat, clouds, hiking, nature, seashore, distance, solitude, quiet, spring, panorama, peace, relaxation, isolation, stroll, leisure, pacific", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/ocean_rocky_coast.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/ocean_rocky_coast.jpg", "height": 853, "width": 1280, "tags": ["ocean", "rocky coast", "blue sky", "woman", "hat", "clouds", "hiking", "nature", "seashore", "distance", "solitude", "quiet", "spring", "panorama", "peace", "relaxation", "isolation", "stroll", "leisure", "pacific"], "durationMs": null}, {"importUrl": "pixabay/images/10204942", "name": "explosion, blue, energy, light, cosmic, radial, glow, intense, bright, nebula, star, future, technology, digital, abstract, network, neural, firing, connections, dark, light points, rays, movement, science", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/explosion_blue.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/explosion_blue.jpg", "height": 1280, "width": 888, "tags": ["explosion", "blue", "energy", "light", "cosmic", "radial", "glow", "intense", "bright", "nebula", "star", "future", "technology", "digital", "abstract", "network", "neural", "firing", "connections", "dark", "light points", "rays", "movement", "science"], "durationMs": null}, {"importUrl": "pixabay/images/10205190", "name": "roses, noble, beautiful flowers, apricot, peach color, blossoms, rose petals, flower, flower wallpaper, nature background, desktop backgrounds, flower background, rose garden, nature, garden, plants, bokeh, peach", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/roses_noble.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/roses_noble.jpg", "height": 1280, "width": 822, "tags": ["roses", "noble", "beautiful flowers", "apricot", "peach color", "blossoms", "rose petals", "flower", "flower wallpaper", "nature background", "desktop backgrounds", "flower background", "rose garden", "nature", "garden", "plants", "bokeh", "peach"], "durationMs": null}, {"importUrl": "pixabay/images/10207533", "name": "squirrel, tree, animal, rodent, nature, branches, forest, wild, cute, dense foliage, natural surroundings, tree bark, resting, observing, summer, relaxation, cuteness, forest animals", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/squirrel_tree.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/squirrel_tree.jpg", "height": 850, "width": 1280, "tags": ["squirrel", "tree", "animal", "rodent", "nature", "branches", "forest", "wild", "cute", "dense foliage", "natural surroundings", "tree bark", "resting", "observing", "summer", "relaxation", "cuteness", "forest animals"], "durationMs": null}, {"importUrl": "pixabay/images/10207094", "name": "pasque flower, purple, flower, spring, nature, blur, detail, macro photography, botany, plant, fur, soft, outdoor, happy, pistil, stamen, wild, insect, pastel", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/pasque_flower_purple.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/pasque_flower_purple.jpg", "height": 853, "width": 1280, "tags": ["pasque flower", "purple", "flower", "spring", "nature", "blur", "detail", "macro photography", "botany", "plant", "fur", "soft", "outdoor", "happy", "pistil", "stamen", "wild", "insect", "pastel"], "durationMs": null}, {"importUrl": "", "name": "butterfly, flower, nature", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/butterfly_flower.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/butterfly_flower.jpg", "height": 1280, "width": 1280, "tags": ["butterfly", "flower"], "durationMs": null}, {"importUrl": "", "name": "butterfly, insect, wings", "cdnUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/butterfly_insect_17.jpg", "previewUrl": "https://aicc-dev-public.s3.ap-southeast-1.amazonaws.com/media/images/butterfly_insect_17.jpg", "height": 1280, "width": 1280, "tags": ["butterfly", "insect"], "durationMs": null}];

function filterStock(items: StockItem[], search: string): StockItem[] {
  if (!search.trim()) return items;
  const q = search.toLowerCase();
  return items.filter(i => i.name.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q)));
}

// ── Thumbnail generator for uploads ──
function generateThumbnail(file: File): Promise<string> {
  return new Promise(resolve => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.src = URL.createObjectURL(file);
      const timeout = setTimeout(() => { URL.revokeObjectURL(video.src); resolve(''); }, 5000);
      video.onloadeddata = () => { video.currentTime = Math.min(1, video.duration * 0.1 || 0.01); };
      video.onseeked = () => {
        clearTimeout(timeout);
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')!.drawImage(video, 0, 0);
        URL.revokeObjectURL(video.src);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    }
  });
}

function VideoThumbnail({ url }: { url: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.src = url;
    const timeout = setTimeout(() => setLoaded(true), 5000);
    video.onloadeddata = () => { video.currentTime = Math.min(1, video.duration * 0.1 || 0.01); };
    video.onseeked = () => {
      clearTimeout(timeout);
      if (ref.current) {
        const canvas = ref.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
      }
      setLoaded(true);
    };
    video.onerror = () => { clearTimeout(timeout); setLoaded(true); };
  }, [url]);

  return loaded ? (
    <canvas ref={ref} className="w-full block rounded-xl" />
  ) : (
    <div className="w-full aspect-video bg-gray-200 rounded-xl animate-pulse" />
  );
}

function MyMediaCard({ item, onPreview, onAdd, onDelete }: { item: MyMediaItem; onPreview: () => void; onAdd: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div
      className="break-inside-avoid group relative rounded-xl overflow-hidden cursor-pointer bg-gray-100"
      onClick={onPreview}
    >
      {item.type === 'image' ? (
        <img src={item.url} alt={item.name} className="w-full block rounded-xl" loading="lazy" />
      ) : item.thumbnailUrl ? (
        <img src={item.thumbnailUrl} alt={item.name} className="w-full block rounded-xl" loading="lazy" />
      ) : (
        <VideoThumbnail url={item.url} />
      )}

      {/* 3-dot menu — top right */}
      <div className="absolute top-2 right-2 z-10" ref={menuRef}>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
          className="w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 min-w-[140px]">
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(false); onPreview(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
              Expand
            </button>
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-xl pointer-events-none">
        <button
          onClick={e => { e.stopPropagation(); onAdd(); }}
          className="px-3 py-1.5 bg-white rounded-md text-[11px] font-medium text-gray-800 shadow-md hover:bg-gray-50 transition-colors cursor-pointer pointer-events-auto"
        >
          Thêm vào dự án
        </button>
      </div>

      {/* Duration + play icon for videos */}
      {item.type === 'video' && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          {item.durationMs && (
            <span className="text-[11px] text-white/90 font-medium bg-black/40 px-1.5 py-0.5 rounded">
              {formatDuration(item.durationMs)}
            </span>
          )}
          <div className="w-7 h-7 bg-white/80 rounded-full flex items-center justify-center">
            <Play className="w-3.5 h-3.5 text-gray-700 fill-gray-700" />
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number | null) {
  if (!ms) return '';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ── Masonry Grid ──
function StockGrid({ items, type, onAdd, onPreview }: {
  items: StockItem[];
  type: 'video' | 'image';
  onAdd?: (item: StockItem) => void;
  onPreview?: (url: string, mediaType: 'video' | 'image') => void;
}) {
  return (
    <div className="columns-4 gap-3 space-y-3">
      {items.map((item, idx) => (
        <div
          key={item.importUrl || item.cdnUrl || idx}
          className="break-inside-avoid group relative rounded-xl overflow-hidden cursor-pointer bg-gray-100"
          onClick={() => onPreview?.(type === 'video' ? item.previewUrl : (item.cdnUrl || item.previewUrl), type)}
        >
          <img
            src={item.thumbnailUrl || item.previewUrl || item.cdnUrl}
            alt={item.name}
            className="w-full block rounded-xl"
            loading="lazy"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer">
            <button
              onClick={e => { e.stopPropagation(); onAdd?.(item); }}
              className="px-3 py-1.5 bg-white rounded-md text-[11px] font-medium text-gray-800 shadow-md hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Thêm vào dự án
            </button>
          </div>
          {/* Play icon + duration for videos */}
          {type === 'video' && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              {item.durationMs && (
                <span className="text-[11px] text-white/90 font-medium bg-black/40 px-1.5 py-0.5 rounded">
                  {formatDuration(item.durationMs)}
                </span>
              )}
              <div className="w-7 h-7 bg-white/80 rounded-full flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-gray-700 fill-gray-700" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function MediaLibraryModal({ isOpen, onClose, onAddToProject }: MediaLibraryModalProps) {
  const [tab, setTab] = useState<Tab>('videos');
  const [search, setSearch] = useState('');
  const [uploads, setUploads] = useState<UploadedItem[]>([]);
  const [myFiles, setMyFiles] = useState<MyMediaItem[]>([]);
  const [myFilesLoaded, setMyFilesLoaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'video' | 'image'>('video');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load my files from server
  useEffect(() => {
    if (!isOpen || myFilesLoaded) return;
    (async () => {
      try {

        const [vidRes, imgRes] = await Promise.all([
          authFetch('/api/uploads/list?type=video'),
          authFetch('/api/uploads/list?type=image'),
        ]);
        const items: MyMediaItem[] = [];
        if (vidRes.ok) {
          const d = await vidRes.json();
          items.push(...(d.items || []).map((m: any) => ({ id: m.id, type: 'video' as const, name: m.name, url: m.url, durationMs: m.durationMs, uploadedAt: m.uploadedAt })));
        }
        if (imgRes.ok) {
          const d = await imgRes.json();
          items.push(...(d.items || []).map((m: any) => ({ id: m.id, type: 'image' as const, name: m.name, url: m.url, uploadedAt: m.uploadedAt })));
        }
        items.sort((a, b) => b.uploadedAt - a.uploadedAt);
        setMyFiles(items);
      } catch { /* ignore */ }
      setMyFilesLoaded(true);
    })();
  }, [isOpen, myFilesLoaded]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewUrl) { setPreviewUrl(null); }
        else { onClose(); }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, previewUrl, onClose]);

  const filteredVideos = filterStock(FALLBACK_VIDEOS, search);
  const filteredImages = filterStock(FALLBACK_IMAGES, search);

  // Upload handler — uploads to server
  const handleFiles = useCallback(async (files: FileList) => {
    setTab('uploads');
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
      const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
      if (!isVideo && !isImage) continue;
      const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const type = isVideo ? 'video' : 'image' as const;

      setUploads(prev => [...prev, { id, file, type, thumbnail: '', progress: 0, done: false }]);

      // Get thumbnail + duration for videos
      const thumb = await generateThumbnail(file);
      let durationSec = 0;
      if (isVideo) {
        durationSec = await new Promise<number>(resolve => {
          const vid = document.createElement('video');
          vid.preload = 'metadata';
          const timeout = setTimeout(() => resolve(0), 5000);
          vid.onloadedmetadata = () => { clearTimeout(timeout); resolve(vid.duration || 0); URL.revokeObjectURL(vid.src); };
          vid.onerror = () => { clearTimeout(timeout); resolve(0); };
          vid.src = URL.createObjectURL(file);
        });
      }
      setUploads(prev => prev.map(u => u.id === id ? { ...u, thumbnail: thumb, progress: 30 } : u));

      // Upload to server
      const form = new FormData();
      form.append('file', file, file.name);
      try {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: 60 } : u));
        const res = await authFetch(`/api/upload/media?duration=${durationSec}`, { method: 'POST', body: form });
        if (res.ok) {
          const data = await res.json();
          const durationMs = data.durationMs || (durationSec ? Math.round(durationSec * 1000) : undefined);
          setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: 100, done: true, serverUrl: data.url } : u));
          setMyFiles(prev => [{ id: data.filename, type, name: data.name || file.name, url: data.url, thumbnailUrl: thumb, durationMs, uploadedAt: Date.now() }, ...prev]);
        } else {
          setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: 100, done: true } : u));
        }
      } catch {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, progress: 100, done: true } : u));
      }
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  if (!isOpen) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'videos', label: 'Khám phá video' },
    { key: 'images', label: 'Khám phá hình ảnh' },
    { key: 'uploads', label: 'Tệp của tôi' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1100px] h-[85vh] flex flex-col pointer-events-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            <div className="flex items-center gap-6">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSearch(''); }}
                  className={`text-[15px] pb-3 border-b-2 transition-colors ${
                    tab === t.key
                      ? 'font-semibold text-gray-900 border-gray-900'
                      : 'font-medium text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CloudUpload className="w-4 h-4" />
                Upload
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="border-b border-gray-100" />

          {/* Search bar */}
          <div className="px-6 py-3 flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={tab === 'uploads' ? 'Tìm kiếm hình ảnh và video' : tab === 'videos' ? 'Tìm kiếm video' : 'Tìm kiếm hình ảnh'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-[14px] outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
            {tab !== 'uploads' && (
              <button className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Thể loại
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
            {tab === 'uploads' && (
              <button className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Sắp xếp
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-[400px]">
            {/* Videos / Images tabs */}
            {(tab === 'videos' || tab === 'images') && (
              <>
                {(tab === 'videos' ? filteredVideos : filteredImages).length === 0 ? (
                  <div className="flex items-center justify-center min-h-[400px] text-gray-400 text-[14px]">
                    Không tìm thấy kết quả
                  </div>
                ) : (
                  <StockGrid
                    items={tab === 'videos' ? filteredVideos : filteredImages}
                    type={tab === 'videos' ? 'video' : 'image'}
                    onAdd={onAddToProject}
                    onPreview={(url, mediaType) => { setPreviewUrl(url); setPreviewType(mediaType); }}
                  />
                )}
              </>
            )}

            {/* Uploads tab */}
            {tab === 'uploads' && (
              <>
                {/* Uploading items */}
                {uploads.filter(u => !u.done).length > 0 && (
                  <div className="columns-4 gap-3 space-y-3 mb-4">
                    {uploads.filter(u => !u.done).map(item => (
                      <div key={item.id} className="break-inside-avoid relative rounded-xl overflow-hidden bg-gray-100">
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt="" className="w-full block rounded-xl" />
                        ) : (
                          <div className="w-full aspect-video bg-gray-200 rounded-xl animate-pulse" />
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl">
                          <div className="w-3/4 h-1.5 bg-white/30 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* My files from server */}
                {myFiles.length > 0 ? (
                  <div className="columns-4 gap-3 space-y-3">
                    {myFiles.filter(item => !search || item.name.toLowerCase().includes(search.toLowerCase())).map(item => (
                      <MyMediaCard
                        key={item.id}
                        item={item}
                        onPreview={() => { setPreviewUrl(item.url); setPreviewType(item.type); }}
                        onAdd={() => onAddToProject?.({
                          importUrl: item.url, name: item.name, cdnUrl: item.url, previewUrl: item.url,
                          height: 0, width: 0, tags: [], durationMs: item.durationMs || null,
                        })}
                        onDelete={async () => {
                          try {
                            const res = await authFetch(`/api/uploads/${item.id}`, { method: 'DELETE' });
                            if (res.ok) setMyFiles(prev => prev.filter(f => f.id !== item.id));
                          } catch { /* ignore */ }
                        }}
                      />
                    ))}
                  </div>
                ) : myFilesLoaded && uploads.length === 0 ? (
                  <div className="flex items-center justify-center min-h-[200px] text-gray-400 text-[14px]">
                    Chưa có tệp nào được tải lên
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.mov,.jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={e => {
              if (e.target.files?.length) handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* Preview modal (video or image) */}
      {previewUrl && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-3xl max-h-[85vh] mx-8" onClick={e => e.stopPropagation()}>
            {previewType === 'video' ? (
              <video src={previewUrl} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl" />
            ) : (
              <img src={previewUrl} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
            )}
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
