"use client";

import dynamic from "next/dynamic";

const Navigation = dynamic(() => import("@/components/Navigation"), {
  ssr: false,
  loading: () => <div style={{ height: '60px' }} />
});

export default function ClientNavigationWrapper() {
  return <Navigation />;
}