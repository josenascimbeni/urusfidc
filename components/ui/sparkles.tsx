"use client";

import { useId, useMemo } from "react";
import { motion, useAnimation } from "framer-motion";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import type { Container, Engine, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { cn } from "@/lib/utils";

type ParticlesProps = {
  id?: string;
  className?: string;
  background?: string;
  particleSize?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

const initializeParticles = async (engine: Engine) => {
  await loadSlim(engine);
};

function SparklesCanvas({
  id,
  className,
  background,
  particleSize,
  minSize,
  maxSize,
  speed,
  particleColor,
  particleDensity,
}: ParticlesProps) {
  const controls = useAnimation();
  const generatedId = useId();
  const options = useMemo<ISourceOptions>(() => ({
    background: { color: { value: background || "#0d47a1" } },
    fullScreen: { enable: false, zIndex: 1 },
    fpsLimit: 60,
    interactivity: {
      events: {
        onClick: { enable: true, mode: "push" },
        onHover: { enable: false, mode: "repulse" },
        resize: { enable: true },
      },
      modes: {
        push: { quantity: 4 },
        repulse: { distance: 200, duration: 0.4 },
      },
    },
    particles: {
      collisions: { enable: false },
      color: { value: particleColor || "#ffffff" },
      links: { enable: false },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "out" },
        random: false,
        speed: { min: 0.1, max: 1 },
        straight: false,
      },
      number: {
        density: { enable: true, width: 400, height: 400 },
        value: particleDensity || 120,
      },
      opacity: {
        value: { min: 0.1, max: 1 },
        animation: {
          enable: true,
          speed: speed || 4,
          sync: false,
          mode: "auto",
          startValue: "random",
          destroy: "none",
        },
      },
      shape: { type: "circle" },
      size: {
        value: {
          min: minSize || particleSize || 1,
          max: maxSize || particleSize || 3,
        },
        animation: { enable: false },
      },
    },
    detectRetina: true,
  }), [background, maxSize, minSize, particleColor, particleDensity, particleSize, speed]);

  const particlesLoaded = (container?: Container) => {
    if (container) {
      void controls.start({ opacity: 1, transition: { duration: 1 } });
    }
  };

  return (
    <motion.div animate={controls} className={cn("opacity-0", className)}>
      <Particles
        id={id || generatedId}
        className="h-full w-full"
        particlesLoaded={particlesLoaded}
        options={options}
      />
    </motion.div>
  );
}

export function SparklesCore(props: ParticlesProps) {
  return (
    <ParticlesProvider init={initializeParticles}>
      <SparklesCanvas {...props} />
    </ParticlesProvider>
  );
}
