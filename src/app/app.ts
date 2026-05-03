import {
  ChangeDetectionStrategy,
  Component,
  signal,
  OnInit,
  effect,
  Injector,
  inject,
} from "@angular/core";
import { MatIconModule } from "@angular/material/icon";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

let firebaseApp;
let auth: ReturnType<typeof getAuth>;
if (typeof window !== "undefined") {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
  } catch (err) {
    console.error("Firebase init failed", err);
  }
}
export { auth };

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  loaded?: boolean;
  error?: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-root",
  imports: [MatIconModule],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App implements OnInit {
  promptInput = signal<string>("");
  negativePrompt = signal<string>("");
  isGenerating = signal<boolean>(false);
  images = signal<GeneratedImage[]>([]);
  viewingImage = signal<GeneratedImage | null>(null);
  
  // New settings
  bulkCount = signal<number>(1);
  referenceImage = signal<string>("");
  naturalSkin = signal<boolean>(false);
  upscale4K = signal<boolean>(false);
  
  // Settings
  shapeRatio = signal<string>("1:1");
  AVAILABLE_SHAPERATIOS = ["1:1", "16:9", "9:16", "3:2", "2:3", "4:3", "3:4", "5:4", "4:5", "21:9", "9:21", "2.35:1", "2.39:1", "auto"];
  baseModel = signal<string>("FLUX.2 Max");
  artStyle = signal<string>("");
  
  // Cinematic Enhancers & Explore Features
  AVAILABLE_CINEMATIC_ENHANCERS = [
    "Motion Picture", "SFX Effect", "VFX Effect", 
    "Volumetric Lighting", "God Rays", "Anamorphic Lens Flare", 
    "Film Grain", "Color Grading (Teal & Orange)", "ARRI ALEXA Aesthetic", 
    "35mm Film Quality", "Shallow Depth of Field", "Bokeh", 
    "Cinematic Lighting", "Soft Rim Light", "Atmospheric Haze", 
    "High Contrast", "Neon Glow", "Infrared", "Technicolor",
    "Award-Winning Magic"
  ];
  selectedCinematicEnhancers = signal<string[]>([]);

  AVAILABLE_EXPLORE_FEATURES = [
    "Multi-Reference", "Workflow Studio", "Node-Based Builder", 
    "Cinema Controls", "Image-to-Video", "Video Extension",
    "Style Consistency", "Text Rendering Fix", "Character Lockdown",
    "Seed Fixation", "Color Matcher", "3D Model Reference",
    "Audio Generation Sync", "Camera Path Spline", "Upscale Layering"
  ];
  selectedExploreFeatures = signal<string[]>([]);

  MODEL_CATEGORIES = [
    {
      name: "Latest & Newest",
      models: [
        "Leonardo Diffusion XL", "AlbedoBase XL",
        "FLUX.2 Max", "FLUX.2 Pro", "FLUX.2 Flex", "FLUX.2 Klein", 
        "FLUX.1 Kontext Max", "FLUX.1 Kontext Pro", "FLUX 1.1 Pro Ultra", "FLUX 1.1 Pro", 
        "FLUX.1 Dev", "FLUX.1 Schnell",
        "Meta AI Image Generator", "Meta Movie Gen", "Meta AI Animate", "Meta AI Edit",
        "Lucid Origin", "Phoenix 1.0", "Kino XL", "Vision XL", "Lucid Realism",
        "DALL-E 3 Standard", "DALL-E 3 HD", "GPT Image 1.5",
        "Seedance 2.0", "Seedream 5.0",
        "Dreamiux Pro", "Dreamiux Ultra", "Dreamiux Studio",
        "CogVideoX1.5-5B", "CogVideoX1.5-5B-I2V", "CogVideoX-FUN-5B",
        "Wan 2.2 14B", "HunyuanVideo", "Mochi 1", "Open-Sora 2.0",
        "Holographic v8"
      ]
    },
    {
      name: "Popular & Epic",
      models: [
        "Stable Diffusion 3.5", "Juggernaut XL", "Pony Diffusion", "Realistic Vision", "CyberRealistic",
        "DreamShaper XL Lightning", "DreamShaper XL Turbo", "DreamShaper XL Standard", "DreamShaper XL Inpainting", "DreamShaper 8",
        "CogVideoX-5B", "CogVideoX-5B-I2V", "LTX Video", "Dreamiux Lite", "Dreamiux Mobile",
        "NemoVideo", "Dreamina", "GlobalGPT Pro", "Alici AI", "ZenCreator"
      ]
    },
    {
      name: "Oldest & Classic",
      models: [
        "Dire Wolf Engine", "Flux Photorealism", "Life Real AI Model",
        "DALL-E 2", "Seedream 4.0", "Seedance 1.0 Pro", "Seedance 1.5 Pro", "Dreamiux Legacy", "CogVideoX-2B",
        "Anime (Leonardo)", "Cinematic Kino", "Concept Art", "Graphic Design", "Illustrative Albedo", "Leonardo Lightning", "Lifelike Vision", "Portrait Perfect", "Stock Photography"
      ]
    },
    {
      name: "Alpha",
      models: [
        "Seedream 5.4", "GPT 5.4 Mini", "Imagine 2.0", "Nanobanana Model",
        "Seedance 2.5", "Nano Banana", "Tiamat", "Wan 2.2", "Wan 2.2 5B"
      ]
    }
  ];

  AVAILABLE_MODELS = this.MODEL_CATEGORIES.flatMap(c => c.models);

  STYLE_CATEGORIES = [
    {
      name: "Cinematic & Photography",
      styles: ["Cinematic", "Cinematography", "Macro Photography", "Infrared", "Kodak Portra 400", "Polaroid Vintage", "Tilt-Shift", "Double Exposure"]
    },
    {
      name: "Digital & 3D",
      styles: ["3D Masterpiece", "Digital Illustration", "Octane Render", "Unreal Engine 5", "Ray Traced", "Isometric 3D", "Low Poly", "Biomechanical", "Cybernetic"]
    },
    {
      name: "Traditional & Fine Art",
      styles: ["Oil Painting", "Watercolor", "Charcoal Sketch", "Gouache", "Pencil Sketch", "Line Art", "Impressionism", "Surrealism", "Pop Art", "Abstract"]
    },
    {
      name: "Animation & Illustration",
      styles: ["Anime Studio", "Studio Ghibli", "Disney Animation", "Pixar Style", "Claymation", "Vintage Comic", "Pixel Art 16-bit", "Concept Art", "Matte Painting"]
    },
    {
      name: "Retro & Synth",
      styles: ["Vaporwave", "Synthwave", "Retro 80s", "Neon Noir", "VHS Glitch", "Psychedelic"]
    },
    {
      name: "Sci-Fi & Fantasy",
      styles: ["Cyberpunk", "Steampunk", "Dieselpunk", "Dark Fantasy", "Gothic", "Ethereal", "Fantasy Map", "Tarot Card", "Neo-Techwear", "Sci-Fi Realism"]
    },
    {
      name: "Crafts & Mixed Media",
      styles: ["Origami", "Papercut", "Mosaic", "Stained Glass", "Graffiti", "Minimalist"]
    }
  ];
  
  genre = signal<string>("None");
  mood = signal<string>("None");
  effect = signal<string>("None");
  theme = signal<string>("None");
  styleDetails = signal<string>("High");

  AVAILABLE_GENRES = ["None", "Sci-Fi", "Fantasy", "Cyberpunk", "Horror", "Action/Adventure", "Romance", "Historical", "Anime/Manga", "Supernatural", "Mystery", "Slice of Life", "Post-Apocalyptic", "Superhero", "Mythology", "Biopunk", "Steampunk", "Dieselpunk", "Solarpunk", "Atompunk", "Neo-Noir", "Western", "Space Opera", "Urban Fantasy", "Dark Fantasy", "Mecha", "Isekai", "Magic Realism", "Gothic", "Surrealism", "Tragedy", "Comedy", "Psychological Thriller", "Dystopian", "Utopian", "Crime"];
  AVAILABLE_MOODS = ["None", "Neutral", "Darkness", "Euphoric", "Melancholy", "Ethereal", "Aggressive", "Mysterious", "Romantic", "Epic/Cinematic", "Dreamy", "Nostalgic", "Apocalyptic", "High Energy", "Chill/Lofi", "Tense", "Whimsical", "Brooding", "Ominous", "Peaceful", "Serene", "Chaotic", "Vibrant", "Gloomy", "Suspenseful", "Joyful", "Sorrowful", "Hopeful", "Desolate", "Triumphant", "Intense", "Lonely", "Majestic", "Macabre", "Surreal", "Zen"];
  AVAILABLE_EFFECTS = ["None", "Cinematic Lighting", "Neon Glow", "Film Grain", "Glitch Art", "Chromatic Aberration", "Vignette", "Lens Flare", "Bloom", "Motion Blur", "Depth of Field", "Light Leaks", "Double Exposure", "Sepia Tone", "Halftone", "Pixelation", "Thermal Imaging", "X-Ray", "Holographic", "Kaleidoscope", "Prism", "God Rays", "Lens Distortion", "Overexposure", "Underexposure"];
  AVAILABLE_THEMES = ["None", "Futuristic", "Retro", "Steampunk", "Cybernetic", "Gothic", "Minimalism", "Surreal", "Utopian", "Dystopian", "Post-Apocalyptic", "High Fantasy", "Dark Fantasy", "Wuxia", "Norse Mythology", "Egyptian Mythology", "Greek Mythology", "Lovecraftian", "Eldritch", "Biopunk", "Dieselpunk", "Retro-Futurism", "Solarpunk", "Atompunk", "Wild West", "Pirate", "Samurai"];
  AVAILABLE_STYLE_DETAILS = ["Low", "Medium", "High", "Ultra-Detailed", "Hyper-Realistic", "Masterpiece 8k", "Intricate Details", "Photorealistic", "Unreal Engine 5 Render", "Octane Render", "Studio Quality", "Award-Winning", "Crisp Focus", "Micro-Detail", "8K Resolution", "16K Resolution", "Raw Photo", "DSLR"];

  isProfileOpen = signal<boolean>(false);
  mobileMenuOpen = signal<boolean>(false);
  currentView = signal<'home' | 'explore' | 'gallery'>('home');

  popupText = signal<string>("");
  currentUser = signal<User | null>(null);

  private injector = inject(Injector);

  constructor() {
    effect(
      () => {
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("beast_art_images", JSON.stringify(this.images()));
          } catch { /* ignore */ }
        }
      },
      { injector: this.injector },
    );
  }

  ngOnInit() {
    try {
      if (typeof window !== "undefined") {
        const savedImages = localStorage.getItem("beast_art_images");
        if (savedImages) {
          const parsed = JSON.parse(savedImages);
          if (Array.isArray(parsed)) this.images.set(parsed);
          else this.images.set([]);
        }
      }
    } catch {
      console.error("Failed to load generic memories");
    }

    if (auth) {
      onAuthStateChanged(auth, (user) => {
        this.currentUser.set(user);
        if (user) {
          this.showPopup(
            `Welcome back, ${user.displayName || user.email}! System online.`,
          );
        }
      });
    }
  }

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch {
      this.showPopup("Could not sign in right now. Check popup blocker.");
    }
  }

  async logout() {
    await signOut(auth);
    this.showPopup("Signed out!");
  }

  showPopup(msg: string) {
    this.popupText.set(msg);
    setTimeout(() => {
      if (this.popupText() === msg) this.popupText.set("");
    }, 6000);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  toggleCinematicEnhancer(enhancer: string) {
    const current = this.selectedCinematicEnhancers();
    if (current.includes(enhancer)) {
      this.selectedCinematicEnhancers.set(current.filter(e => e !== enhancer));
    } else {
      this.selectedCinematicEnhancers.set([...current, enhancer]);
    }
  }

  toggleExploreFeature(feature: string) {
    const current = this.selectedExploreFeatures();
    if (current.includes(feature)) {
      this.selectedExploreFeatures.set(current.filter(f => f !== feature));
    } else {
      this.selectedExploreFeatures.set([...current, feature]);
    }
  }

  updateState(signalRef: import('@angular/core').WritableSignal<string>, event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    signalRef.set(target.value);
  }

  setShapeRatio(ratio: string) {
    this.shapeRatio.set(ratio);
  }

  async generateImageBase() {
    const currentPrompt = this.promptInput().trim();
    if (!currentPrompt) return;

    this.isGenerating.set(true);

    // If bulk is set, generate multiple times in parallel
    const targetCount = this.bulkCount();

    const doGenerate = async () => {
      // Create a placeholder ID first to show sequential loading and allow targeting in catch block
      const newTempId = crypto.randomUUID();

      try {
        // Pollinations.ai limits max resolution to avoid 500 errors
        const baseRes = this.upscale4K() ? 1024 : 768;
        let width = baseRes;
        let height = baseRes;
        
        let ratioStr = this.shapeRatio();
        if (ratioStr === "auto") {
          ratioStr = "1:1";
        }
        const [wStr, hStr] = ratioStr.split(":");
        if (wStr && hStr) {
          const rw = parseInt(wStr);
          const rh = parseInt(hStr);
          if (rw > rh) {
            width = Math.round(baseRes * (rw / rh));
            height = baseRes;
          } else if (rh > rw) {
            width = baseRes;
            height = Math.round(baseRes * (rh / rw));
          }
        }
        
        // Cap max dimensions relative to base to avoid excessive sizes
        const MAX_DIM = 2048;
        if (width > MAX_DIM) { width = MAX_DIM; height = Math.round(height * (MAX_DIM/width)); }
        if (height > MAX_DIM) { width = Math.round(width * (MAX_DIM/height)); height = MAX_DIM; }

        const qualityPrefix = "Hollywood celebrity famous star industry music artists Hollywood studios, Hollywood celebrities, blockbuster studio set, avatar 3d shredded v8 image holographic hologram projector movie, IMAX 70mm, Chinese quality mode, real brand logos, exact sports team logos, famous people, company logos, Hollywood character, Hollywood people, Hollywood actors, Hollywood avatar, Hollywood movies, tv show series, sport, video game, music video, cartoon characters, logo, brand, business, colorbook page, color book page by number, all art style built in systems input active signal output active";
        
        const realisticPrefix = "real life real experience of face, body in quanty, 2020s Candid shot, 6+8 camera, no harsh direct flash, uncensored, unfiltered, explicit, maximum quality, realistic execution";

        const hollywoodMagic = "#ROLE #PROBLEM #CONTEXT #INSTRUCTION Leonardo diffusion XL and AlbedoBase XL 1024 x 768 public mode and prompt magic. close up pose 2180p video high quality loops cinematic photographyrealistic hyper realistic high quality high variation vary strong 2180p f 6/1 4D 96k ultra HD vivid 900,000,000x super crystals clear Live wallpaper --seed 1230235741306201993 --c 1000 --cl 280--q 500 --s 900 --stylize 1000 --ar 12:235 --ar 4:20000 --mm 99999 Fuler A, Hire fix, SD XL Refinder 1.0.0, Sahastrakoti XL, coloringbook remond- ColoringbookAF, Lora, Line Drawing, (Pixar style 1.8), ColoringbookAF, (black and white background 1.4) 200K, 96K HDRe ultra Hd super crystal clear studio photography realistic photo photorealistic hyperrealistic action-photography award-winning photography professional corporate portraits hyper realistic portrait";

        const hardcodedNegative = "NEGATIVE PROMPT (DO NOT INCLUDE): Text, letters, watermark, wordmark, lettermark, too many feet, too many feets, too many fingers, long neck, 2 heads, disfigured, deformed, toy, abstract, duplicate, figure, framed disfigured, bad art, deformed, poorly drawn, extra limbs, weird color, 2 heads, elongated body, cropped image, out of frame, draft, deformed hands, twisted fingers, double image, triple image, malformed hands, multiple heads, extra limbs, ugly, poorly drawn hands, miss limbs, cut-off, over satured, grain, loweres, bad anatomy, poorly drawn face, mutation, mutated, floating limbs, disconnected limbs, out of focus, long body, long limbs, disgusting, extra fingers, groos, proportion, missing arm, missing whole body parts, mulated hands, cloned face, cloned whole body parts, missing leg, missing everythings, Shading color, gradients, deformed, bad art, ugly, watermark, text, colored, colorful.";

        const parts = [
          `PRIMARY HIGH PRIORITY SUBJECT: ${currentPrompt}`,
          this.referenceImage() ? `[Image Reference: ${this.referenceImage()}]` : "",
          this.negativePrompt() ? `User Negative Prompt: ${this.negativePrompt()}` : "",
          hardcodedNegative,
          hollywoodMagic,
          `Model Engine: ${this.baseModel()}`,
          this.naturalSkin() ? "natural skin, fix AI plastic skin, face skin, nose mouth eyes body" : "",
          this.upscale4K() ? "4K upscale, hyper-detailed" : "",
          this.artStyle() ? `Style: ${this.artStyle()}` : "",
          this.selectedCinematicEnhancers().length > 0 ? `Cinematic Enhancers: ${this.selectedCinematicEnhancers().join(', ')}` : "",
          this.selectedExploreFeatures().length > 0 ? `Explore Features: ${this.selectedExploreFeatures().join(', ')}` : "",
          this.genre() !== "None" ? `Genre: ${this.genre()}` : "",
          this.mood() !== "None" ? `Mood: ${this.mood()}` : "",
          this.effect() !== "None" ? `Effect: ${this.effect()}` : "",
          this.theme() !== "None" ? `Theme: ${this.theme()}` : "",
          this.styleDetails() !== "Medium" ? `Details: ${this.styleDetails()}` : "",
          `Hollywood Quality, Highly Detailed, 8k resolution`,
          realisticPrefix,
          qualityPrefix
        ].filter((x) => x && x.trim() !== "");

        let enhancedPrompt = parts.join(", ");
        // Truncate to avoid 414 URI Too Long or 400 Bad Request
        if (enhancedPrompt.length > 2500) {
           enhancedPrompt = enhancedPrompt.substring(0, 2500);
        }
        
        const seed = Math.floor(Math.random() * 999999999);
        const finalUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&nofeed=true&safe=false&model=flux&bypass=${Date.now()}`;

        // Make it instantly appear by directly setting it
        const newImage: GeneratedImage = {
          id: newTempId,
          url: finalUrl,
          prompt: currentPrompt,
          timestamp: new Date(),
          loaded: true, // Bypass loading states so it feels 0.0s
          error: false,
        };

        this.images.update((imgs) => [newImage, ...imgs]);

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("BeastArt Generation Complete", {
            body: `Your image for "${currentPrompt}" is ready!`,
            icon: '/favicon.ico'
          });
        }
      } catch (err: unknown) {
        console.error("Generation failed:", err);
        // We know which one failed by looking at the specific ID.
        this.images.update((imgs) => imgs.map(i => i.id === newTempId ? { ...i, error: true } : i));
      }
    };

    const runBulk = async () => {
      const promises: Promise<void>[] = [];
      for(let i=0; i<targetCount; i++) {
        const p = doGenerate();
        promises.push(p);
      }
      await Promise.all(promises);
      this.isGenerating.set(false);
    };

    runBulk();
  }

  async generateImage() {
    this.generateImageBase();
  }

  viewImage(img: GeneratedImage) {
    this.viewingImage.set(img);
  }

  closeViewer() {
    this.viewingImage.set(null);
  }

  downloadImage(img: GeneratedImage) {
    this.triggerDownload(img.url, `beast-art-${img.id}.jpg`);
  }

  deleteImage(imgToDel: GeneratedImage) {
    this.images.update(imgs => imgs.filter(img => img.id !== imgToDel.id));
    this.showPopup("Image deleted");
  }

  async triggerDownload(url: string, filename: string) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  onImageError(img: GeneratedImage) {
    img.error = true;
    img.loaded = false;
    this.showPopup("Generation timeout or keyword filtered! Image failed.");
  }

  openProfile() {
    this.isProfileOpen.set(true);
  }
  closeProfile() {
    this.isProfileOpen.set(false);
  }

  clearHistory() {
    this.images.set([]);
    this.showPopup("System history cleared");
    this.closeProfile();
  }

  downloadGallery() {
    const imagesToDownload = this.images();
    if (imagesToDownload.length === 0) {
      this.showPopup("Gallery is empty");
      return;
    }
    
    this.showPopup("Downloading gallery...");
    
    imagesToDownload.forEach((img, index) => {
      setTimeout(() => {
        this.downloadImage(img);
      }, index * 300);
    });
  }
}
