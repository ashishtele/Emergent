"use client";

import dynamic from "next/dynamic";

const InstitutionsGlobe = dynamic(() => import("./InstitutionsGlobe"), { ssr: false });

export default InstitutionsGlobe;
