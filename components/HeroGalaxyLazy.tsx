"use client";

import dynamic from "next/dynamic";

const HeroGalaxy = dynamic(() => import("./HeroGalaxy"), { ssr: false });

export default HeroGalaxy;
