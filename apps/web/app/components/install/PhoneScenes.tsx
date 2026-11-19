"use client";

/* Code-drawn phone mockups for the install guide. Each scene is one step of
   one browser's install flow, animated by the `ia-*` keyframes in
   globals.css. Colours here are fixed (they depict a phone's browser UI, not
   the MessMate theme), so the mockups look the same in light and dark mode.
   Browser UI labels stay in English on purpose: that is what the phone shows. */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BatteryFull,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Glasses,
  History,
  Home,
  Info,
  Lock,
  Menu,
  Moon,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Pointer,
  RotateCw,
  Settings,
  Share,
  ShieldCheck,
  Signal,
  SquarePlus,
  Star,
  Wifi,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type SceneId =
  | "ios-safari-bar"
  | "ios-chrome-bar"
  | "ios-share-sheet"
  | "ios-add-confirm"
  | "chrome-bar"
  | "chrome-menu"
  | "samsung-bar"
  | "samsung-menu"
  | "samsung-addto"
  | "android-install"
  | "android-add"
  | "homescreen";

const ICON = "/icons/icon-192.png";

/* ---------- building blocks ---------- */

/** Tap indicator: a ripple plus a pointing hand whose fingertip sits on (x%, y%)
 *  of the nearest positioned ancestor. */
function Finger({ x = 50, y = 50 }: { x?: number; y?: number }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute z-30"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span className="ia-ripple absolute -top-4 -left-4 size-8 rounded-full bg-[#3291ff]/40 ring-2 ring-[#3291ff]" />
      <span className="ia-finger absolute -top-px -left-[10px] block">
        <Pointer
          className="size-7 fill-white text-[#111] drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]"
          strokeWidth={1.6}
        />
      </span>
    </span>
  );
}

/** Marks the element the user should tap: pulsing ring + tint behind it. */
function Target({
  children,
  className,
  innerClassName,
  finger,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  finger?: { x?: number; y?: number };
}) {
  return (
    <span className={cn("relative", className)}>
      <span className="ia-hl absolute -inset-1 rounded-[inherit] bg-[#3291ff]/20 ring-2 ring-[#3291ff]" />
      <span className={cn("relative flex w-full items-center", innerClassName)}>
        {children}
      </span>
      <Finger {...finger} />
    </span>
  );
}

function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={cn(
        "relative z-20 flex h-[7%] items-center justify-between px-[9%] pt-[2%] text-[7px] font-semibold",
        dark ? "text-white" : "text-[#111]",
      )}
    >
      <span>9:41</span>
      <span className="flex items-center gap-0.5">
        <Signal className="size-2" strokeWidth={3} />
        <Wifi className="size-2" strokeWidth={3} />
        <BatteryFull className="size-2.5" strokeWidth={2.5} />
      </span>
    </div>
  );
}

/** A miniature MessMate page, used as the "website" behind browser chrome. */
function PageBody({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex-1 overflow-hidden bg-[#020013] p-[7%]", className)}
    >
      <div className="flex items-center gap-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ICON} alt="" className="size-3.5 rounded-[4px]" />
        <span className="text-[7px] font-bold text-white">MessMate</span>
      </div>
      <div className="mt-[14%] space-y-1">
        <div className="h-1.5 w-[85%] rounded-full bg-white/80" />
        <div className="h-1.5 w-[60%] rounded-full bg-white/80" />
        <div className="h-1 w-[75%] rounded-full bg-white/25" />
        <div className="h-1 w-[55%] rounded-full bg-white/25" />
      </div>
      <div className="mt-[10%] h-3 w-[45%] rounded-[4px] bg-gradient-to-r from-[#ffe61c] to-[#ffa929]" />
      <div className="mt-[12%] grid grid-cols-2 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-7 rounded-md border border-white/10 bg-[#11142b]"
          />
        ))}
      </div>
    </div>
  );
}

function Dim() {
  return <div className="absolute inset-0 z-10 bg-black/45" />;
}

function AppIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ICON} alt="" className={cn("rounded-[22%]", className)} />
  );
}

/* ---------- iOS ---------- */

function IosSafariBar() {
  return (
    <>
      <StatusBar dark />
      <PageBody className="-mt-[7%] pt-[14%]" />
      <div className="bg-[#f2f2f7] px-[6%] pt-[3%] pb-[6%]">
        <div className="flex items-center justify-center gap-1 rounded-lg bg-white py-1 text-[7px] text-[#111] shadow-sm">
          <Lock className="size-2" /> messmate
        </div>
        <div className="mt-[6%] flex items-center justify-between px-[2%] text-[#007aff]">
          <ChevronLeft className="size-3.5" />
          <ChevronRight className="size-3.5 opacity-40" />
          <Target className="rounded-md p-0.5">
            <Share className="size-3.5" />
          </Target>
          <BookOpen className="size-3.5" />
          <Copy className="size-3.5" />
        </div>
      </div>
    </>
  );
}

function IosChromeBar() {
  return (
    <>
      <div className="bg-[#f2f2f7]">
        <StatusBar />
        <div className="px-[5%] pt-[2%] pb-[4%]">
          <div className="flex items-center gap-1 rounded-full bg-white py-1 pr-1 pl-2 text-[7px] text-[#111] shadow-sm">
            <Lock className="size-2" />
            <span className="flex-1">messmate</span>
            <Target className="rounded-full p-0.5">
              <Share className="size-3 text-[#111]" />
            </Target>
          </div>
        </div>
      </div>
      <PageBody />
      <div className="flex items-center justify-between bg-[#f2f2f7] px-[9%] pt-[3%] pb-[7%] text-[#111]">
        <ChevronLeft className="size-3.5" />
        <ChevronRight className="size-3.5 opacity-40" />
        <Plus className="size-3.5" />
        <span className="grid size-3 place-items-center rounded-[3px] border-[1.5px] border-current text-[6px] font-bold">
          2
        </span>
        <MoreHorizontal className="size-3.5" />
      </div>
    </>
  );
}

function IosShareSheet() {
  const rows = [
    { icon: Copy, label: "Copy" },
    { icon: Glasses, label: "Add to Reading List" },
    { icon: BookOpen, label: "Add Bookmark" },
    { icon: Star, label: "Add to Favorites" },
  ];
  return (
    <>
      <StatusBar dark />
      <PageBody className="-mt-[7%] pt-[14%]" />
      <Dim />
      <div className="ia-sheet absolute inset-x-0 bottom-0 z-20 h-[72%] rounded-t-2xl bg-[#f2f2f7] px-[6%] pt-[5%] text-[#111]">
        <div className="flex items-center gap-1.5">
          <AppIcon className="size-6" />
          <div>
            <p className="text-[8px] font-semibold">MessMate</p>
            <p className="text-[6px] text-[#8e8e93]">messmate</p>
          </div>
        </div>
        <div className="mt-[7%] flex justify-between px-[3%]">
          {["#1e90ff", "#34c759", "#0a84ff", "#ffcc00"].map((c) => (
            <span
              key={c}
              className="size-6 rounded-full"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="mt-[7%] overflow-visible rounded-lg bg-white text-[7px]">
          {rows.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-[#e5e5ea] px-2 py-[5px]"
            >
              {label}
              <Icon className="size-2.5" />
            </div>
          ))}
          <Target
            className="flex rounded-md px-2 py-[5px] font-semibold"
            finger={{ x: 40, y: 55 }}
          >
            <span className="flex-1">Add to Home Screen</span>
            <SquarePlus className="size-2.5" />
          </Target>
        </div>
      </div>
    </>
  );
}

function IosAddConfirm() {
  return (
    <div className="ia-sheet flex flex-1 flex-col bg-[#f2f2f7] text-[#111]">
      <StatusBar />
      <div className="flex items-center justify-between px-[6%] py-[4%] text-[7px]">
        <span className="text-[#007aff]">Cancel</span>
        <span className="font-semibold">Add to Home Screen</span>
        <Target className="rounded-md px-1 font-bold text-[#007aff]">
          Add
        </Target>
      </div>
      <div className="mx-[6%] mt-[3%] flex items-center gap-2 rounded-lg bg-white p-2">
        <AppIcon className="size-8" />
        <div className="flex-1">
          <p className="border-b border-[#e5e5ea] pb-1 text-[8px]">MessMate</p>
          <p className="pt-1 text-[6px] text-[#8e8e93]">https://messmate…</p>
        </div>
      </div>
      <p className="mx-[8%] mt-[4%] text-[6px] leading-snug text-[#8e8e93]">
        An icon will be added to your Home Screen so you can quickly access this
        website.
      </p>
    </div>
  );
}

/* ---------- Android ---------- */

function ChromeTopBar({ target }: { target: boolean }) {
  const dots = <MoreVertical className="size-3.5" />;
  return (
    <div className="bg-[#f1f3f4]">
      <StatusBar />
      <div className="flex items-center gap-1.5 px-[4%] pt-[1%] pb-[3%] text-[#3c4043]">
        <Home className="size-3" />
        <div className="flex flex-1 items-center gap-1 rounded-full bg-white px-2 py-1 text-[7px]">
          <Lock className="size-2" /> messmate
        </div>
        <span className="grid size-3 place-items-center rounded-[3px] border-[1.5px] border-current text-[6px] font-bold">
          2
        </span>
        {target ? <Target className="rounded-full p-0.5">{dots}</Target> : dots}
      </div>
    </div>
  );
}

function MenuCard({
  rows,
  highlight,
  className,
  iconRow = false,
}: {
  rows: string[];
  highlight: string;
  className?: string;
  iconRow?: boolean;
}) {
  return (
    <div
      className={cn(
        "ia-dialog absolute z-20 w-[66%] rounded-lg bg-white py-1 text-[7px] text-[#202124] shadow-[0_6px_24px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      {iconRow && (
        <div className="flex justify-between border-b border-[#e8eaed] px-2.5 pt-1 pb-1.5 text-[#3c4043]">
          <ArrowRight className="size-2.5" />
          <Star className="size-2.5" />
          <Download className="size-2.5" />
          <Info className="size-2.5" />
          <RotateCw className="size-2.5" />
        </div>
      )}
      {rows.map((label) =>
        label === highlight ? (
          <Target
            key={label}
            className="flex px-2.5 py-[5px] font-semibold"
            finger={{ x: 45, y: 60 }}
          >
            {label}
          </Target>
        ) : (
          <div key={label} className="px-2.5 py-[5px]">
            {label}
          </div>
        ),
      )}
    </div>
  );
}

function ChromeBar() {
  return (
    <>
      <ChromeTopBar target />
      <PageBody />
    </>
  );
}

function ChromeMenu() {
  return (
    <>
      <ChromeTopBar target={false} />
      <PageBody />
      <MenuCard
        iconRow
        className="top-[8%] right-[3%] origin-top-right"
        rows={[
          "New tab",
          "New Incognito tab",
          "History",
          "Downloads",
          "Bookmarks",
          "Install and create shortcut",
          "Settings",
        ]}
        highlight="Install and create shortcut"
      />
    </>
  );
}

function SamsungTop() {
  return (
    <div className="bg-[#f7f7f9]">
      <StatusBar />
      <div className="px-[4%] pt-[1%] pb-[3%]">
        <div className="flex items-center gap-1 rounded-full bg-[#e9e9ee] px-2 py-1 text-[7px] text-[#222]">
          <Lock className="size-2" />
          <span className="flex-1">messmate</span>
          <Download className="size-2.5 text-[#5a5ad6]" />
        </div>
      </div>
    </div>
  );
}

function SamsungBottomBar({ target }: { target: boolean }) {
  const menu = <Menu className="size-3.5" />;
  return (
    <div className="flex items-center justify-between bg-[#f7f7f9] px-[8%] pt-[3%] pb-[7%] text-[#333]">
      <ChevronLeft className="size-3.5" />
      <ChevronRight className="size-3.5 opacity-40" />
      <Home className="size-3.5" />
      <span className="grid size-3 place-items-center rounded-[3px] border-[1.5px] border-current text-[6px] font-bold">
        2
      </span>
      {target ? <Target className="rounded-md p-0.5">{menu}</Target> : menu}
    </div>
  );
}

function SamsungBar() {
  return (
    <>
      <SamsungTop />
      <PageBody />
      <SamsungBottomBar target />
    </>
  );
}

function SamsungMenu() {
  const items = [
    { icon: Star, label: "Bookmarks" },
    { icon: Download, label: "Downloads" },
    { icon: History, label: "History" },
    { icon: Plus, label: "Add page to" },
    { icon: ShieldCheck, label: "Ad blockers" },
    { icon: Moon, label: "Dark mode" },
    { icon: Settings, label: "Settings" },
    { icon: Info, label: "About" },
  ];
  return (
    <>
      <SamsungTop />
      <PageBody />
      <SamsungBottomBar target={false} />
      <Dim />
      <div className="ia-sheet absolute inset-x-[3%] bottom-[2%] z-20 grid grid-cols-4 gap-y-2 rounded-2xl bg-white px-1 py-3 text-[#222]">
        {items.map(({ icon: Icon, label }) => {
          const body = (
            <>
              <Icon className="size-3.5" />
              <span className="text-center text-[5.5px] leading-tight">
                {label}
              </span>
            </>
          );
          return label === "Add page to" ? (
            <Target
              key={label}
              className="block rounded-lg py-0.5 font-semibold"
              innerClassName="flex-col gap-1"
              finger={{ x: 50, y: 40 }}
            >
              {body}
            </Target>
          ) : (
            <div key={label} className="flex flex-col items-center gap-1">
              {body}
            </div>
          );
        })}
      </div>
    </>
  );
}

function SamsungAddTo() {
  return (
    <>
      <SamsungTop />
      <PageBody />
      <SamsungBottomBar target={false} />
      <Dim />
      <div className="ia-sheet absolute inset-x-[3%] bottom-[2%] z-20 rounded-2xl bg-white px-3 py-3 text-[7px] text-[#222]">
        <p className="mb-1.5 text-[8px] font-bold">Add page to</p>
        {["Bookmarks", "Quick access"].map((l) => (
          <div key={l} className="py-[5px]">
            {l}
          </div>
        ))}
        <Target
          className="flex rounded-md py-[5px] font-semibold"
          finger={{ x: 30, y: 60 }}
        >
          Home screen
        </Target>
        <div className="py-[5px]">Saved pages</div>
      </div>
    </>
  );
}

function AndroidDialog({ title, confirm }: { title: string; confirm: string }) {
  return (
    <>
      <ChromeTopBar target={false} />
      <PageBody />
      <Dim />
      <div className="ia-dialog absolute inset-x-[8%] top-[34%] z-20 rounded-2xl bg-white p-3 text-[#202124]">
        <p className="text-[9px] font-semibold">{title}</p>
        <div className="mt-2.5 flex items-center gap-2">
          <AppIcon className="size-7" />
          <div>
            <p className="text-[8px] font-medium">MessMate</p>
            <p className="text-[6px] text-[#5f6368]">messmate</p>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-3 text-[7.5px] font-semibold text-[#1a73e8]">
          <span className="py-0.5">Cancel</span>
          <Target className="rounded-full px-1.5 py-0.5">{confirm}</Target>
        </div>
      </div>
    </>
  );
}

/* ---------- Home screen ---------- */

const APP_COLORS = [
  "#34c759",
  "#ff9500",
  "#5856d6",
  "#ff2d55",
  "#0a84ff",
  "#ffcc00",
  "#30b0c7",
  "#af52de",
  "#ff3b30",
  "#64d2ff",
  "#a2845e",
];

function Homescreen({ os }: { os: "ios" | "android" }) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col",
        os === "ios"
          ? "bg-gradient-to-b from-[#3b2f8f] via-[#8a4fa0] to-[#e08b7a]"
          : "bg-gradient-to-b from-[#0b3d4a] via-[#1d6b6b] to-[#89b37c]",
      )}
    >
      <StatusBar dark />
      <div className="grid grid-cols-4 gap-x-[9%] gap-y-[9%] px-[9%] pt-[10%]">
        {APP_COLORS.map((c) => (
          <div key={c} className="flex flex-col items-center gap-0.5">
            <span
              className="aspect-square w-full rounded-[24%]"
              style={{ backgroundColor: c }}
            />
            <span className="h-[3px] w-3/4 rounded-full bg-white/50" />
          </div>
        ))}
        <div className="relative flex flex-col items-center gap-0.5">
          <span className="ia-pop relative block w-full">
            <span className="ia-hl absolute -inset-1 rounded-[28%] ring-2 ring-white" />
            <AppIcon className="relative aspect-square w-full" />
          </span>
          <span className="text-[5.5px] font-semibold text-white">
            MessMate
          </span>
          <Finger x={50} y={38} />
        </div>
      </div>
      <div className="mt-auto mb-[5%] grid grid-cols-4 gap-x-[9%] rounded-2xl bg-white/20 px-[7%] py-[4%] mx-[4%]">
        {["#34c759", "#0a84ff", "#ffffff", "#ff9500"].map((c) => (
          <span
            key={c}
            className="aspect-square w-full rounded-[24%]"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- frame ---------- */

function SceneContent({
  scene,
  os,
}: {
  scene: SceneId;
  os: "ios" | "android";
}) {
  switch (scene) {
    case "ios-safari-bar":
      return <IosSafariBar />;
    case "ios-chrome-bar":
      return <IosChromeBar />;
    case "ios-share-sheet":
      return <IosShareSheet />;
    case "ios-add-confirm":
      return <IosAddConfirm />;
    case "chrome-bar":
      return <ChromeBar />;
    case "chrome-menu":
      return <ChromeMenu />;
    case "samsung-bar":
      return <SamsungBar />;
    case "samsung-menu":
      return <SamsungMenu />;
    case "samsung-addto":
      return <SamsungAddTo />;
    case "android-install":
      return <AndroidDialog title="Install app" confirm="Install" />;
    case "android-add":
      return <AndroidDialog title="Add to Home screen" confirm="Add" />;
    case "homescreen":
      return <Homescreen os={os} />;
  }
}

/** Phone frame that plays its scene's animation only while on screen. */
export function PhoneScene({
  scene,
  os,
  className,
}: {
  scene: SceneId;
  os: "ios" | "android";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPlay(!!entry?.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-play={play ? "" : undefined}
      className={cn(
        "install-anim relative aspect-[9/19] w-[190px] shrink-0 rounded-[34px] border-[6px] border-[#1c1c22] bg-[#1c1c22] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10",
        className,
      )}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] bg-[#020013] select-none">
        <SceneContent scene={scene} os={os} />
        {os === "ios" ? (
          <span className="absolute top-[1.6%] left-1/2 z-40 h-[3.2%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
        ) : (
          <span className="absolute top-[1.8%] left-1/2 z-40 size-2 -translate-x-1/2 rounded-full bg-black" />
        )}
        <span
          className={cn(
            "absolute bottom-[1%] left-1/2 z-40 h-[3px] w-[34%] -translate-x-1/2 rounded-full",
            scene === "homescreen" ? "bg-white/80" : "bg-black/70",
          )}
        />
      </div>
    </div>
  );
}
