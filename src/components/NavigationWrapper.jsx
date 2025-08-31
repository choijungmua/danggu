"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";

export default function NavigationWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <Navigation />;
}